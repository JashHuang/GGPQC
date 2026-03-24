# V6 離線支援實作計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為 V6 版本新增 Service Worker 漸進式快取支援，使背景圖可離線使用

**Architecture:** 使用 Stale-While-Revalidate 策略，Service Worker 攔截圖片請求並快取成功載入的圖片，離線時自動使用快取

**Tech Stack:** Service Worker API, Cache Storage API, React 19, Vite

---

## 檔案結構

```
public/
├── service-worker.js              # SW 主體

src/
├── sw-register.js                 # SW 註冊邏輯
└── utils/
    └── cacheManager.js             # 快取管理工具

src/
├── GoodMorningGeneratorV6.jsx      # 掛載 SW 註冊
└── hooks/
    └── useAutoGenerate.js         # 加入快取鉤子
```

---

## Task 1: 建立 Service Worker 註冊模組

**Files:**
- Create: `src/sw-register.js`

- [ ] **Step 1: 建立 sw-register.js**

```javascript
const SW_URL = '/service-worker.js';

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker 不支援');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL);
    console.log('Service Worker 註冊成功:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker 註冊失敗:', error);
    return null;
  }
};

export const unregisterServiceWorker = async () => {
  const registration = await navigator.serviceWorker.ready;
  if (registration.unregister) {
    await registration.unregister();
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/sw-register.js
git commit -m "feat: add service worker registration module"
```

---

## Task 2: 建立 Service Worker 主體

**Files:**
- Create: `public/service-worker.js`

- [ ] **Step 1: 建立 service-worker.js**

```javascript
const CACHE_NAME = 'gm-v6-bg-cache-v1';
const MAX_CACHE_SIZE = 20;

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 只處理圖片請求
  if (!isImageRequest(url)) {
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

const isImageRequest = (url) => {
  return (
    url.hostname.includes('pexels.com') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('pexels') ||
    url.hostname.includes('loremflickr') ||
    url.hostname.includes('picsum') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp')
  );
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  
  // 嘗試從快取讀取
  const cachedResponse = await cache.match(request);
  
  // 同時發起網路請求
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        // 網路成功，更新快取
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone);
        
        // 清理舊快取（LRU）
        trimCache(cache);
      }
      return networkResponse;
    })
    .catch(() => null);

  // 優先回傳快取，同時更新
  return cachedResponse || fetchPromise;
};

const trimCache = async (cache) => {
  const keys = await cache.keys();
  if (keys.length >= MAX_CACHE_SIZE) {
    // 刪除最舊的（陣列第一個）
    await cache.delete(keys[0]);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add public/service-worker.js
git commit -m "feat: add service worker with stale-while-revalidate strategy"
```

---

## Task 3: 建立快取管理工具

**Files:**
- Create: `src/utils/cacheManager.js`

- [ ] **Step 1: 建立 cacheManager.js**

```javascript
const CACHE_NAME = 'gm-v6-bg-cache-v1';

export const isOffline = () => !navigator.onLine;

export const isCacheSupported = () => 'caches' in window;

export const getCacheSize = async () => {
  if (!isCacheSupported()) return 0;
  
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  return keys.length;
};

export const clearCache = async () => {
  if (!isCacheSupported()) return;
  await caches.delete(CACHE_NAME);
};

export const preloadImages = async (urls) => {
  if (!isCacheSupported()) return;
  
  const cache = await caches.open(CACHE_NAME);
  
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn('預載入圖片失敗:', url, error);
      }
    })
  );
};

export const addOnlineStatusListener = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/cacheManager.js
git commit -m "feat: add cache manager utility"
```

---

## Task 4: 修改 useAutoGenerate.js 加入離線偵測

**Files:**
- Modify: `src/hooks/useAutoGenerate.js`

- [ ] **Step 1: 加入 isUsingCache 狀態**

在 `useAutoGenerate.js` 開頭加入：
```javascript
import { isOffline, isCacheSupported, getCacheSize } from '../utils/cacheManager';

// 新增狀態
const [isUsingCache, setIsUsingCache] = useState(false);
const [cacheReady, setCacheReady] = useState(false);
```

- [ ] **Step 2: 加入離線偵測**

