#!/bin/bash

# Electron 打包配置腳本
# 使用方法: bash setup-electron.sh

echo "🚀 開始配置 Electron 打包環境..."
echo ""

# 步驟 1: 安裝 Electron 相關依賴
echo "📦 步驟 1/5: 安裝 Electron 依賴..."
npm install --save-dev electron electron-builder concurrently wait-on cross-env

# 步驟 2: 創建 electron 目錄
echo "📁 步驟 2/5: 創建目錄結構..."
mkdir -p electron
mkdir -p build/icons

# 步驟 3: 移動資源到 public 目錄
echo "📂 步驟 3/5: 重組資源目錄..."
mkdir -p public/fonts
mkdir -p public/wisdom

# 提示用戶複製檔案
echo ""
echo "⚠️  請手動執行以下操作："
echo "   1. 將 src/assets/fonts/* 複製到 public/fonts/"
echo "   2. 將 src/assets/正能量語錄/* 複製到 public/wisdom/"
echo ""
echo "   或執行以下命令："
echo "   cp -r src/assets/fonts/* public/fonts/"
echo "   cp -r src/assets/正能量語錄/* public/wisdom/"
echo ""

# 步驟 4: 創建 Electron 主進程文件
echo "📝 步驟 4/5: 創建 Electron 主進程..."
cat > electron/main.js << 'EOF'
const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: '早安圖產生器',
    backgroundColor: '#fef3c7',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
EOF

# 步驟 5: 更新 package.json
echo "⚙️  步驟 5/5: 更新 package.json..."
echo ""
echo "請手動更新 package.json，添加以下內容："
echo ""
echo '{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.yourname.goodmorning",
    "productName": "早安圖產生器",
    "files": ["dist/**/*", "electron/**/*"],
    "extraResources": [
      {"from": "public/fonts", "to": "fonts"},
      {"from": "public/wisdom", "to": "wisdom"}
    ],
    "win": {"target": ["nsis", "portable"]},
    "mac": {"target": ["dmg"]},
    "linux": {"target": ["AppImage", "deb"]}
  }
}'

echo ""
echo "✅ Electron 環境配置完成！"
echo ""
echo "📋 後續步驟："
echo "   1. 複製字型和語錄檔案到 public/ 目錄"
echo "   2. 更新 package.json（參考上面的輸出）"
echo "   3. 準備應用圖示（放在 public/icon.png）"
echo "   4. 修改組件中的資源路徑為 fonts/ 和 wisdom/ (相對路徑)"
echo ""
echo "🚀 開發命令："
echo "   npm run electron:dev     # 開發模式"
echo ""
echo "📦 打包命令："
echo "   npm run electron:build   # 打包所有平台"
echo ""
