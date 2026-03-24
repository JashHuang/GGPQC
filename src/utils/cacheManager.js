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
