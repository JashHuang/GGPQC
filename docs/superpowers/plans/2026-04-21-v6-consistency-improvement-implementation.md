# V6 頁面一致性改善實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修復導航邏輯、強化資料流一致性、統一 CSS 樣式，提升 V6 頁面切換時的使用者體驗

**Architecture:** 在 GoodMorningGeneratorV6.jsx 中新增資料驗證與智慧返回邏輯，修正 BottomNav.jsx 的 active 狀態判斷，建立 CSS 樣式隔離機制

**Tech Stack:** React 19, React Router, CSS

---

## 檔案結構

| 檔案 | 動作 | 說明 |
|------|------|------|
| src/components/layout/BottomNav.jsx | 修改 | 修正 active 狀態判斷 |
| src/GoodMorningGeneratorV6.jsx | 修改 | 新增資料驗證、智慧返回、導航攔截 |
| src/v6.css | 修改 | 新增樣式隔離規則 |
| src/components/pages/DIYPage.jsx | 修改 | 強化資料傳遞 |

---

## Task 1: 修正 BottomNav active 狀態

**Files:**
- Modify: `src/components/layout/BottomNav.jsx:1-33`

- [ ] **Step 1: 讀取現有 BottomNav.jsx 程式碼**

```jsx
// 確認現有程式碼結構
import React from 'react';

const BottomNav = ({ currentPath, onHome, onMyName, onSettings }) => {
  return (
    <nav className="gm6-bottom-nav">
      <button 
        className={`gm6-bottom-nav-item ${currentPath === '/' ? 'is-active' : ''}`}
        onClick={onHome}
      >
        <span className="gm6-bottom-nav-icon">🏠</span>
        <span>首頁</span>
      </button>

      <button
        className={`gm6-bottom-nav-item ${currentPath === '/settings' ? 'is-active' : ''}`}
        onClick={onMyName}
      >
        <span className="gm6-bottom-nav-icon">🪪</span>
        <span>我的名字</span>
      </button>
      
      <button 
        className={`gm6-bottom-nav-item ${currentPath === '/settings' ? 'is-active' : ''}`}
        onClick={onSettings}
      >
        <span className="gm6-bottom-nav-icon">⚙️</span>
        <span>設定</span>
      </button>
    </nav>
  );
};
```

- [ ] **Step 2: 修正 active 狀態判斷**

由於「我的名字」和「設定」目前都指向 `/settings`，但功能不同。修正方式為：讓「我的名字」保持現狀（因為它確實是設定頁面的一個功能），或者從 GoodMorningGeneratorV6.jsx 傳入正確的 activeTab 狀態。

**修改方案：** 在 GoodMorningGeneratorV6.jsx 中傳入額外參數 activeTab

```jsx
// src/components/layout/BottomNav.jsx 新版
import React from 'react';

const BottomNav = ({ currentPath, onHome, onMyName, onSettings, activeTab }) => {
  const isSettingsActive = currentPath === '/settings';
  
  return (
    <nav className="gm6-bottom-nav">
      <button 
        className={`gm6-bottom-nav-item ${currentPath === '/' ? 'is-active' : ''}`}
        onClick={onHome}
      >
        <span className="gm6-bottom-nav-icon">🏠</span>
        <span>首頁</span>
      </button>

      <button
        className={`gm6-bottom-nav-item ${isSettingsActive && activeTab === 'name' ? 'is-active' : ''}`}
        onClick={onMyName}
      >
        <span className="gm6-bottom-nav-icon">🪪</span>
        <span>我的名字</span>
      </button>
      
      <button 
        className={`gm6-bottom-nav-item ${isSettingsActive && activeTab !== 'name' ? 'is-active' : ''}`}
        onClick={onSettings}
      >
        <span className="gm6-bottom-nav-icon">⚙️</span>
        <span>設定</span>
      </button>
    </nav>
  );
};

export default BottomNav;
```

- [ ] **Step 3: 更新 GoodMorningGeneratorV6.jsx 傳遞 activeTab 參數**

在 GoodMorningGeneratorV6.jsx 的 BottomNav 調用處新增 activeTab：

