# Good Morning Generator 早安圖產生器

一個以 React 19 + Vite + Tailwind CSS 4 開發的早安圖網頁工具，提供「自動生成」與「DIY 編輯」兩種流程，快速產出可分享的圖片。

## 線上試用

- App 網址: https://gmorning.vercel.app/

## 目前功能（V6）

- 一鍵自動產生早安圖（背景 + 祝福語 + 自動排版）
- 完成頁快速操作：`傳到 LINE`、`下載圖片`、`換背景`、`換一句話`
- DIY 編輯模式：延續既有編輯器能力，進行細部調整後輸出圖片
- 個人設定頁：
- 設定名字與「自動加入簽名」
- 排版密度模式（字體偏大 / 適中 / 精簡）
- 簽名模式（不顯示 / 名字簽名 / 圖片簽名）
- 簽名位置設定（右下、左下、置中、右上、左上）
- 祝福語來源混合內建內容與 `public/wisdom` 檔案資料

## 技術棧

- React 19
- React Router 7
- Vite 7
- Tailwind CSS 4
- IndexedDB（簽名檔儲存）
- localStorage（使用者設定與近期生成歷史）

## 本機開發

```bash
npm install
npm run dev
```

常用指令：

```bash
npm run lint
npm run build
npm run preview
```

## 專案結構（節錄）

```text
src/
├── GoodMorningGeneratorV6.jsx      # V6 主流程與路由
├── hooks/useAutoGenerate.js        # 自動生成邏輯
├── data/backgrounds.js             # 背景與節慶主題資料
├── data/signatureStore.js          # IndexedDB 簽名檔存取
└── components/pages/
    ├── HomePage.jsx
    ├── AutoGenPage.jsx
    ├── CompletedPage.jsx
    ├── DIYPage.jsx
    └── SettingsPage.jsx
```

## 其他說明

- 目前尚未配置測試框架（可規劃導入 Vitest / React Testing Library）
- 專案可搭配 Capacitor 進一步封裝為 Android App
