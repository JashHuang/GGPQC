# 圖片尺寸設定功能實作計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首頁新增尺寸選擇器，支援 1:1、9:16、4:3 三種長寬比

**Architecture:** 在 HomePage 加入尺寸選擇器元件，useAutoGenerate 根據設定動態調整 canvas 尺寸

**Tech Stack:** React 19, CSS, localStorage

---

## 檔案結構

```
src/
├── components/pages/
│   └── HomePage.jsx           # 新增尺寸選擇器
├── hooks/
│   └── useAutoGenerate.js     # 動態 canvas 尺寸
├── styles/
│   └── v6-tokens.css         # 新增尺寸相關變數
└── v6.css                    # 尺寸選擇器樣式
```

---

## Task 1: 更新 V6 tokens 加入尺寸選擇器變數

**Files:**
- Modify: `src/styles/v6-tokens.css`

- [ ] **Step 1: 新增尺寸選擇器相關變數**

在 `:root` 區塊加入：
```css
/* Aspect Ratio Selector */
--gm6-ratio-btn-height: 48px;
--gm6-ratio-btn-min-width: 80px;
--gm6-ratio-btn-radius: 12px;
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/v6-tokens.css
git commit -m "feat: add aspect ratio selector tokens"
```

---

## Task 2: 新增尺寸選擇器樣式

**Files:**
- Modify: `src/v6.css`

- [ ] **Step 1: 新增尺寸選擇器 CSS**

在 `.gm6-actions` 之前加入：
```css
.gm6-ratio-selector {
  margin-bottom: var(--gm6-spacing-lg);
}

.gm6-ratio-label {
  font-size: var(--gm6-font-size-min);
  font-weight: 600;
  color: var(--gm6-text-secondary);
  margin-bottom: var(--gm6-spacing-sm);
}

.gm6-ratio-options {
  display: flex;
  gap: var(--gm6-spacing-sm);
}

.gm6-ratio-btn {
  flex: 1;
  height: var(--gm6-ratio-btn-height);
  min-width: var(--gm6-ratio-btn-min-width);
  background: var(--gm6-card);
  border: 2px solid #e5e7eb;
  border-radius: var(--gm6-ratio-btn-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.gm6-ratio-btn:hover {
  border-color: var(--gm6-primary-500);
}

.gm6-ratio-btn.is-active {
  border-color: var(--gm6-primary-500);
  background: var(--gm6-primary-100);
}

.gm6-ratio-btn .ratio-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--gm6-text-primary);
}

.gm6-ratio-btn .ratio-name {
  font-size: 12px;
  color: var(--gm6-text-secondary);
}

.gm6-ratio-btn.is-active .ratio-name {
  color: var(--gm6-primary-600);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/v6.css
git commit -m "feat: add aspect ratio selector styles"
```

---

## Task 3: 修改 HomePage 加入尺寸選擇器

**Files:**
- Modify: `src/components/pages/HomePage.jsx`

- [ ] **Step 1: 新增尺寸選擇器元件**

在 `HomePage` 元件中加入：

```javascript
const ASPECT_RATIOS = [
  { value: '1:1', label: '方形' },
  { value: '9:16', label: '直式' },
  { value: '4:3', label: '標準' },
];

const HomePage = ({ settings, onAutoGenerate, onDIY, onSettings }) => {
  // ... existing code

  return (
    <div className="gm6-container">
      {/* ... existing hero ... */}

      <div className="gm6-ratio-selector">
        <div className="gm6-ratio-label">選擇尺寸</div>
        <div className="gm6-ratio-options">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              type="button"
              className={`gm6-ratio-btn ${settings.aspectRatio === ratio.value ? 'is-active' : ''}`}
              onClick={() => settings.updateSettings?.({ aspectRatio: ratio.value })}
            >
              <span className="ratio-value">{ratio.value}</span>
              <span className="ratio-name">{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ... rest of component ... */}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pages/HomePage.jsx
git commit -m "feat: add aspect ratio selector to HomePage"
```

---

## Task 4: 更新 GoodMorningGeneratorV6 傳遞 updateSettings

**Files:**
- Modify: `src/GoodMorningGeneratorV6.jsx`

- [ ] **Step 1: 將 updateSettings 傳遞到 HomePage**

修改 HomePage 的 props：
```jsx
<HomePage 
  settings={settings}
  onAutoGenerate={() => navigate('/auto-generate')}
  onDIY={() => navigate('/diy')}
  onSettings={() => navigate('/settings')}
  onUpdateSettings={updateSettings}
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/GoodMorningGeneratorV6.jsx
git commit -m "feat: pass updateSettings to HomePage"
```

---

## Task 5: 修改 HomePage 接收 onUpdateSettings

**Files:**
- Modify: `src/components/pages/HomePage.jsx`

- [ ] **Step 1: 更新 props 解構**

```javascript
const HomePage = ({ settings, onAutoGenerate, onDIY, onSettings, onUpdateSettings }) => {
```

- [ ] **Step 2: 更新尺寸選擇器的 onClick**

```javascript
onClick={() => onUpdateSettings({ aspectRatio: ratio.value })}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/HomePage.jsx
git commit -m "feat: wire up aspect ratio selection to settings"
```

---

## Task 6: 更新 settings 預設值

**Files:**
- Modify: `src/GoodMorningGeneratorV6.jsx`

- [ ] **Step 1: 加入 aspectRatio 預設值**

```javascript
const getDefaultSettings = () => ({
  userName: '',
  autoAddSignature: false,
  typographyMode: 'balanced',
  signatureMode: 'text',
  signatureAssetId: null,
  signaturePosition: 'bottom-right',
  aspectRatio: '1:1',  // 新增
  editorStylePrefs: {
    greeting: null,
    wisdom: null,
    signature: null,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/GoodMorningGeneratorV6.jsx
git commit -m "feat: add aspectRatio default to settings"
```

---

## Task 7: 修改 useAutoGenerate 支援動態尺寸

**Files:**
- Modify: `src/hooks/useAutoGenerate.js`

- [ ] **Step 1: 新增尺寸對應表**

在檔案開頭加入：
```javascript
const ASPECT_DIMENSIONS = {
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '4:3': { width: 1080, height: 810 },
};
```

- [ ] **Step 2: 修改 createComposedImage 函式**

```javascript
const createComposedImage = async (background, blessing, settings) => {
  const dimensions = ASPECT_DIMENSIONS[settings.aspectRatio] || ASPECT_DIMENSIONS['1:1'];
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  // ... rest of function
};
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAutoGenerate.js
git commit -m "feat: support dynamic canvas dimensions based on aspectRatio"
```

---

## Task 8: 測試與驗證

- [ ] **測試 1:** 點擊不同尺寸按鈕，確認樣式變化
- [ ] **測試 2:** 生成圖片後，確認尺寸正確
- [ ] **測試 3:** 重新整理頁面，確認尺寸設定被記憶
- [ ] **測試 4:** 執行 `npm run lint` 確認無錯誤
- [ ] **測試 5:** 執行 `npm run build` 確認建置成功

---

## 預估總工時

| Task | 時間 |
|------|------|
| Task 1-2: 樣式 | 15 分鐘 |
| Task 3-5: HomePage | 30 分鐘 |
| Task 6: 設定預設值 | 10 分鐘 |
| Task 7: useAutoGenerate | 20 分鐘 |
| Task 8: 測試 | 15 分鐘 |
| **總計** | **約 1.5 小時** |

---

**計劃結束**