在 `generate` 函式中加入：
```javascript
// 檢查是否使用快取
useEffect(() => {
  const checkCacheStatus = async () => {
    if (!isOffline() && await getCacheSize() > 0) {
      setCacheReady(true);
    }
  };
  checkCacheStatus();
  
  const cleanup = addOnlineStatusListener((isOnline) => {
    if (isOnline && getCacheSize() > 0) {
      setCacheReady(true);
    }
  });
  
  return cleanup;
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAutoGenerate.js
git commit -m "feat: add offline detection to useAutoGenerate"
```

---

## Task 5: 修改 GoodMorningGeneratorV6 掛載 SW

**Files:**
- Modify: `src/GoodMorningGeneratorV6.jsx`

- [ ] **Step 1: 掛載 Service Worker**

在 `V6Content` 元件中加入：
```javascript
import { registerServiceWorker } from './sw-register';
import { addOnlineStatusListener, isOffline } from './utils/cacheManager';

const V6Content = () => {
  // ... existing hooks
  
  // 新增：SW 註冊與離線偵測
  useEffect(() => {
    registerServiceWorker();
    
    const cleanup = addOnlineStatusListener((isOnline) => {
      // 可在此通知 UI 網路狀態變化
      console.log('網路狀態:', isOnline ? '上線' : '離線');
    });
    
    return cleanup;
  }, []);
  
  // ... rest of component
};
```

- [ ] **Step 2: Commit**

```bash
git add src/GoodMorningGeneratorV6.jsx
git commit -m "feat: register service worker on app mount"
```

---

## Task 6: 加入離線提示 UI

**Files:**
- Modify: `src/components/pages/CompletedPage.jsx`

- [ ] **Step 1: 加入離線提示**

```javascript
import { isOffline } from '../../utils/cacheManager';

const CompletedPage = ({ imageData, background, ... }) => {
  const [showOfflineHint, setShowOfflineHint] = useState(false);
  
  useEffect(() => {
    if (isOffline()) {
      setShowOfflineHint(true);
    }
  }, []);
  
  return (
    <div className="gm6-completed">
      {/* 離線提示 */}
      {showOfflineHint && (
        <div className="gm6-offline-hint">
          <span>🖼️ 使用快取的背景</span>
          <small>圖片可能與今天不同</small>
        </div>
      )}
      
      {/* 原有內容 */}
      {/* ... */}
    </div>
  );
};
```

- [ ] **Step 2: 加入 CSS**

在 `src/v6.css` 加入：
```css
.gm6-offline-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  margin-bottom: 16px;
  background: #fef3c7;
  border-radius: 12px;
  color: #92400e;
}

.gm6-offline-hint span {
  font-weight: 600;
}

.gm6-offline-hint small {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.8;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/CompletedPage.jsx src/v6.css
git commit -m "feat: add offline hint UI on completed page"
```

---

## Task 7: Vite 設定 SW 正確部署

**Files:**
- Modify: `vite.config.js` 或 `vite.config.mjs`

- [ ] **Step 1: 確認 public 目錄設定**

Vite 預設會將 `public/` 目錄的檔案複製到 build 輸出，確保 `public/service-worker.js` 存在即可。

- [ ] **Step 2: Commit**

```bash
git add vite.config.js
git commit -m "chore: verify service worker will be included in build"
```

---

## Task 8: 測試與驗證

**測試清單：**

- [ ] **離線測試 1：** 開發者工具 → Network → Offline，點擊「幫我做一張」
  - 預期：顯示離線提示，使用快取圖片成功生成

- [ ] **離線測試 2：** 清除所有快取後離線，點擊「幫我做一張」
  - 預期：顯示「需要網路」提示

- [ ] **快取大小測試：** 連續生成 25 張圖
  - 預期：快取維持在 20 張以內

- [ ] **網路恢復測試：** 離線使用快取後，恢復網路
  - 預期：之後生成正常從網路取得並更新快取

---

## 預估總工時

| Task | 時間 |
|------|------|
| Task 1-2: SW 核心 | 30 分鐘 |
| Task 3: 快取管理工具 | 15 分鐘 |
| Task 4-5: 整合 React | 20 分鐘 |
| Task 6: UI 提示 | 15 分鐘 |
| Task 7-8: 設定與測試 | 20 分鐘 |
| **總計** | **約 1.5 小時** |

---

**計劃結束**
