import React, { useState, useEffect } from 'react';

// IndexedDB 相關常數
const DB_NAME = 'GoodMorningWisdomDB';
const STORE_NAME = 'custom_wisdom';
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
 * 從資料庫獲取所有自訂語錄
 */
const getCustomWisdomFromDB = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('user_custom');
    request.onsuccess = () => resolve(request.result ? request.result.quotes : []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 儲存自訂語錄到資料庫
 */
const saveCustomWisdomToDB = async (quotes) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id: 'user_custom', quotes, updatedAt: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const WisdomManager = ({ isOpen, onClose, onWisdomChange }) => {
  const [quotes, setQuotes] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // 初次載入
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await getCustomWisdomFromDB();
        setQuotes(stored);
      } catch (error) {
        console.error('載入語錄失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) load();
  }, [isOpen]);

  const handleSave = async () => {
    try {
      await saveCustomWisdomToDB(quotes);
      onWisdomChange(quotes);
      onClose();
    } catch (error) {
      alert('儲存失敗');
    }
  };

  const addQuote = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setQuotes([...quotes, trimmed]);
    setInputText('');
  };

  const removeQuote = (index) => {
    const next = [...quotes];
    next.splice(index, 1);
    setQuotes(next);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      // 簡單解析：如果是 CSV 則嘗試抓第一欄
      const parsed = lines.map(line => {
        if (line.includes(',')) {
          const parts = line.split(',');
          return parts[0].replace(/^["']|["']$/g, '');
        }
        return line;
      });
      setQuotes([...quotes, ...parsed]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a2330] w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            管理語錄庫
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Area */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="輸入新的語錄內容..."
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && addQuote()}
              />
              <button 
                onClick={addQuote}
                className="gm-btn gm-btn-primary px-6"
              >
                新增
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="flex-1 text-center py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                <input type="file" className="hidden" accept=".txt,.csv" onChange={handleImportFile} />
                <span className="text-sm text-gray-500 group-hover:text-orange-500 flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  匯入 TXT/CSV 檔案
                </span>
              </label>
            </div>
          </div>

          {/* List Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                自訂語錄數量: {quotes.length}
              </h3>
              <button 
                onClick={() => setQuotes([])}
                className="text-xs text-red-400 hover:text-red-500"
              >
                清空全部
              </button>
            </div>
            
            <div className="space-y-2">
              {quotes.length === 0 ? (
                <div className="py-12 text-center border border-gray-100 dark:border-gray-800 rounded-xl text-gray-400 italic">
                  目前沒有語錄，請從上方新增或匯入檔案
                </div>
              ) : (
                quotes.map((q, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-orange-200 dark:hover:border-orange-900/50 transition-all">
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex-1 line-clamp-2 pr-4">
                      {q}
                    </div>
                    <button 
                      onClick={() => removeQuote(idx)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="gm-btn gm-btn-primary px-8"
          >
            儲存變更
          </button>
        </div>
      </div>
    </div>
  );
};

export default WisdomManager;
export { getCustomWisdomFromDB };
