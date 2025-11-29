# ☕ Digital Coffee Voucher - 數位咖啡兌換券

一個高度安全的 React Native 應用程式，用於展示動態 QR 條碼兌換券。具有截圖偵測、亮度自動控制和時鐘偏差保護等先進安全特性。

![React Native](https://img.shields.io/badge/React%20Native-0.74-61dafb?logo=react)
![Expo](https://img.shields.io/badge/Expo-51-000020?logo=expo)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 主要功能

### 🔒 資安特性
- **截圖偵測**：偵測到截圖時立即失效
- **日誌防護**：生產環境靜音敏感日誌，防止 ADB/Console 洩露
- **螢幕保護**：自動提升亮度，長按顯示條碼
- **時鐘偏差保護**：防止無限 API 轟炸

### 🎯 票證管理
- 動態 QR 碼生成
- 自動過期刷新
- 簽名驗證機制
- 背景應用狀態監控

### 📱 用戶體驗
- 生物辨識指示（指紋圖示）
- 實時倒數計時
- 視覺進度條
- 響應式設計

## 🚀 快速開始

### 前置需求
- Node.js 16+ 和 npm 8+
- Expo CLI（`npm install -g expo-cli`）
- iOS 或 Android 開發環境（選擇）

### 安裝

```bash
# 克隆專案
git clone https://github.com/yourusername/digital-coffee-voucher.git
cd digital-coffee-voucher

# 安裝依賴
npm install
```

### 開發模式

```bash
# 啟動 Expo 開發伺服器
npm start

# 或指定平台
npm run web      # 網頁版
npm run dev      # 開發用戶端
```

### 構建

```bash
# 構建 iOS 和 Android 應用
npm run build
```

## 📁 專案結構

```
digital-coffee-voucher/
├── App.tsx              # 主應用元件
├── app.json             # Expo 配置
├── package.json         # 依賴和腳本
├── README.md            # 本文件
├── .gitignore           # Git 忽略列表
├── .env.example         # 環境變數範例
└── assets/              # 圖片和資源
```

## 🔧 核心修復與最佳實踐

### FIX 1 - 日誌防護封裝
在生產環境中靜音 `console.log/warn/error`，防止敏感資訊透過 ADB 或瀏覽器控制台洩露。

```typescript
const Logger = {
  log: (...args) => { if (__DEV__) console.log(...args); },
  warn: (...args) => { if (__DEV__) console.warn(...args); },
  error: (...args) => { if (__DEV__) console.error(...args); }
};
```

### FIX 2 - 時鐘偏差保護
防止用戶端時間不同步導致的無限 API 轟炸：

```typescript
const remainingSeconds = Math.ceil((expiresAt - now) / 1000);
if (remainingSeconds <= 2) {
  setTimeout(() => refreshTicketCycle(false), 3000);
  return;
}
```

### FIX 3 - 亮度 Lazy Loading 策略
即使初始化時沒有權限，後續獲得權限後仍能正常工作：

```typescript
if (previousBrightnessRef.current === null) {
  previousBrightnessRef.current = await Brightness.getBrightnessAsync();
}
```

### FIX 4 - 正規化重試邏輯
使用參數而非直接操作 Ref：

```typescript
refreshTicketCycle(forceRetry = false)
```

## 🔐 API 端點

此版本使用模擬後端 API（`mockBackendFetchTicket`）。

### 生產環境集成

將 `mockBackendFetchTicket` 替換為實際的 API 呼叫：

```typescript
const actualBackendFetchTicket = async () => {
  const response = await fetch('https://your-api.com/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* 請求體 */ })
  });
  return await response.json();
};
```

## 🌍 環境變數

複製 `.env.example` 為 `.env` 並填入您的配置：

```env
EXPO_PUBLIC_API_URL=https://your-api.com
EXPO_PUBLIC_TICKET_DURATION=60
```

## 📦 依賴

- `react-native` - 跨平台移動應用框架
- `expo` - React Native 工具鏈
- `react-native-qrcode-svg` - QR 碼生成
- `expo-screen-capture` - 截圖偵測與防護
- `expo-brightness` - 螢幕亮度控制
- `@expo/vector-icons` - 圖示庫

## 🧪 測試

```bash
npm test
```

## 📝 許可證

MIT License - 詳見 [LICENSE](LICENSE) 文件

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

1. Fork 此專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📧 聯絡方式

如有問題或建議，請提交 Issue 或聯絡維護者。

## 🙏 致謝

感謝所有開源貢獻者和社群支持！

---

**最後更新**：2025 年 11 月 29 日
