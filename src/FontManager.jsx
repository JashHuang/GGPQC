import React, { useState, useEffect, useCallback } from 'react';

// IndexedDB related constants
const DB_NAME = 'GoodMorningFontsDB';
const STORE_NAME = 'fonts';
const DB_VERSION = 1;

/**
 * Open IndexedDB
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Get all fonts from DB
 */
const getAllFontsFromDB = async () => {
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
 * Save font to DB
 */
const saveFontToDB = async (font) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(font);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete font from DB
 */
const deleteFontFromDB = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Update font in DB
 */
const updateFontInDB = async (font) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(font);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const FontManager = ({ isOpen, onClose, onFontsChange, presetFonts, disabledPresetFonts = [], onTogglePresetFont }) => {
  const [customFonts, setCustomFonts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load custom fonts on mount
  useEffect(() => {
    const loadCustomFonts = async () => {
      try {
        const storedFonts = await getAllFontsFromDB();
        setCustomFonts(storedFonts);
        
        // Load fonts into document
        await Promise.all(storedFonts.map(async (f) => {
          try {
            const fontFace = new FontFace(f.name, f.data);
            await fontFace.load();
            document.fonts.add(fontFace);
          } catch (e) {
            console.error(`無法載入字型: ${f.name}`, e);
          }
        }));
      } catch (error) {
        console.error('載入自訂字型失敗:', error);
      }
    };
    loadCustomFonts();
  }, []);

  // Handle font upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setLoading(true);
    const newFonts = [];

    for (const file of files) {
      // Basic check for font files
      if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) continue;

      try {
        const buffer = await file.arrayBuffer();
        // Remove extension for the name
        const fontName = file.name.replace(/\.[^/.]+$/, "");
        
        const fontObj = {
          name: fontName,
          fileName: file.name,
          data: buffer,
          enabled: true,
          addedAt: Date.now()
        };

        const id = await saveFontToDB(fontObj);
        const savedFont = { ...fontObj, id };
        
        // Register font immediately
        const fontFace = new FontFace(fontName, buffer);
        await fontFace.load();
        document.fonts.add(fontFace);
        
        newFonts.push(savedFont);
      } catch (error) {
        console.error(`匯入字型 ${file.name} 失敗:`, error);
      }
    }

    const updatedCustomFonts = [...customFonts, ...newFonts];
    setCustomFonts(updatedCustomFonts);
    onFontsChange(updatedCustomFonts);
    setLoading(false);
    
    // Reset input
    event.target.value = '';
  };

  const handleToggleCustomFont = async (font) => {
    const updatedFont = { ...font, enabled: !font.enabled };
    try {
      await updateFontInDB(updatedFont);
      const updated = customFonts.map(f => f.id === font.id ? updatedFont : f);
      setCustomFonts(updated);
      onFontsChange(updated);
    } catch (error) {
      console.error('更新字型狀態失敗:', error);
    }
  };

  const handleDeleteFont = async (id, name) => {
    if (!window.confirm(`確定要刪除字型「${name}」嗎？`)) return;

    try {
      await deleteFontFromDB(id);
      const updated = customFonts.filter(f => f.id !== id);
      setCustomFonts(updated);
      onFontsChange(updated);
    } catch (error) {
      console.error('刪除字型失敗:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a2330] w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            字型管理員
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
          {/* Action Area */}
          <div className="bg-[#fffbeb] dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-5 flex flex-col items-center text-center gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">管理您的本地字型檔</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">您可以從電腦中選取 .ttf, .otf, .woff 或 .woff2 格式的字型檔案</p>
            </div>
            <label className="relative cursor-pointer">
              <input 
                type="file" 
                multiple 
                accept=".ttf,.otf,.woff,.woff2" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={loading}
              />
              <div className="gm-btn gm-btn-primary px-8 py-3 shadow-lg shadow-orange-500/20">
                {loading ? '匯入中...' : '匯入字型檔案'}
              </div>
            </label>
          </div>

          {/* Custom Fonts */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">自訂字型 ({customFonts.length})</h3>
            {customFonts.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl text-gray-400 italic">
                尚未匯入任何自訂字型
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {customFonts.map(font => (
                  <div key={font.id} className={`group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 border rounded-xl transition-all ${font.enabled !== false ? 'border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-900/50' : 'opacity-60 border-gray-200 dark:border-gray-700 grayscale-[0.5]'}`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        checked={font.enabled !== false} 
                        onChange={() => handleToggleCustomFont(font)}
                        className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-800 dark:text-gray-200" style={{ fontFamily: `"${font.name}"` }}>
                          {font.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          檔案：{font.fileName}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteFont(font.id, font.name)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="刪除字型"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Preset Fonts */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">內建字型 ({presetFonts.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presetFonts.map((font, idx) => {
                const isEnabled = !disabledPresetFonts.includes(font.name);
                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 bg-gray-100/50 dark:bg-gray-900/30 border rounded-lg text-sm transition-all ${isEnabled ? 'border-gray-200/50 dark:border-gray-800/50 text-gray-600 dark:text-gray-400' : 'opacity-50 border-gray-300 dark:border-gray-700 grayscale italic text-gray-400'}`}>
                    <input 
                      type="checkbox" 
                      checked={isEnabled} 
                      onChange={() => onTogglePresetFont(font.name)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                    <span style={{ fontFamily: `"${font.name}"` }}>{font.name}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 text-center">
          <p className="text-xs text-gray-400">字型檔案儲存於本地瀏覽器資料庫中，更換電腦或瀏覽器需重新匯入</p>
        </div>
      </div>
    </div>
  );
};

export default FontManager;
