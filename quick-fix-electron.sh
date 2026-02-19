#!/bin/bash

# Electron 打包問題快速檢查和修復腳本
# 使用方法: bash quick-fix-electron.sh

echo "🔍 Electron 打包問題快速檢查工具"
echo "=================================="
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查函數
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 步驟 1: 檢查專案結構
echo "📂 步驟 1: 檢查專案結構"
echo "------------------------"

if [ -d "public/fonts" ]; then
    FONT_COUNT=$(ls public/fonts/*.ttf public/fonts/*.otf 2>/dev/null | wc -l)
    if [ $FONT_COUNT -gt 0 ]; then
        check_pass "public/fonts/ 目錄存在 ($FONT_COUNT 個字型)"
    else
        check_fail "public/fonts/ 目錄存在但沒有字型檔案"
    fi
else
    check_fail "public/fonts/ 目錄不存在"
    echo "   修復: mkdir -p public/fonts && cp -r src/assets/fonts/* public/fonts/"
fi

if [ -d "public/wisdom" ]; then
    WISDOM_COUNT=$(ls public/wisdom/*.txt public/wisdom/*.csv 2>/dev/null | wc -l)
    if [ $WISDOM_COUNT -gt 0 ]; then
        check_pass "public/wisdom/ 目錄存在 ($WISDOM_COUNT 個檔案)"
    else
        check_fail "public/wisdom/ 目錄存在但沒有語錄檔案"
    fi
else
    check_fail "public/wisdom/ 目錄不存在"
    echo "   修復: mkdir -p public/wisdom && cp -r src/assets/正能量語錄/* public/wisdom/"
fi

echo ""

# 步驟 2: 檢查程式碼中的路徑
echo "📝 步驟 2: 檢查程式碼中的路徑"
echo "------------------------"

if grep -q "src/assets/fonts" src/*.jsx 2>/dev/null; then
    check_fail "發現舊路徑 'src/assets/fonts' 在 JSX 檔案中"
    echo "   修復: 需要將所有 /src/assets/fonts/ 改為 ./fonts/ (或 fonts/)"
else
    check_pass "沒有發現舊的 src/assets/fonts 路徑"
fi

if grep -q "src/assets/正能量語錄" src/*.jsx 2>/dev/null; then
    check_fail "發現舊路徑 'src/assets/正能量語錄' 在 JSX 檔案中"
    echo "   修復: 需要將所有 /src/assets/正能量語錄/ 改為 ./wisdom/ (或 wisdom/)"
else
    check_pass "沒有發現舊的 src/assets/正能量語錄 路徑"
fi

echo ""

# 步驟 3: 檢查 vite.config.js
echo "⚙️  步驟 3: 檢查 vite.config.js"
echo "------------------------"

if [ -f "vite.config.js" ]; then
    if grep -q "base.*'./'\\|base.*\"./\"" vite.config.js; then
        check_pass "vite.config.js 中 base 設置正確"
    else
        check_warn "vite.config.js 中可能缺少 base: './' 設置"
        echo "   建議添加: base: './'"
    fi
else
    check_fail "找不到 vite.config.js"
fi

echo ""

# 步驟 4: 測試構建
echo "🔨 步驟 4: 測試構建"
echo "------------------------"

if [ -d "node_modules" ]; then
    echo "開始構建測試..."
    npm run build > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        check_pass "構建成功"
        
        # 檢查 dist 目錄
        if [ -d "dist/fonts" ]; then
            DIST_FONT_COUNT=$(ls dist/fonts/*.ttf dist/fonts/*.otf 2>/dev/null | wc -l)
            check_pass "dist/fonts/ 存在 ($DIST_FONT_COUNT 個字型)"
        else
            check_fail "dist/fonts/ 不存在"
        fi
        
        if [ -d "dist/wisdom" ]; then
            DIST_WISDOM_COUNT=$(ls dist/wisdom/* 2>/dev/null | wc -l)
            check_pass "dist/wisdom/ 存在 ($DIST_WISDOM_COUNT 個檔案)"
        else
            check_fail "dist/wisdom/ 不存在"
        fi
    else
        check_fail "構建失敗"
    fi
else
    check_warn "node_modules 不存在，跳過構建測試"
    echo "   執行: npm install"
fi

echo ""

# 步驟 5: 檢查 electron 配置
echo "⚡ 步驟 5: 檢查 Electron 配置"
echo "------------------------"

if [ -f "electron/main.js" ]; then
    check_pass "electron/main.js 存在"
else
    check_fail "electron/main.js 不存在"
fi

if [ -f "package.json" ]; then
    if grep -q "\"main\".*\"electron" package.json; then
        check_pass "package.json 中 main 欄位指向 electron"
    else
        check_warn "package.json 中可能缺少 main 欄位"
    fi
else
    check_fail "package.json 不存在"
fi

echo ""

# 總結和建議
echo "📋 總結和建議"
echo "=========================="
echo ""

# 自動修復建議
AUTO_FIX=false

if [ ! -d "public/fonts" ] || [ $FONT_COUNT -eq 0 ]; then
    echo "🔧 需要修復: 移動字型到 public/fonts/"
    AUTO_FIX=true
fi

if [ ! -d "public/wisdom" ] || [ $WISDOM_COUNT -eq 0 ]; then
    echo "🔧 需要修復: 移動語錄到 public/wisdom/"
    AUTO_FIX=true
fi

if grep -q "src/assets" src/*.jsx 2>/dev/null; then
    echo "🔧 需要修復: 更新組件中的資源路徑"
    AUTO_FIX=true
fi

if [ "$AUTO_FIX" = true ]; then
    echo ""
    echo "是否自動執行修復? (y/n)"
    read -r response
    
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo ""
        echo "🔧 開始自動修復..."
        echo ""
        
        # 創建目錄
        mkdir -p public/fonts
        mkdir -p public/wisdom
        
        # 移動檔案（如果存在）
        if [ -d "src/assets/fonts" ]; then
            echo "📁 移動字型檔案..."
            cp -r src/assets/fonts/* public/fonts/ 2>/dev/null && check_pass "字型檔案已移動"
        fi
        
        if [ -d "src/assets/正能量語錄" ]; then
            echo "📁 移動語錄檔案..."
            cp -r src/assets/正能量語錄/* public/wisdom/ 2>/dev/null && check_pass "語錄檔案已移動"
        fi
        
        echo ""
        check_pass "自動修復完成！"
        echo ""
        echo "⚠️  注意: 仍需手動檢查程式碼中的路徑是否正確"
        echo "   確保使用 ./fonts/ 和 ./wisdom/ 而非 /fonts/ 或 /src/assets/"
    fi
else
    echo ""
    check_pass "所有檢查通過！可以開始打包了"
    echo ""
    echo "📦 打包命令:"
    echo "   npm run electron:build"
fi

echo ""
echo "🔍 Debug 建議:"
echo "   1. 檢查 dist 目錄: ls -la dist/fonts/ dist/wisdom/"
echo "   2. 測試靜態伺服器: npx serve dist"
echo "   3. 運行 Electron dev: npm run electron:dev"
echo "   4. 打包後檢查: 解壓 AppImage 查看內容"
echo ""