```jsx
<BottomNav 
  currentPath={location.pathname}
  onHome={() => navigate('/')}
  onMyName={() => navigate('/settings', { state: { tab: 'name' } })}
  onSettings={() => navigate('/settings', { state: { tab: 'settings' } })}
  activeTab={location.state?.tab}
/>
```

- [ ] **Step 4: 更新 SettingsPage.jsx 支援 tab 參數**

```jsx
// src/components/pages/SettingsPage.jsx
useEffect(() => {
  const tab = location.state?.tab;
  if (tab === 'name') {
    // 聚焦到名字輸入框
    document.querySelector('[name="userName"]')?.focus();
  }
}, [location.state]);
```

- [ ] **Step 5: 執行 lint 檢查**

Run: `npm run lint`
Expected: 無錯誤

- [ ] **Step 6: 提交變更**

```bash
git add src/components/layout/BottomNav.jsx src/GoodMorningGeneratorV6.jsx src/components/pages/SettingsPage.jsx
git commit -m "fix: BottomNav active state logic"
```

---

## Task 2: 實作智慧返回邏輯

**Files:**
- Modify: `src/GoodMorningGeneratorV6.jsx:208-290`

- [ ] **Step 1: 新增 location state 追蹤**

在 V6Content 組件中新增狀態追蹤來源頁面：

```jsx
// 在 GoodMorningGeneratorV6.jsx 的 V6Content 組件中
const [navigationHistory, setNavigationHistory] = React.useState([]);

// 修改導航函式，在導航時記錄來源
const navigateWithHistory = React.useCallback((to, options = {}) => {
  setNavigationHistory(prev => [...prev, location.pathname]);
  navigate(to, { ...options, state: { ...options.state, from: location.pathname } });
}, [navigate, location.pathname]);
```

- [ ] **Step 2: 修改 handleBack 函式**

```jsx
// 替換現有的固定返回邏輯
const handleBack = useCallback(() => {
  const from = location.state?.from;
  if (from && from !== '/') {
    navigate(from, { replace: true });
  } else {
    navigate('/', { replace: true });
  }
}, [location.state, navigate]);
```

- [ ] **Step 3: 更新 Routes 中的導航呼叫**

將所有 `navigate('/')` 改為使用導航時記錄來源：

```jsx
// HomePage 導航
onAutoGenerate={() => navigateWithHistory('/auto-generate')}
onDIY={() => navigateWithHistory('/diy')}

// CompletedPage 導航
onHome={() => navigateWithHistory('/')}

// AutoGenPage 導航 (自動生成後)
navigateWithHistory('/completed')
```

- [ ] **Step 4: 測試導航流程**

手動測試：
1. 首頁 → 幫我做一張 → 完成 → 回 DIY → 回 完成 → 回 首頁
2. 確認每次返回都正確

- [ ] **Step 5: 提交變更**

```bash
git add src/GoodMorningGeneratorV6.jsx
git commit -m "feat: add smart back navigation with history tracking"
```

---

## Task 3: 強化資料流驗證

**Files:**
- Modify: `src/GoodMorningGeneratorV6.jsx:50-210`
- Create: `src/utils/dataValidator.js` (新檔案)

- [ ] **Step 1: 建立資料驗證工具**

```javascript
// src/utils/dataValidator.js
export const normalizeGeneratedData = (data) => {
  if (!data) return null;
  
  return {
    imageData: data?.imageData || null,
    background: data?.background || null,
    blessing: data?.blessing || null,
    editorScene: data?.editorScene || null,
    textBlocks: data?.textBlocks || [],
    canvasSize: data?.canvasSize || { width: 1080, height: 1080 },
    createdAt: data?.createdAt || Date.now(),
    source: data?.source || 'auto', // 'auto' | 'diy'
  };
};

export const isValidGeneratedData = (data) => {
  if (!data) return false;
  return !!(data.imageData || (data.background && data.blessing));
};

export const getValidationError = (data) => {
  if (!data) return '資料不存在';
  if (!data.imageData && !data.background) return '缺少背景圖片';
  if (!data.imageData && !data.blessing) return '缺少祝福語';
  return null;
};
```

- [ ] **Step 2: 更新 handleRegenerate 加入驗證**

