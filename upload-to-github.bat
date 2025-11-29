@echo off
REM Digital Coffee Voucher - GitHub Upload Script
REM Windows PowerShell 版本

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Digital Coffee Voucher
echo   GitHub Upload Helper
echo ========================================
echo.

set "PROJECT_DIR=f:\bata\digital-coffee-voucher"

REM 檢查項目目錄
if not exist "%PROJECT_DIR%" (
    echo [ERROR] Project directory not found: %PROJECT_DIR%
    pause
    exit /b 1
)

echo [INFO] Project directory: %PROJECT_DIR%

REM 進入項目目錄
cd /d "%PROJECT_DIR%"

REM 檢查 Git 是否已安裝
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [✓] Git is installed
echo.

REM 配置 Git（可選）
echo [STEP 1] Configure Git (optional)
set /p GIT_NAME="Enter your name (or press Enter to skip): "
set /p GIT_EMAIL="Enter your email (or press Enter to skip): "

if not "!GIT_NAME!"=="" (
    git config --global user.name "!GIT_NAME!"
    echo [✓] Git name configured
)

if not "!GIT_EMAIL!"=="" (
    git config --global user.email "!GIT_EMAIL!"
    echo [✓] Git email configured
)

echo.
echo [STEP 2] Initialize Git repository
if exist .git (
    echo [INFO] Git repository already exists
) else (
    git init
    echo [✓] Git repository initialized
)

echo.
echo [STEP 3] Add all files
git add .
echo [✓] All files added

echo.
echo [STEP 4] First commit
git commit -m "Initial commit: Add digital coffee voucher app" 2>nul
if errorlevel 1 (
    echo [INFO] Nothing to commit (repository up to date)
) else (
    echo [✓] First commit created
)

echo.
echo [STEP 5] Add remote repository
set /p GITHUB_USERNAME="Enter your GitHub username: "

if "!GITHUB_USERNAME!"=="" (
    echo [ERROR] GitHub username cannot be empty
    pause
    exit /b 1
)

set "REMOTE_URL=https://github.com/!GITHUB_USERNAME!/digital-coffee-voucher.git"

git remote remove origin 2>nul
git remote add origin "!REMOTE_URL!"
echo [✓] Remote repository added: !REMOTE_URL!

echo.
echo [STEP 6] Rename branch to main
git branch -M main 2>nul
echo [✓] Branch renamed to main

echo.
echo [STEP 7] Push to GitHub
echo [INFO] You will be prompted for authentication
echo [TIP] Use Personal Access Token for better security

git push -u origin main

if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    echo [INFO] Please check your credentials and try again
    pause
    exit /b 1
)

echo.
echo ========================================
echo [✓] SUCCESS! Your project is now on GitHub
echo ========================================
echo.
echo Repository URL: https://github.com/!GITHUB_USERNAME!/digital-coffee-voucher
echo.
pause
