# 快速上架指令

在 PowerShell 中複製並運行以下指令：

## 📌 配置 Git（首次使用）

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 🚀 上架步驟

```powershell
# 進入項目目錄
cd f:\bata\digital-coffee-voucher

# 初始化 Git 倉庫
git init

# 添加所有文件
git add .

# 進行首次提交
git commit -m "Initial commit: Add digital coffee voucher app"

# 添加遠端倉庫（替換 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/digital-coffee-voucher.git

# 重命名主分支為 main（如需要）
git branch -M main

# 推送到 GitHub
git push -u origin main
```

## ✅ 驗證

推送成功後，訪問：
```
https://github.com/YOUR_USERNAME/digital-coffee-voucher
```

您應該看到所有文件已上傳！

## 💡 提示

- 替換 `YOUR_USERNAME` 為您的 GitHub 帳戶名稱
- 如遇認證問題，使用 Personal Access Token
- 確保在 GitHub 上已創建同名倉庫