```jsx
const handleRegenerate = React.useCallback(async () => {
  const error = getValidationError(generatedData);
  if (error) {
    alert('無法取得生成資料，請重新產生早安圖');
    navigate('/auto-generate', { replace: true });
    return;
  }

  setIsRegenerating(true);
  try {
    const result = await regenerateBlessingOnly(generatedData, settings);
    setGeneratedImage(result.imageData);
    setGeneratedData(normalizeGeneratedData(result));
  } catch (err) {
    console.error('Regenerate failed:', err);
    alert('產生失敗，請稍後再試');
  } finally {
    setIsRegenerating(false);
  }
}, [generatedData, settings, regenerateBlessingOnly, navigate]);
```

- [ ] **Step 3: 更新 handleChangeBackground 加入驗證**

```jsx
const handleChangeBackground = React.useCallback(async () => {
  const error = getValidationError(generatedData);
  if (error) {
    alert('無法取得生成資料，請重新產生早安圖');
    navigate('/auto-generate', { replace: true });
    return;
  }

  setIsRegenerating(true);
  try {
    const result = await regenerateBackgroundOnly(generatedData, settings);
    setGeneratedImage(result.imageData);
    setGeneratedData(normalizeGeneratedData(result));
  } catch (err) {
    console.error('Change background failed:', err);
    alert('更換背景失敗，請稍後再試');
  } finally {
    setIsRegenerating(false);
  }
}, [generatedData, settings, regenerateBackgroundOnly, navigate]);
```

- [ ] **Step 4: 更新 handleDIYComplete 確保資料完整性**

```jsx
const handleDIYComplete = React.useCallback((imageData, diyData) => {
  const extractedPrefs = extractEditorStylePrefs(diyData?.editorScene);
  const mergedSettings = {
    ...settings,
    editorStylePrefs: {
      greeting: extractedPrefs.greeting || settings.editorStylePrefs?.greeting || null,
      wisdom: extractedPrefs.wisdom || settings.editorStylePrefs?.wisdom || null,
      signature: extractedPrefs.signature || settings.editorStylePrefs?.signature || null,
      signatureText: extractedPrefs.signatureText || settings.editorStylePrefs?.signatureText || null,
      canvasSize: extractedPrefs.canvasSize || settings.editorStylePrefs?.canvasSize || null,
    },
  };
  setSettings(mergedSettings);
  saveSettings(mergedSettings);

  const normalizedData = normalizeGeneratedData({
    ...(generatedData || {}),
    ...(diyData || {}),
    imageData,
    source: 'diy',
    createdAt: Date.now(),
  });

  setGeneratedImage(imageData);
  setGeneratedData(normalizedData);
  navigate('/completed', { state: { from: '/diy' } });
}, [navigate, settings, generatedData]);
```

- [ ] **Step 5: 執行 lint 檢查**

Run: `npm run lint`
Expected: 無錯誤

- [ ] **Step 6: 提交變更**

```bash
git add src/utils/dataValidator.js src/GoodMorningGeneratorV6.jsx
git commit -m "feat: add data validation and normalization"
```

---

## Task 4: DIY 資料傳遞強化

**Files:**
- Modify: `src/components/pages/DIYPage.jsx:1-119`
- Modify: `src/GoodMorningGeneratorV6.jsx:199-206`

- [ ] **Step 1: 更新 handleDIYWithCurrent 確保資料完整**

```jsx
const handleDIYWithCurrent = React.useCallback(() => {
  const diyState = {
    imageData: generatedImage, 
    data: generatedData,
    background: generatedData?.background,
    editorScene: generatedData?.editorScene || null,
    // 新增：確保來源資訊
    source: generatedData?.source || 'auto',
    previousPath: location.pathname,
  };
  navigate('/diy', { state: diyState });
}, [generatedImage, generatedData, navigate, location.pathname]);
```

- [ ] **Step 2: 更新 DIYPage useEffect 處理空資料**

