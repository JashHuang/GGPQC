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
