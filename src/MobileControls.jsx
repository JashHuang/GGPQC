import React, { useCallback, useState, useEffect } from 'react';

const HEX_COLOR_REGEX = /^#([a-fA-F0-9]{6})$/;
const toHexColor = (value, fallback = '#000000') => {
  if (!value) return fallback;
  const normalized = String(value).trim();
  if (HEX_COLOR_REGEX.test(normalized)) return normalized.toLowerCase();
  const match = normalized.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return fallback;
  const toByte = (v) => Math.max(0, Math.min(255, parseInt(v, 10)));
  const r = toByte(match[1]);
  const g = toByte(match[2]);
  const b = toByte(match[3]);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const MobileControls = ({
  activeTab,
  setActiveTab,
  isExpanded,
  setIsExpanded,
  onImageUpload,
  onAddTextBlock,
  openFontManager,
  openSignatureManager,
  greetingText,
  setGreetingText,
  syncSelectedByType,
  selectedCategory,
  setSelectedCategory,
  wisdomCategories,
  onGenerateRandomQuote,
  textBlocks,
  selectedIds,
  setSelectedIds,
  setPrimaryId,
  moveLayer,
  updateBlockById,
  allFonts,
  primaryId,
  setGreetingWeight,
  setWisdomWeight,
  onDeleteSelected,
}) => {
  const block = primaryId ? textBlocks.find(b => b.id === primaryId) : null;
  const isSignature = block?.type === 'signature';

  const [activeEditTool, setActiveEditTool] = useState('content');

  useEffect(() => {
    setActiveEditTool('content');
    if (primaryId) {
      setIsExpanded(true);
    }
  }, [primaryId, setIsExpanded]);

  const handleTabClick = useCallback((tabId) => {
    if (activeTab === tabId && isExpanded) {
      setIsExpanded(false);
    } else {
      setActiveTab(tabId);
      setIsExpanded(true);
    }
  }, [activeTab, isExpanded, setActiveTab, setIsExpanded]);

  return (
    <div className="gm5-mobile-bottom-tools">
      <div className="gm5-mobile-drawer-container pointer-events-none">
        <div className={`gm5-mobile-drawer pointer-events-auto is-half ${!isExpanded ? 'is-collapsed' : ''}`}>
          <div
            className="gm5-mobile-drag-handle"
            onClick={() => setIsExpanded(!isExpanded)}
            role="button"
            tabIndex={0}
            aria-label="切換抽屜"
          />

          {/* ===== 文字編輯工具（選中文字圖層時顯示） ===== */}
          {block && !isSignature && (
            <div className="gm5-mobile-tools border-none shadow-none rounded-none bg-transparent mb-0">
              {activeEditTool === 'content' && (
                <div className="gm5-mobile-tool-row bg-transparent px-2">
                  <label className="gm5-mobile-tool-label hidden">文字內容</label>
                  <textarea
                    className="gm5-input gm5-mobile-tool-textarea w-full"
                    value={block.text || ''}
                    onChange={e => updateBlockById(primaryId, { text: e.target.value }, { recordHistory: false })}
                    onBlur={e => updateBlockById(primaryId, { text: e.target.value })}
                    placeholder="輸入文字..."
                  />
                </div>
              )}

              {activeEditTool === 'font' && (
                <div className="gm5-mobile-tool-row bg-transparent px-2">
                  <label className="gm5-mobile-tool-label">選擇字型</label>
                  <select
                    className="gm5-input gm5-mobile-tool-select w-full"
                    value={block.font || ''}
                    onChange={e => updateBlockById(primaryId, { font: e.target.value })}
                  >
                    {allFonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
              )}

              {activeEditTool === 'weight' && (
                <div className="gm5-mobile-tool-row bg-transparent px-2">
                  <label className="gm5-mobile-tool-label">選擇字重</label>
                  <select
                    className="gm5-input gm5-mobile-tool-select w-full"
                    value={block.fontWeight || 400}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      updateBlockById(primaryId, { fontWeight: val });
                      if (block.type === 'greeting') setGreetingWeight?.(val);
                      if (block.type === 'wisdom') setWisdomWeight?.(val);
                    }}
                  >
                    {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeEditTool === 'color' && (
                <div className="gm5-mobile-tool-row bg-transparent px-2 py-4 justify-center">
                  <label className="gm5-mobile-tool-color-btn p-4 rounded-xl shadow-sm border border-gray-100 bg-white">
                    <div className="gm5-mobile-tool-swatch w-12 h-12" style={{ background: toHexColor(block.fillColor, '#000000') }} />
                    <span className="gm5-mobile-tool-color-hex text-base ml-2">{toHexColor(block.fillColor, '#000000')}</span>
                    <input
                      type="color"
                      className="gm5-mobile-tool-hidden-input"
                      value={toHexColor(block.fillColor, '#000000')}
                      onChange={e => updateBlockById(primaryId, { fillColor: e.target.value })}
                    />
                  </label>
                </div>
              )}

              {activeEditTool === 'stroke' && (
                <div className="gm5-mobile-tool-row bg-transparent px-2 flex-col items-center gap-4 py-4">
                  <label className="flex items-center gap-3 text-sm font-bold bg-white px-4 py-2 rounded-lg shadow-sm w-full max-w-[200px] justify-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[#b46b2b]"
                      checked={block.hasStroke ?? true}
                      onChange={e => updateBlockById(primaryId, { hasStroke: e.target.checked })}
                    />
                    開啟文字描邊
                  </label>
                  <label className={`gm5-mobile-tool-color-btn p-4 rounded-xl shadow-sm border border-gray-100 bg-white min-w-[200px] justify-center ${(block.hasStroke ?? true) ? '' : 'is-disabled'}`}>
                    <div className="gm5-mobile-tool-swatch gm5-mobile-tool-swatch--stroke w-12 h-12" style={{ borderColor: toHexColor(block.strokeColor, '#ffffff') }} />
                    <span className="gm5-mobile-tool-color-hex text-base ml-2">{toHexColor(block.strokeColor, '#ffffff')}</span>
                    <input
                      type="color"
                      className="gm5-mobile-tool-hidden-input"
                      value={toHexColor(block.strokeColor, '#ffffff')}
                      onChange={e => updateBlockById(primaryId, { strokeColor: e.target.value })}
                      disabled={!(block.hasStroke ?? true)}
                    />
                  </label>
                </div>
              )}

              {activeEditTool === 'layout' && (
                <div className="gm5-mobile-tool-row bg-transparent px-2 justify-center py-4">
                  <div className="gm5-mobile-tool-toggle-group flex-col sm:flex-row bg-transparent gap-4">
                    <button
                      className={`gm5-mobile-tool-toggle px-8 py-3 rounded-xl border ${block.width >= block.height ? 'is-active border-[#b46b2b]' : 'bg-gray-50 border-gray-200'}`}
                      onClick={() => updateBlockById(primaryId, { width: Math.max(block.width, block.height), height: Math.min(block.width, block.height) })}
                    >
                      <div className="text-lg mb-1">↔️</div>
                      <span>橫書</span>
                    </button>
                    <button
                      className={`gm5-mobile-tool-toggle px-8 py-3 rounded-xl border ${block.height > block.width ? 'is-active border-[#b46b2b]' : 'bg-gray-50 border-gray-200'}`}
                      onClick={() => updateBlockById(primaryId, { width: Math.min(block.width, block.height), height: Math.max(block.width, block.height) })}
                    >
                      <div className="text-lg mb-1">↕️</div>
                      <span>直書</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 簽名檔選中時 */}
          {block && isSignature && (
            <div className="gm5-mobile-tools border-none shadow-none rounded-none bg-transparent">
              <div className="gm5-mobile-tool-row bg-transparent justify-center py-4">
                <span className="text-base font-bold text-gray-600">已選中簽名檔</span>
              </div>
            </div>
          )}

          {/* ===== 設計 tab ===== */}
          {!block && activeTab === 'design' && (
            <div className="gm5-mobile-panel">
              <h3 className="gm5-mobile-panel-title">底圖與簽名</h3>
              <label className="gm5-upload mb-3">
                <input type="file" accept="image/*" onChange={onImageUpload} />
                <span>上傳底圖</span>
              </label>
              <button className="gm5-btn gm5-btn-soft w-full" onClick={openSignatureManager}>管理與套用簽名檔</button>
            </div>
          )}

          {/* ===== 文字 tab（新增文字 + 語錄） ===== */}
          {!block && activeTab === 'text' && (
            <div className="gm5-mobile-panel">
              <h3 className="gm5-mobile-panel-title">文字工具</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button className="gm5-btn gm5-btn-soft" onClick={() => onAddTextBlock('greeting')}>+ 問候語</button>
                <button className="gm5-btn gm5-btn-soft" onClick={() => onAddTextBlock('wisdom')}>+ 智慧語</button>
                <button className="gm5-btn gm5-btn-soft col-span-2" onClick={openFontManager}>全域字型管理</button>
              </div>
              <div className="space-y-3 pt-3 border-t border-black/5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">同步問候語</label>
                  <input
                    className="gm5-input"
                    value={greetingText}
                    onChange={e => { setGreetingText(e.target.value); syncSelectedByType('greeting', { text: e.target.value }); }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">語錄來源</label>
                  <div className="flex gap-2">
                    <select
                      className="gm5-input flex-1"
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(parseInt(e.target.value, 10))}
                    >
                      {wisdomCategories.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
                    </select>
                    <button className="gm5-btn gm5-btn-soft px-3" onClick={onGenerateRandomQuote}>隨機</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== 圖層 tab ===== */}
          {!block && activeTab === 'layers' && (
            <div className="gm5-mobile-panel gm5-mobile-panel--layers">
              <h3 className="gm5-mobile-panel-title">圖層清單</h3>
              <div className="gm5-layers gm5-layers--mobile">
                {textBlocks.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">畫布尚無圖層</p>
                )}
                {[...textBlocks].reverse().map((b, reverseIdx) => {
                  const origIdx = textBlocks.length - 1 - reverseIdx;
                  return (
                    <div key={b.id} className={`gm5-layer ${selectedIds.includes(b.id) ? 'is-selected' : ''}`}>
                      <button
                        className="gm5-layer-main"
                        onClick={() => { setSelectedIds([b.id]); setPrimaryId(b.id); }}
                      >
                        {b.label || (b.text ? b.text.slice(0, 12) : '圖層')}
                      </button>
                      <div className="gm5-layer-actions">
                        {origIdx < textBlocks.length - 1 && (
                          <button onClick={() => moveLayer(b.id, 'up')} title="上移圖層">▲</button>
                        )}
                        {origIdx > 0 && (
                          <button onClick={() => moveLayer(b.id, 'down')} title="下移圖層">▼</button>
                        )}
                        <button onClick={() => updateBlockById(b.id, { visible: !b.visible })}>
                          {b.visible !== false ? '👁️' : '🕶️'}
                        </button>
                        <button onClick={() => updateBlockById(b.id, { locked: !b.locked })}>
                          {b.locked ? '🔒' : '🔓'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部 tab 列 */}
      <div className={`gm5-mobile-tabs ${block ? 'px-0 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide block' : ''}`} style={block ? { display: 'flex', justifyContent: 'flex-start', WebkitOverflowScrolling: 'touch' } : {}}>
        {block ? (
          <div className="flex items-center space-x-2 px-3 pb-1 w-full min-w-max">
            <button
              className="px-3 py-2 text-sm font-bold border rounded-lg mr-2 bg-gray-100 text-gray-600 flex-shrink-0 active:bg-gray-200"
              onClick={() => setSelectedIds([])}
            >
              取消選取
            </button>
            {isSignature ? (
              <button
                className="px-3 py-2 text-sm font-bold border rounded-lg bg-red-50 text-red-600 border-red-200 flex-shrink-0"
                onClick={onDeleteSelected}
              >
                刪除簽名
              </button>
            ) : (
              [
                { id: 'content', label: '文字內容', icon: '📝' },
                { id: 'font', label: '字型', icon: 'Aa' },
                { id: 'weight', label: '字重', icon: '粗' },
                { id: 'color', label: '字型顏色', icon: '🎨' },
                { id: 'stroke', label: '描邊顏色', icon: '🖌️' },
                { id: 'layout', label: '直立排版', icon: '↕️' },
                { id: 'delete', label: '刪除', icon: '🗑️' },
              ].map(tb => (
                <button
                  key={tb.id}
                  className={`px-4 py-2 text-sm font-bold border rounded-lg flex-shrink-0 flex items-center gap-1 transition-colors ${tb.id === 'delete' ? 'bg-red-50 text-red-600 border-red-200' : (activeEditTool === tb.id ? 'bg-[#b46b2b] text-white border-[#b46b2b]' : 'bg-white text-gray-600 border-gray-200')}`}
                  onClick={() => {
                    if (tb.id === 'delete') {
                      onDeleteSelected();
                    } else {
                      if (activeEditTool === tb.id) {
                        setIsExpanded(!isExpanded);
                      } else {
                        setActiveEditTool(tb.id);
                        setIsExpanded(true);
                      }
                    }
                  }}
                >
                  <span className={tb.id === 'font' ? 'font-serif' : ''}>{tb.icon}</span>
                  {tb.label}
                </button>
              ))
            )}
          </div>
        ) : (
          [
            {
              id: 'design', label: '設計', icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )
            },
            {
              id: 'text', label: '文字', icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              )
            },
            {
              id: 'layers', label: '圖層', icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 12 12 17 22 12" />
                  <polyline points="2 17 12 22 22 17" />
                </svg>
              )
            },
          ].map(tab => (
            <button
              key={tab.id}
              className={`gm5-mobile-tab-btn ${(activeTab === tab.id && isExpanded) ? 'is-active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileControls;
