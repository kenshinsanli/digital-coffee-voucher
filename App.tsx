import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Alert, Animated, Easing, AppState, TouchableOpacity, Pressable, ActivityIndicator, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ScreenCapture from 'expo-screen-capture';
import * as Brightness from 'expo-brightness';
import { Ionicons } from '@expo/vector-icons';


// 【FIX 1】資安：日誌防護封裝
// 在生產環境中靜音 Log，防止敏感資訊透過 ADB/Console 洩露
const Logger = {
  log: (...args) => { if (__DEV__) console.log(...args); },
  warn: (...args) => { if (__DEV__) console.warn(...args); },
  error: (...args) => { if (__DEV__) console.error(...args); }
};


// 模擬後端 API
const mockBackendFetchTicket = async () => {
  await new Promise(r => setTimeout(r, 800));
  const now = Date.now();
  const expiresInSeconds = 60;
  return {
    ticketId: "TICKET_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    signature: "sha256_mock_signature_" + now,
    expiresAt: now + (expiresInSeconds * 1000),
    validSeconds: expiresInSeconds
  };
};


export default function App() {
  const [ticketData, setTicketData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isQrRevealed, setIsQrRevealed] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(0);


  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const isMounted = useRef(true);
  const screenshotSubscriptionRef = useRef(null);
  const previousBrightnessRef = useRef(null);
 
  const statusRef = useRef(status);


  useEffect(() => {
    statusRef.current = status;
  }, [status]);


  useEffect(() => {
    isMounted.current = true;
   
    // 初始化權限
    (async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        await Brightness.requestPermissionsAsync();
        // 注意：這裡不急著獲取 previousBrightness，改用 Lazy Load 策略
      } catch (e) { Logger.warn('Init warning:', e); }
    })();


    setupSecurityListener();
    refreshTicketCycle();


    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkValidityOnResume();
      }
      if (nextAppState.match(/inactive|background/)) {
        restoreBrightness();
      }
      appState.current = nextAppState;
    });


    return () => {
      isMounted.current = false;
      stopCountdown();
      subscription.remove();
      if (screenshotSubscriptionRef.current) screenshotSubscriptionRef.current.remove();
      ScreenCapture.allowScreenCaptureAsync();
      restoreBrightness();
    };
  }, []);


  const setupSecurityListener = () => {
    screenshotSubscriptionRef.current = ScreenCapture.addScreenshotListener(() => {
      if (isMounted.current) {
        handleScreenshotDetected();
      }
    });
  };


  const handleScreenshotDetected = useCallback(() => {
    stopCountdown();
    restoreBrightness();
    setTicketData(null);
    setStatus('screenshot_detected');
    // 使用 Alert 而非 console.warn，避免日誌殘留
    Alert.alert("⚠️ 安全警告", "偵測到截圖！條碼已失效。");
  }, []);


  const stopCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };


  // 【FIX 3】修復亮度控制 Bug：採用 Lazy Loading 策略
  // 即使初始化時沒權限，只要使用者後來給了權限，這裡就能正常運作
  const maximizeBrightness = async () => {
    try {
      const { status } = await Brightness.getPermissionsAsync();
      if (status !== 'granted') return;


      // 每次要調亮之前，才去記錄當下的亮度，保證是最新的
      // 並檢查是否已經記錄過（避免多次調用導致記錄到 1.0）
      if (previousBrightnessRef.current === null) {
        previousBrightnessRef.current = await Brightness.getBrightnessAsync();
      }
      await Brightness.setBrightnessAsync(1.0);
    } catch (e) { Logger.warn('Brightness set error:', e); }
  };


  const restoreBrightness = async () => {
    try {
      if (previousBrightnessRef.current !== null) {
        await Brightness.setBrightnessAsync(previousBrightnessRef.current);
        // 恢復後清空記錄，以便下次重新獲取
        previousBrightnessRef.current = null;
      }
    } catch (e) { Logger.warn('Brightness restore error:', e); }
  };


  const handlePressIn = () => {
    if (statusRef.current !== 'success') return;
    setIsQrRevealed(true);
    maximizeBrightness();
  };


  const handlePressOut = () => {
    setTimeout(() => {
      if (isMounted.current) {
        setIsQrRevealed(false);
        restoreBrightness();
      }
    }, 500);
  };


  // 【FIX 4】正規化重試邏輯：接受 forceRetry 參數
  const refreshTicketCycle = useCallback(async (forceRetry = false) => {
    // 如果不是強制重試，且當前狀態是截圖偵測，則阻擋
    if (!isMounted.current || (!forceRetry && statusRef.current === 'screenshot_detected')) return;
   
    try {
      setStatus(prev => (prev === 'error' || !ticketData) ? 'loading' : 'success');
     
      const data = await mockBackendFetchTicket();
     
      // 再次檢查
      if (!isMounted.current || (!forceRetry && statusRef.current === 'screenshot_detected')) return;


      setTicketData(data);
      setStatus('success');
      startCountdown(data.expiresAt, data.validSeconds);


    } catch (error) {
      Logger.error("Fetch Error", error);
      if (isMounted.current) setStatus('error');
    }
  }, [ticketData]);


  const startCountdown = (expiresAt, totalDuration) => {
    stopCountdown();


    // 【FIX 2】邏輯漏洞修復：防止時鐘偏差導致的無限 API 轟炸
    const now = Date.now();
    const remainingSeconds = Math.ceil((expiresAt - now) / 1000);


    // 如果後端給的時間已經過期，或者剩餘時間極短（例如 < 5秒）
    // 我們不應該啟動倒數，也不應該立即刷新（防止無限迴圈）
    // 而是應該顯示錯誤，或等待一段緩衝時間
    if (remainingSeconds <= 2) {
        Logger.warn("Ticket expired on arrival or clock drift detected.");
        // 強制延遲 3 秒後再試，避免 DDOS
        setTimeout(() => refreshTicketCycle(false), 3000);
        return;
    }


    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: totalDuration * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();


    timerRef.current = setInterval(() => {
      if (!isMounted.current) return;


      if (statusRef.current === 'screenshot_detected') {
        stopCountdown();
        return;
      }


      const currentNow = Date.now();
      const currentRemaining = Math.max(0, Math.ceil((expiresAt - currentNow) / 1000));
      setTimeLeft(currentRemaining);


      if (currentNow >= expiresAt) {
        stopCountdown();
        refreshTicketCycle();
      }
    }, 200);
  };


  const checkValidityOnResume = () => {
    if (statusRef.current === 'screenshot_detected') return;
    // 這裡同樣要做時鐘偏差保護
    if (!ticketData || Date.now() >= ticketData.expiresAt - 2000) {
      refreshTicketCycle();
    }
  };


  // UI RENDERERS
 
  const renderQrSection = () => {
      if (!ticketData) return null;
      return (
        <View style={styles.qrWrapper}>
          <View style={styles.liveIndicator}>
            <View style={styles.blinkingDot} />
            <Text style={styles.liveText}>安全憑證有效中</Text>
          </View>
          <Pressable
            style={styles.secureContainer}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={20}
          >
            {isQrRevealed ? (
              <View style={styles.qrBox}>
                <QRCode value={JSON.stringify({ id: ticketData.ticketId, sig: ticketData.signature })} size={200} />
              </View>
            ) : (
              <View style={styles.maskBox}>
                <Ionicons name="finger-print" size={64} color="#666" />
                <Text style={styles.maskText}>長按顯示條碼</Text>
                <Text style={styles.maskSubText}>螢幕將自動調亮</Text>
              </View>
            )}
          </Pressable>
         
          <View
            style={[styles.progressContainer, { opacity: layoutWidth === 0 ? 0 : 1 }]}
            onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View
                style={[
                    styles.progressBar,
                    {
                        width: '100%',
                        transform: [{
                            translateX: layoutWidth > 0 ? progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-layoutWidth, 0]
                            }) : 0
                        }],
                        backgroundColor: '#4caf50'
                    }
                ]}
            />
          </View>
          <Text style={styles.timerText}>將在 {timeLeft} 秒後自動刷新</Text>
        </View>
      );
    };


  const renderContent = () => {
    switch (status) {
      case 'screenshot_detected':
        return (
          <View style={styles.centerBox}>
            <Ionicons name="warning" size={50} color="#d32f2f" />
            <Text style={styles.errorText}>截圖偵測</Text>
            <Text style={styles.errorDesc}>條碼已失效，請重新獲取</Text>
           
            <TouchableOpacity
                style={styles.retryBtn}
                // 【FIX 4】使用參數控制重試，避免手動操作 Ref
                onPress={() => refreshTicketCycle(true)}
            >
               <Text style={styles.retryText}>重新獲取</Text>
            </TouchableOpacity>
          </View>
        );
      case 'error':
        return (
            <View style={styles.centerBox}>
                <Text style={styles.errorText}>連線錯誤</Text>
                <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => refreshTicketCycle(true)}
                >
                    <Text style={styles.retryText}>重試</Text>
                </TouchableOpacity>
            </View>
        );
      case 'loading': return (<View style={styles.centerBox}><ActivityIndicator size="large" color="#4caf50" /><Text style={styles.loadingText}>連線中...</Text></View>);
      case 'success': default: return renderQrSection();
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>☕ 數位咖啡兌換券</Text>
      <Text style={styles.subtitle}>動態條碼・截圖無效</Text>
      <View style={styles.card}>{renderContent()}</View>
    </View>
  );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, letterSpacing: 1 },
    subtitle: { fontSize: 14, color: '#888888', marginBottom: 32 },
    card: { padding: 30, backgroundColor: 'white', borderRadius: 20, alignItems: 'center', width: 320, minHeight: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    qrWrapper: { alignItems: 'center', width: '100%' },
    secureContainer: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fafafa' },
    qrBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', width: '100%' },
    maskBox: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    maskText: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#555' },
    maskSubText: { fontSize: 12, color: '#999', marginTop: 4 },
    centerBox: { width: '100%', height: 260, alignItems: 'center', justifyContent: 'center' },
    errorText: { color: '#333', fontWeight: 'bold', fontSize: 20, marginTop: 10, marginBottom: 5 },
    errorDesc: { color: '#666', fontSize: 12, marginBottom: 20 },
    retryBtn: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: '#333', borderRadius: 20, marginTop: 15 },
    retryText: { color: 'white', fontWeight: 'bold' },
    loadingText: { color: '#666', marginTop: 15 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#e8f5e9', borderRadius: 100 },
    liveText: { fontSize: 12, color: '#2e7d32', fontWeight: '700', marginLeft: 6 },
    blinkingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
    timerText: { marginTop: 10, fontSize: 12, color: '#aaa', fontFamily: 'Courier' },
    progressContainer: { width: 220, height: 6, backgroundColor: '#f1f1f1', borderRadius: 3, marginTop: 25, overflow: 'hidden',  justifyContent: 'center' },
    progressBar: { height: '100%', borderRadius: 3 },
  });