```jsx
useEffect(() => {
  const initTimer = setTimeout(() => {
    const event = new CustomEvent('v6-editor-init', {
      detail: {
        background: initialData?.background || null,
        blessing: initialData?.data?.blessing || initialData?.data?.textBlocks?.[0]?.text || null,
        textColor: initialData?.data?.settings?.textColor,
        textColorType: initialData?.data?.settings?.textColorType,
        editorScene: initialData?.editorScene || initialData?.data?.editorScene || null,
        rememberedStyle: settings?.editorStylePrefs || null,
        typographyMode: settings?.typographyMode || 'balanced',
        // 新增：來源標記
        isFromCompleted: initialData?.source === 'diy',
      },
    });
    window.dispatchEvent(event);
  }, 800);

  return () => clearTimeout(initTimer);
}, [initialData, settings]);
```

- [ ] **Step 3: 執行 lint 檢查**

Run: `npm run lint`
Expected: 無錯誤

- [ ] **Step 4: 提交變更**

```bash
git add src/components/pages/DIYPage.jsx src/GoodMorningGeneratorV6.jsx
git commit -m "feat: enhance DIY data transfer with source tracking"
```

---

## Task 5: CSS 樣式隔離

**Files:**
- Modify: `src/v6.css:1-60`
- Modify: `src/good-morning-generator.css` (如有必要)

- [ ] **Step 1: 在 v6.css 新增樣式隔離**

```css
/* 在 src/v6.css 中新增 */
.gm6-diy .gm5-page {
  position: relative;
  z-index: 1;
}

.gm6-diy .gm5-page canvas {
  max-width: 100%;
  height: auto;
}

.gm6-diy .gm5-controls {
  position: relative;
  z-index: 10;
}
```

- [ ] **Step 2: 測試 DIY 頁面樣式**

啟動開發伺服器：
```bash
npm run dev
```

訪問 `/diy` 路徑，確認：
1. V5 編輯器樣式正確顯示
2. V6 頁面樣式（完成按鈕）不受影響
3. 無 CSS 衝突導致的樣式問題

- [ ] **Step 3: 執行 lint 檢查**

Run: `npm run lint`
Expected: 無錯誤

- [ ] **Step 4: 提交變更**

```bash
git add src/v6.css
git commit -m "style: add CSS isolation for V5 editor in V6 pages"
```

---

## Task 6: 整合測試與驗收

**Files:**
- All modified files

- [ ] **Step 1: 完整流程測試**

按照以下路徑測試：
1. 首頁 → 幫我做一張 → 完成
2. 完成頁 → 換一句話 → 完成
3. 完成頁 → 換背景 → 完成
4. 完成頁 → 自己編輯 → DIY 頁面
5. DIY 頁面 → 完成 → 完成頁
6. 完成頁 → 返回按鈕 → 首頁
7. 首頁 → 我自己做 → DIY 頁面
8. DIY 頁面 → 完成 → 完成頁

- [ ] **Step 2: 執行 lint 最終檢查**

Run: `npm run lint`
Expected: 無錯誤

- [ ] **Step 3: 建置測試**

Run: `npm run build`
Expected: 建置成功，dist/ 產生檔案

- [ ] **Step 4: 最終提交**

```bash
git add .
git commit -m "fix: V6 page consistency improvements"
```

---

## 驗收清單

- [ ] BottomNav 的「我的名字」與「設定」按鈕能正確識別 active 狀態
- [ ] Back 按鈕能正確返回上一頁（而非固定返回首頁）
- [ ] generatedData 為空時顯示 alert 提示而非直接跳轉
- [ ] DIY 完成後能正確顯示圖片
- [ ] 從 Completed 回 DIY 再回 Completed 資料正確
- [ ] DIY 頁面樣式與 V6 頁面樣式不衝突
- [ ] lint 檢查通過
- [ ] build 建置成功

---

## 預估時間

| Task | 預估時間 |
|------|----------|
| Task 1: BottomNav 修復 | 15 分鐘 |
| Task 2: 智慧返回 | 20 分鐘 |
| Task 3: 資料流驗證 | 25 分鐘 |
| Task 4: DIY 資料傳遞 | 15 分鐘 |
| Task 5: CSS 隔離 | 15 分鐘 |
| Task 6: 整合測試 | 20 分鐘 |
| **總計** | **約 110 分鐘** |