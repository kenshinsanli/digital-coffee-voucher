# GitHub 上架指南

完整的 React Native 應用已準備好上架到 GitHub。按照以下步驟操作：

## 📋 前置準備

1. **創建 GitHub 帳號**（如未有）
   - 訪問 https://github.com
   - 註冊或登入

2. **配置 Git**（本地機器）
   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **安裝 Git**（如未安裝）
   - 下載：https://git-scm.com/download/win

## 🚀 上架步驟

### 方法 A：使用命令行（推薦）

#### 步驟 1：初始化本地 Git 倉庫

```powershell
cd f:\bata\digital-coffee-voucher
git init
git add .
git commit -m "Initial commit: Add digital coffee voucher app"
```

#### 步驟 2：在 GitHub 創建新倉庫

1. 登入 GitHub
2. 按右上角 **+** 按鈕
3. 選擇 **New repository**
4. 填寫信息：
   - **Repository name**: `digital-coffee-voucher`
   - **Description**: `A secure React Native app for digital coffee voucher with dynamic QR codes and anti-screenshot protection`
   - **Public** 或 **Private**（推薦 Public 便於社群貢獻）
   - ✅ **Add a README file** - 取消勾選（已有 README.md）
   - ✅ **Add .gitignore** - 取消勾選（已有 .gitignore）
   - ✅ **Choose a license** - 取消勾選（已有 LICENSE）

5. 點擊 **Create repository**

#### 步驟 3：連接遠端倉庫並推送

```powershell
# 添加遠端倉庫（替換 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/digital-coffee-voucher.git

# 重命名分支（如需要）
git branch -M main

# 推送到 GitHub
git push -u origin main
```

### 方法 B：使用 GitHub Desktop（GUI）

1. 下載 GitHub Desktop：https://desktop.github.com
2. 安裝並登入
3. 按 **File** → **Add Local Repository**
4. 選擇 `f:\bata\digital-coffee-voucher` 資料夾
5. 填寫提交信息，點擊 **Commit to main**
6. 按 **Publish repository** 按鈕
7. 勾選 **Keep this code private**（可選）
8. 點擊 **Publish Repository**

## 📦 上架後的配置

### 1. 保護主分支（推薦）

在 GitHub 上設置分支保護規則：

1. 進入倉庫 **Settings** → **Branches**
2. 點擊 **Add rule** 添加 `main` 分支
3. 啟用：
   - ✅ Require pull request reviews before merging
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging

### 2. 配置 CI/CD（可選）

創建 `.github/workflows/test.yml`：

```yaml
name: Tests

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm install
      - run: npm test
      - run: npm run build
```

### 3. 添加 Topics（標籤）

在倉庫 **About** 部分添加 Topics：
- `react-native`
- `expo`
- `qrcode`
- `security`
- `voucher`

### 4. 設置 Releases

1. 進入 **Releases**
2. 點擊 **Create a new release**
3. 填寫：
   - **Tag version**: `v1.0.0`
   - **Release title**: `Digital Coffee Voucher v1.0.0`
   - **Description**: 版本更新說明
4. 點擊 **Publish release**

## 🔄 後續更新工作流程

### 本地開發

```powershell
# 創建特性分支
git checkout -b feature/new-feature

# 進行更改後
git add .
git commit -m "feat: add new feature"

# 推送到 GitHub
git push origin feature/new-feature
```

### 在 GitHub 上創建 Pull Request

1. 推送後，訪問倉庫頁面
2. 按 **Compare & pull request**
3. 填寫 PR 描述
4. 點擊 **Create pull request**
5. 等待審查後合併到 `main`

## 📊 倉庫統計

上架後可查看：

- **Insights** → **Contributors** 貢獻者統計
- **Insights** → **Network** 分支網路
- **Insights** → **Traffic** 訪問流量
- **Insights** → **Dependency graph** 依賴分析

## 🔐 安全檢查清單

上架前請確認：

- ✅ `.env` 文件已添加到 `.gitignore`
- ✅ 沒有提交 API 密鑰或令牌
- ✅ `.gitignore` 包含所有敏感文件
- ✅ 未提交 `node_modules/`
- ✅ LICENSE 已設置（MIT）
- ✅ README 包含安全指南

## 📝 提交信息規範

遵循 Conventional Commits：

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: reorganize code
perf: improve performance
test: add tests
chore: update dependencies
```

## 🆘 常見問題

**Q: 推送時收到 "authentication failed" 錯誤？**

A: 使用 Personal Access Token 而非密碼：
```powershell
git remote set-url origin https://<token>@github.com/YOUR_USERNAME/digital-coffee-voucher.git
```

**Q: 如何同步本地與遠端倉庫？**

A: 
```powershell
git fetch origin
git pull origin main
```

**Q: 如何取消已推送的提交？**

A:
```powershell
git revert <commit-hash>
git push origin main
```

## 📚 進階資源

- [GitHub 文檔](https://docs.github.com)
- [Git 官方指南](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org)
- [GitHub Actions](https://docs.github.com/en/actions)

---

準備好後，在終端運行指令即可！ 🚀
