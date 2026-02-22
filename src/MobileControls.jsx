import React from 'react';

// Mini property editor shown inside drawer when something is selected
const MobilePropertyBar = ({ primaryId, textBlocks, updateBlockById, allFonts, setGreetingWeight, setWisdomWeight, onDelete }) => {
  const block = textBlocks.find(b => b.id === primaryId);
  if (!block) return null;
  if (block.type === 'signature') {
    return (
      <div className="gm5-mobile-context-bar">
        <span className="text-sm font-bold text-gray-600 flex-1">已選中簽名檔</span>
        <button className="gm5-btn gm5-btn-danger !min-h-8 !h-8 !px-3 !rounded-lg text-sm" onClick={onDelete}>刪除</button>
      </div>
    );
  }
  return (
    <div className="gm5-mobile-context-bar">
      <div className="w-full flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">選中圖層屬性</span>
        <button className="gm5-btn gm5-btn-danger !min-h-7 !h-7 !px-2.5 !rounded-lg text-xs" onClick={onDelete}>刪除</button>
      </div>
      {/* Text content */}
      <textarea
        className="gm5-input w-full text-sm resize"
        style={{ minHeight: '52px', overflow: 'auto' }}
        value={block.text || ''}
        onChange={e => updateBlockById(primaryId, { text: e.target.value }, { recordHistory: false })}
        onBlur={e => updateBlockById(primaryId, { text: e.target.value })}
        placeholder="圖層文字..."
      />
      {/* Font + weight */}
      <div className="flex gap-2 w-full">
        <select
          className="gm5-input flex-1 text-sm"
          value={block.font || ''}
          onChange={e => updateBlockById(primaryId, { font: e.target.value })}
        >
          {allFonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
        </select>
        <select
          className="gm5-input !w-20 text-sm"
          value={block.fontWeight || 400}
          onChange={e => {
            const val = parseInt(e.target.value, 10);
            updateBlockById(primaryId, { fontWeight: val });
            if (block.type === 'greeting') setGreetingWeight?.(val);
            if (block.type === 'wisdom') setWisdomWeight?.(val);
          }}
        >
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      {/* Color + orientation */}
      <div className="flex gap-2 w-full items-center">
        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-black/5 px-3 py-2 rounded-lg">
          <div className="w-4 h-4 rounded-full border border-black/10" style={{ background: block.fillColor || '#000' }} />
          填色
          <input type="color" className="opacity-0 absolute w-0 h-0" value={block.fillColor || '#000000'} onChange={e => updateBlockById(primaryId, { fillColor: e.target.value })} />
        </label>
        <label className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-black/5 px-2 py-2 rounded-lg ${(block.hasStroke ?? true) ? '' : 'opacity-40'}`}>
          <input type="checkbox" className="w-3 h-3" checked={block.hasStroke ?? true} onChange={e => updateBlockById(primaryId, { hasStroke: e.target.checked })} />
          <div className="w-4 h-4 rounded-md border-2 pointer-events-none" style={{ borderColor: block.strokeColor || '#fff', background: 'transparent' }} />
          描邊
          <input type="color" className="opacity-0 absolute w-0 h-0" value={block.strokeColor || '#ffffff'} onChange={e => updateBlockById(primaryId, { strokeColor: e.target.value })} disabled={!(block.hasStroke ?? true)} />
        </label>
        <div className="flex ml-auto bg-black/5 rounded-lg p-0.5">
          <button
            className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${block.width >= block.height ? 'bg-white shadow-sm' : 'opacity-50'}`}
            onClick={() => updateBlockById(primaryId, { width: Math.max(block.width, block.height), height: Math.min(block.width, block.height) })}
          >橫</button>
          <button
            className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${block.height > block.width ? 'bg-white shadow-sm' : 'opacity-50'}`}
            onClick={() => updateBlockById(primaryId, { width: Math.min(block.width, block.height), height: Math.max(block.width, block.height) })}
          >直</button>
        </div>
      </div>
    </div>
  );
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
  return (
    <div className="gm5-mobile-bottom-tools">
      <div className="gm5-mobile-drawer-container pointer-events-none">
        <div className={`gm5-mobile-drawer pointer-events-auto ${!isExpanded ? 'is-collapsed' : ''}`}>

          {activeTab === 'design' && (
            <div className="gm5-mobile-panel">
              <div className="flex justify-between items-center mb-3">
                <h3 className="gm5-mobile-panel-title !mb-0">底圖與簽名</h3>
                <button className="text-xs text-blue-500 font-bold" onClick={() => setIsExpanded(false)}>收起</button>
              </div>
              {primaryId && (
                <MobilePropertyBar
                  primaryId={primaryId}
                  textBlocks={textBlocks}
                  updateBlockById={updateBlockById}
                  allFonts={allFonts}
                  setGreetingWeight={setGreetingWeight}
                  setWisdomWeight={setWisdomWeight}
                  onDelete={onDeleteSelected}
                />
              )}
              <label className="gm5-upload mb-3">
                <input type="file" accept="image/*" onChange={onImageUpload} />
                <span>上傳底圖</span>
              </label>
              <button className="gm5-btn gm5-btn-soft w-full" onClick={openSignatureManager}>管理與套用簽名檔</button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="gm5-mobile-panel">
              <div className="flex justify-between items-center mb-3">
                <h3 className="gm5-mobile-panel-title !mb-0">文字工具</h3>
                <button className="text-xs text-blue-500 font-bold" onClick={() => setIsExpanded(false)}>收起</button>
              </div>
              {/* If a text layer is selected, show inline property editor first */}
              {primaryId && (
                <MobilePropertyBar
                  primaryId={primaryId}
                  textBlocks={textBlocks}
                  updateBlockById={updateBlockById}
                  allFonts={allFonts}
                  setGreetingWeight={setGreetingWeight}
                  setWisdomWeight={setWisdomWeight}
                  onDelete={onDeleteSelected}
                />
              )}
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

          {activeTab === 'layers' && (
            <div className="gm5-mobile-panel">
              <div className="flex justify-between items-center mb-3">
                <h3 className="gm5-mobile-panel-title !mb-0">圖層清單</h3>
                <button className="text-xs text-blue-500 font-bold" onClick={() => setIsExpanded(false)}>收起</button>
              </div>
              {primaryId && (
                <MobilePropertyBar
                  primaryId={primaryId}
                  textBlocks={textBlocks}
                  updateBlockById={updateBlockById}
                  allFonts={allFonts}
                  setGreetingWeight={setGreetingWeight}
                  setWisdomWeight={setWisdomWeight}
                  onDelete={onDeleteSelected}
                />
              )}
              <div className="gm5-layers max-h-[30vh]">
                {textBlocks.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">畫布尚無圖層</p>
                )}
                {[...textBlocks].reverse().map(b => (
                  <div key={b.id} className={`gm5-layer ${selectedIds.includes(b.id) ? 'is-selected' : ''}`}>
                    <button
                      className="gm5-layer-main"
                      onClick={() => { setSelectedIds([b.id]); setPrimaryId(b.id); }}
                    >
                      {b.label || (b.text ? b.text.slice(0, 12) : '圖層')}
                    </button>
                    <div className="gm5-layer-actions">
                      <button onClick={() => updateBlockById(b.id, { visible: !b.visible })}>
                        {b.visible !== false ? '👁️' : '🕶️'}
                      </button>
                      <button onClick={() => updateBlockById(b.id, { locked: !b.locked })}>
                        {b.locked ? '🔒' : '🔓'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="gm5-mobile-tabs">
        {[
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
            className="gm5-btn"
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              color: activeTab === tab.id && isExpanded ? 'var(--gm-accent)' : 'var(--gm-text-muted)',
              minHeight: '56px',
              padding: '6px 8px',
              flex: 1,
              fontSize: '11px',
              fontWeight: 600,
              transition: 'color 0.2s ease',
            }}
            onClick={() => {
              if (activeTab === tab.id) {
                setIsExpanded(!isExpanded);
              } else {
                setActiveTab(tab.id);
                setIsExpanded(true);
              }
            }}
          >
            {tab.icon}
            <span style={{ fontSize: '11px' }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileControls;
