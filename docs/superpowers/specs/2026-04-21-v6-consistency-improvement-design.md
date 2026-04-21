# V6 頁面一致性改善計畫

**最後更新日期：** 2026-04-21

---

## 一、改善目標

提升 V6 版本各頁面切換時的物件一致性與導航邏輯正確性，確保使用者從首頁 → 自動生成 → 完成 → DIY → 完成 的流程中資料正確傳遞。

---

## 二、已知問題

### 2.1 導航邏輯問題

| 問題 | 位置 | 說明 |
|------|------|------|
| BottomNav 狀態錯誤 | `BottomNav.jsx:22-24` | 「我的名字」與「設定」按鈕使用相同判斷條件，永遠同時高亮 |
| Back 按鈈行為固定 | `GoodMorningGeneratorV6.jsx:274` | 固定返回首頁，而非上一頁 |
| 缺少上一頁歷史 | - | 未使用 location.state.from 記錄來源頁面 |

### 2.2 資料流問題

| 問題 | 位置 | 說明 |
|------|------|------|
| generatedData 可能為 null | `handleRegenerate:139-141` | 導致無法regenerate時直接跳轉而非提示用戶 |
| DIY 資料傳遞不完整 | `DIYPage.jsx:85-89` | initialData 為空時可能遺失背景資訊 |
| 資料結構不一致 | - | AutoGen 與 DIY 輸出的 editorScene 結構不同 |

### 2.3 CSS 樣式問題

| 問題 | 位置 | 說明 |
|------|------|------|
| 前綴混用 | `good-morning-generator.css` | 使用 gm5- 前綴，與 V6 的 gm6- 不同 |
| 樣式衝突 | - | DIY 編輯器樣式可能影響 V6 頁面 |

---

## 三、改善方案

### 3.1 導航邏輯修復

#### 3.1.1 修正 BottomNav active 狀態

```jsx
// BottomNav.jsx 修正
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
  // 問題：這裡應該是獨立的判斷
```

**修復方案：** 將「我的名字」改為 `currentPath === '/settings'` 且顯示狀態為 `/settings?tab=name` 或添加獨立路由。

#### 3.1.2 實作智慧返回邏輯

```jsx
// GoodMorningGeneratorV6.jsx
const handleBack = useCallback(() => {
  const from = location.state?.from;
  if (from) {
    navigate(from, { replace: true });
  } else {
    navigate('/', { replace: true });
  }
}, [location.state, navigate]);
```

### 3.2 資料流強化

#### 3.2.1 統一資料結構

```jsx
// 定義統一的 generatedData 結構
const normalizeGeneratedData = (data) => ({
  imageData: data?.imageData || null,
  background: data?.background || null,
  blessing: data?.blessing || null,
  editorScene: data?.editorScene || null,
  createdAt: data?.createdAt || Date.now(),
  source: data?.source || 'auto', // 'auto' | 'diy'
});
```

#### 3.2.2 添加資料驗證

```jsx
const handleRegenerate = useCallback(async () => {
  if (!generatedData?.background || !generatedData?.blessing) {
    // 顯示提示而非直接跳轉
    alert('無法取得生成資料，請重新產生早安圖');
    navigate('/auto-generate', { replace: true });
    return;
  }
  // ... existing logic
}, [generatedData, settings, regenerateBlessingOnly, navigate]);
```

#### 3.2.3 DIY 資料傳遞強化

```jsx
const handleDIYComplete = useCallback((imageData, diyData) => {
  const safeData = {
    ...(initialData?.data || {}),
    ...(diyData || {}),
    // 確保必要欄位存在
    background: diyData?.background || initialData?.background || null,
    editorScene: diyData?.editorScene || null,
  };
  
  setGeneratedImage(imageData);
  setGeneratedData({ ...safeData, imageData, source: 'diy' });
  navigate('/completed', { state: { from: '/diy' } });
}, [navigate, settings]);
```

### 3.3 CSS 樣式統一

#### 3.3.1 建立樣式隔離

在 V6 頁面中使用 CSS 容器選擇器：

```css
.gm6-page .gm5-page {
  /* 隔離 V5 編輯器樣式 */
  position: relative;
  z-index: 1;
}
```

#### 3.3.2 統一前綴使用

| 檔案 | 當前前綴 | 目標前綴 |
|------|----------|----------|
| good-morning-generator.css | gm5- | 維持現狀（V5 編輯器） |
| v6.css | gm6- | gm6- |
| components/ui/v6-ui.css | gm6- | gm6- |

---

## 四、實作順序

1. **Phase 1: 導航修復** (預估 30 分鐘)
   - 修正 BottomNav active 邏輯
   - 實作智慧返回功能

2. **Phase 2: 資料流強化** (預估 60 分鐘)
   - 建立 normalizeGeneratedData 工具函式
   - 添加資料驗證與錯誤處理
   - 改善 DIY 資料傳遞

3. **Phase 3: CSS 統一** (預估 30 分鐘)
   - 建立樣式隔離機制
   - 檢視並修復衝突樣式

4. **Phase 4: 測試驗證** (預估 30 分鐘)
   - 手動測試完整流程
   - 執行 lint 檢查

---

## 五、預期成效

- 使用者在任何頁面都能正確導航
- 資料在頁面切換時不會遺失
- 樣式不會發生衝突
- 錯誤狀態有適當的提示訊息

---

## 六、風險與緩解

| 風險 | 緩解方案 |
|------|----------|
| 修改導航邏輯影響現有流程 | 先在本機測試完整路徑 |
| CSS 變更影響 DIY 編輯器 | 使用容器選擇器隔離 |
| 資料結構變更導致回相容問題 | 保持向後相容，使用 fallback |

---

## 七、驗收標準

- [ ] BottomNav 兩個按鈕能正確識別 active 狀態
- [ ] Back 按鈕能正確返回上一頁
- [ ] generatedData 為空時顯示提示而非直接跳轉
- [ ] DIY 完成後能正確顯示圖片
- [ ] 從 Completed 回 DIY 再回 Completed 資料正確
- [ ] lint 檢查通過