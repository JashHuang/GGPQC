import React, { useState, useEffect } from 'react';

// IndexedDB 相關常數
const DB_NAME = 'GoodMorningSignatureDB';
const STORE_NAME = 'signatures';
const DB_VERSION = 1;

/**
 * 開啟 IndexedDB
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * 獲取所有簽名檔
 */
const getSignaturesFromDB = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 儲存簽名檔
 */
const saveSignatureToDB = async (signature) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(signature);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * 刪除簽名檔
 */
const deleteSignatureFromDB = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const SignatureManager = ({ isOpen, onClose, onSignatureSelect }) => {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSignaturesFromDB();
        setSignatures(data);
      } catch (error) {
        console.error('載入簽名檔失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) load();
  }, [isOpen]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.includes('png')) {
      alert('請上傳透明背景的 PNG 檔案');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const signature = {
        id: Date.now(),
        name: file.name,
        data: event.target.result,
        width: 200, // 初始預設寬度
        height: 100, // 初始預設高度
        addedAt: Date.now(),
      };
      await saveSignatureToDB(signature);
      setSignatures([...signatures, signature]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此簽名檔嗎？')) return;
    await deleteSignatureFromDB(id);
    setSignatures(signatures.filter((s) => s.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a2330] w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            簽名檔管理員
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 text-center space-y-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">上傳您的簽名檔 (建議使用透明背景 PNG)，選取後將作為固定圖層加入編輯器中。</p>
            <label className="inline-block cursor-pointer">
              <input type="file" className="hidden" accept="image/png" onChange={handleFileUpload} />
              <div className="gm-btn gm-btn-primary px-8 py-2.5">上傳新簽名檔</div>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {signatures.map((sig) => (
              <div key={sig.id} className="group relative bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-orange-200 transition-all">
                <div 
                  className="w-full h-24 flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => {
                    onSignatureSelect(sig);
                    onClose();
                  }}
                >
                  <img src={sig.data} alt={sig.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="text-xs text-gray-500 truncate w-full text-center">{sig.name}</div>
                <button 
                  onClick={() => handleDelete(sig.id)}
                  className="absolute top-2 right-2 p-1 bg-red-50 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {signatures.length === 0 && (
            <div className="py-20 text-center text-gray-400 italic">尚未上傳任何簽名檔</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureManager;
export { getSignaturesFromDB };
