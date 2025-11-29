#!/bin/bash
# Digital Coffee Voucher - GitHub Upload Script
# Bash version for macOS/Linux

set -e

PROJECT_DIR="f:\bata\digital-coffee-voucher"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "  Digital Coffee Voucher"
echo "  GitHub Upload Helper"
echo "========================================"
echo ""

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}[ERROR]${NC} Project directory not found: $PROJECT_DIR"
    exit 1
fi

echo "[INFO] Project directory: $PROJECT_DIR"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Git is not installed"
    echo "Please install Git from https://git-scm.com/download"
    exit 1
fi

echo -e "${GREEN}[✓]${NC} Git is installed"
echo ""

# Step 1: Configure Git
echo "[STEP 1] Configure Git (optional)"
read -p "Enter your name (or press Enter to skip): " GIT_NAME
read -p "Enter your email (or press Enter to skip): " GIT_EMAIL

if [ ! -z "$GIT_NAME" ]; then
    git config --global user.name "$GIT_NAME"
    echo -e "${GREEN}[✓]${NC} Git name configured"
fi

if [ ! -z "$GIT_EMAIL" ]; then
    git config --global user.email "$GIT_EMAIL"
    echo -e "${GREEN}[✓]${NC} Git email configured"
fi

echo ""
echo "[STEP 2] Initialize Git repository"
if [ -d .git ]; then
    echo "[INFO] Git repository already exists"
else
    git init
    echo -e "${GREEN}[✓]${NC} Git repository initialized"
fi

echo ""
echo "[STEP 3] Add all files"
git add .
echo -e "${GREEN}[✓]${NC} All files added"

echo ""
echo "[STEP 4] First commit"
if git commit -m "Initial commit: Add digital coffee voucher app" 2>/dev/null; then
    echo -e "${GREEN}[✓]${NC} First commit created"
else
    echo "[INFO] Nothing to commit (repository up to date)"
fi

echo ""
echo "[STEP 5] Add remote repository"
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo -e "${RED}[ERROR]${NC} GitHub username cannot be empty"
    exit 1
fi

REMOTE_URL="https://github.com/$GITHUB_USERNAME/digital-coffee-voucher.git"

git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
echo -e "${GREEN}[✓]${NC} Remote repository added: $REMOTE_URL"

echo ""
echo "[STEP 6] Rename branch to main"
git branch -M main 2>/dev/null || true
echo -e "${GREEN}[✓]${NC} Branch renamed to main"

echo ""
echo "[STEP 7] Push to GitHub"
echo "[INFO] You will be prompted for authentication"
echo "[TIP] Use Personal Access Token for better security"
echo ""

if git push -u origin main; then
    echo ""
    echo "========================================"
    echo -e "${GREEN}[✓] SUCCESS! Your project is now on GitHub${NC}"
    echo "========================================"
    echo ""
    echo "Repository URL: https://github.com/$GITHUB_USERNAME/digital-coffee-voucher"
    echo ""
else
    echo -e "${RED}[ERROR]${NC} Failed to push to GitHub"
    echo "[INFO] Please check your credentials and try again"
    exit 1
fi
