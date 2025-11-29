# 安全政策 (Security Policy)

## 報告安全漏洞

如果您發現任何安全漏洞，請**不要**公開提交 Issue。

### 報告流程

1. 發送電子郵件至 `security@example.com`
2. 說明漏洞的詳細信息
3. 提供重現步驟
4. 等待我們的回應（通常 48 小時內）

## 支援的版本

| 版本 | 支援狀態 | 最後更新 |
|------|--------|--------|
| 1.x  | ✅ 安全維護 | 2025-11-29 |

## 已知安全特性

### 防護機制
- ✅ 截圖偵測與即時失效
- ✅ 日誌防護 (生產環境靜音)
- ✅ 螢幕亮度控制
- ✅ 時鐘偏差保護
- ✅ AppState 監控

### 最佳實踐
- 使用 HTTPS 進行所有 API 通訊
- 實施伺服器端簽名驗證
- 定期更新依賴庫
- 實施速率限制

## 環境變數

以下環境變數應保密：

```
EXPO_PUBLIC_API_URL
API_SECRET_KEY
SIGNING_KEY
```

## 依賴更新

定期檢查依賴更新：

```bash
npm audit
npm audit fix
npm outdated
```

## 聯絡方式

- **安全郵件**：security@example.com
- **Issue 報告**：[GitHub Issues](https://github.com/yourusername/digital-coffee-voucher/issues)
- **討論區**：[GitHub Discussions](https://github.com/yourusername/digital-coffee-voucher/discussions)
