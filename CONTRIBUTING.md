# 貢獻指南 (Contributing Guide)

感謝您有興趣貢獻這個專案！本文件提供了貢獻流程的指導。

## 行為準則

我們的社群遵循以下原則：
- 尊重所有人
- 包容不同觀點
- 禮貌回應批評
- 專注於對專案最有利的內容

## 如何貢獻

### 報告 Bug

在提交 Bug 報告前，請檢查 [Issues](https://github.com/yourusername/digital-coffee-voucher/issues) 是否已有相同報告。

**提交 Bug 報告時包含：**

1. **簡明標題**：簡要描述問題
2. **詳細描述**：清楚說明預期行為和實際行為
3. **重現步驟**：具體步驟以重現問題
4. **截圖/日誌**：附加日誌、堆疊追蹤或截圖
5. **環境信息**：
   - 作業系統和版本
   - Expo/React Native 版本
   - Node.js 版本

### 提議功能

在提議新功能前，請檢查 [Discussions](https://github.com/yourusername/digital-coffee-voucher/discussions) 中是否已有相似討論。

**提議功能時說明：**

1. 功能的用途與價值
2. 如何實現（如有想法）
3. 潛在的缺點或影響
4. 相關的用例

### 提交 Pull Request

1. **Fork 專案** 並創建您的特性分支：
   ```bash
   git checkout -b feature/AmazingFeature
   ```

2. **進行更改** 並提交：
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

3. **推送到分支**：
   ```bash
   git push origin feature/AmazingFeature
   ```

4. **開啟 Pull Request** 並描述：
   - 更改的目的
   - 如何測試
   - 相關的 Issue 編號

## 開發流程

### 環境設置

```bash
# 克隆並進入目錄
git clone https://github.com/yourusername/digital-coffee-voucher.git
cd digital-coffee-voucher

# 安裝依賴
npm install

# 啟動開發伺服器
npm start
```

### 代碼風格

- 使用 TypeScript
- 遵循 Airbnb JavaScript 風格指南
- 使用 2 個空格進行縮進
- 使用分號

### 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**類型**：
- `feat`: 新功能
- `fix`: 修復 Bug
- `docs`: 文檔更新
- `style`: 代碼風格更改
- `refactor`: 代碼重構
- `perf`: 性能改進
- `test`: 測試相關
- `chore`: 構建、依賴等

**示例**：
```
feat(security): add rate limiting for ticket requests

Add exponential backoff retry logic to prevent
API flooding. Implements 3-second buffer after
clock drift detection.

Fixes #123
```

### 測試

```bash
# 運行測試
npm test

# 生成覆蓋率報告
npm test -- --coverage
```

## Pull Request 檢查清單

提交 PR 前請確認：

- [ ] 代碼遵循項目的風格指南
- [ ] 進行了自我檢查
- [ ] 相應註釋已添加
- [ ] 文檔已更新
- [ ] 沒有新增編譯警告
- [ ] 本地測試通過
- [ ] 新增測試通過
- [ ] 依賴未無故增加

## 問題與支援

- **技術問題**：[GitHub Issues](https://github.com/yourusername/digital-coffee-voucher/issues)
- **討論/想法**：[GitHub Discussions](https://github.com/yourusername/digital-coffee-voucher/discussions)
- **安全問題**：security@example.com

## 許可證

提交貢獻即表示您同意您的貢獻將根據 MIT 許可證發布。

---

感謝您的貢獻！🎉
