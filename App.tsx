import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Alert, Animated, Easing, AppState, TouchableOpacity, Pressable, ActivityIndicator, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ScreenCapture from 'expo-screen-capture';
import * as Brightness from 'expo-brightness';
import { Ionicons } from '@expo/vector-icons';

// 【資安防護】生產環境靜音 Log
const Logger = {
  log: (...args) => { if (__DEV__) console.log(...args); },
  warn: (...args) => { if (__DEV__) console.warn(...args); },
  error: (...args) => { if (__DEV__) console.error(...args); }
};

// 模擬後端 API
const mockBackendFetchTicket = async () => {
  await new Promise(r => setTimeout(r, 800)); // 模擬網路延遲
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
  // --- 狀態管理 ---
  const [ticketData, setTicketData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, success, error, screenshot_detected
  const [timeLeft, setTimeLeft] = useState(60);
  const [isQrRevealed, setIsQrRevealed] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(0);

  // --- Refs & 動畫 ---
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const isMounted = useRef(true);
  const screenshotSubscriptionRef = useRef(null);
  const previousBrightnessRef = useRef(null);
  
  // 解決 Closure 陷阱的 Ref
  const statusRef = useRef(status);
  
  // 網路請求中斷控制器
  const fetchAbortController = useRef(null);

  // 【Fix: 新增 Ref】用於追蹤並取消亮度恢復的 Timer，解決競態條件
  const brightnessTimeoutRef = useRef(null);

  // 同步 status 到 Ref
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // --- 初始化與生命週期 ---
  useEffect(() => {
    isMounted.current = true;
    
    // 初始化權限與設定
    (async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        const { status } = await Brightness.requestPermissionsAsync();
        if (status !== 'granted') Logger.warn('Brightness permission denied');
      } catch (e) { Logger.warn('Init warning:', e); }
    })();

    setupSecurityListener();
    refreshTicketCycle(); // 初始獲取

    // App 狀態監聽 (背景/前景切換)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkValidityOnResume();
      }
      if (nextAppState.match(/inactive|background/)) {
        restoreBrightness(); // 切換到背景時恢復亮度
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
      
      // 組件卸載時取消未完成的請求
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }
      
      // 【Fix】組件卸載時，若有等待中的亮度恢復計時器，一併清除
      if (brightnessTimeoutRef.current) {
        clearTimeout(brightnessTimeoutRef.current);
      }
    };
  }, []); // 依賴項為空，只執行一次

  // --- 安全邏輯 ---
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
    
    // 取消任何進行中的請求
    if (fetchAbortController.current) fetchAbortController.current.abort();
    
    setTicketData(null);
    setStatus('screenshot_detected');
    Alert.alert("⚠️ 安全警告", "偵測到截圖！條碼已失效。");
  }, []);

  // --- 亮度控制邏輯 ---
  const maximizeBrightness = async () => {
    try {
      const { status } = await Brightness.getPermissionsAsync();
      if (status !== 'granted') return;

      // 僅在尚未記錄時記錄當前亮度
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
        previousBrightnessRef.current = null; // 重置
      }
    } catch (e) { Logger.warn('Brightness restore error:', e); }
  };

  // --- 互動處理 (已修復競態條件 Bug) ---
  const handlePressIn = () => {
    if (statusRef.current !== 'success') return;

    // 【Fix】若有正在倒數的「變暗」排程，立即取消，防止手指按著時螢幕變暗
    if (brightnessTimeoutRef.current) {
      clearTimeout(brightnessTimeoutRef.current);
      brightnessTimeoutRef.current = null;
    }

    setIsQrRevealed(true);
    maximizeBrightness();
  };

  const handlePressOut = () => {
    // 【Fix】將 Timer ID 存入 Ref，以便可以被取消
    brightnessTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        setIsQrRevealed(false);
        restoreBrightness();
        brightnessTimeoutRef.current = null; // 執行完畢後清空引用
      }
    }, 500);
  };

  // --- 核心邏輯：獲取票券 ---
  const refreshTicketCycle = useCallback(async (forceRetry = false) => {
    // 安全檢查
    if (!isMounted.current || (!forceRetry && statusRef.current === 'screenshot_detected')) return;
    
    // 1. 取消上一次未完成的請求
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }
    // 2. 建立新的控制器
    fetchAbortController.current = new AbortController();
    const currentSignal = fetchAbortController.current.signal;

    try {
      setStatus(prev => (prev === 'error' || !ticketData) ? 'loading' : 'success');
      
      const data = await mockBackendFetchTicket(); 
      
      // 3. 請求完成後檢查
      if (currentSignal.aborted) return;
      if (!isMounted.current) return;
      if (!forceRetry && statusRef.current === 'screenshot_detected') return;

      setTicketData(data);
      setStatus('success');
      startCountdown(data.expiresAt, data.validSeconds);

    } catch (error) {
      if (currentSignal.aborted) return;
      Logger.error("Fetch Error", error);
      if (isMounted.current) setStatus('error');
    }
  }, [ticketData]); 

  // --- 倒數計時邏輯 ---
  const startCountdown = (expiresAt, totalDuration) => {
    stopCountdown();

    const now = Date.now();
    const remainingSeconds = Math.ceil((expiresAt - now) / 1000);

    if (remainingSeconds <= 2) {
        Logger.warn("Ticket expired on arrival or clock drift detected.");
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
        refreshTicketCycle(); // 自動刷新
      }
    }, 200);
  };

  const stopCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const checkValidityOnResume = () => {
    if (statusRef.current === 'screenshot_detected') return;
    if (!ticketData || Date.now() >= ticketData.expiresAt - 2000) {
      refreshTicketCycle();
    }
  };

  // --- UI Render ---
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
                <QRCode 
                  value={JSON.stringify({ id: ticketData.ticketId, sig: ticketData.signature })} 
                  size={200} 
                  quietZone={10}
                />
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
                onPress={() => refreshTicketCycle(true)}
            >
               <Text style={styles.retryText}>重新獲取</Text>
            </TouchableOpacity>
          </View>
        );
      case 'error':
        return (
            <View style={styles.centerBox}>
                <Ionicons name="cloud-offline" size={50} color="#666" />
                <Text style={styles.errorText}>連線錯誤</Text>
                <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => refreshTicketCycle(true)}
                >
                    <Text style={styles.retryText}>重試</Text>
                </TouchableOpacity>
            </View>
        );
      case 'loading': 
        return (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#4caf50" />
            <Text style={styles.loadingText}>連線中...</Text>
          </View>
        );
      case 'success': 
      default: 
        return renderQrSection();
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
