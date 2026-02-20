import React from 'react';

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
  primaryId
}) => {
  return (
    <div className="gm5-mobile-bottom-tools">
      <div className={`gm5-mobile-drawer ${!isExpanded ? 'is-collapsed' : ''}`}>
        {activeTab === 'tool' && (
          <div className="gm5-mobile-panel">
            <div className="flex justify-between items-center mb-2">
              <h3 className="gm5-mobile-panel-title !mb-0">素材與工具</h3>
              <button className="text-xs text-blue-500 font-bold" onClick={() => setIsExpanded(false)}>收起</button>
            </div>
            <label className="gm5-upload">
              <input type="file" accept="image/*" onChange={onImageUpload} />
              <span>上傳底圖</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button className="gm5-btn gm5-btn-soft" onClick={() => onAddTextBlock('greeting')}>+ 問候語</button>
              <button className="gm5-btn gm5-btn-soft" onClick={() => onAddTextBlock('wisdom')}>+ 智慧語</button>
              <button className="gm5-btn gm5-btn-soft" onClick={openFontManager}>字型管理</button>
              <button className="gm5-btn gm5-btn-soft" onClick={openSignatureManager}>簽名管理</button>
            </div>
          </div>
        )}
        
        {activeTab === 'preset' && (
          <div className="gm5-mobile-panel">
            <div className="flex justify-between items-center mb-2">
              <h3 className="gm5-mobile-panel-title !mb-0">預設內容</h3>
              <button className="text-xs text-blue-500 font-bold" onClick={() => setIsExpanded(false)}>收起</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">同步問候語</label>
                <input 
                  className="gm5-input" 
                  value={greetingText} 
                  onChange={e => { 
                    setGreetingText(e.target.value); 
                    syncSelectedByType('greeting', { text: e.target.value }); 
                  }} 
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
                  <button className="gm5-btn gm5-btn-soft" onClick={onGenerateRandomQuote}>隨機</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="gm5-mobile-panel">
            <div className="flex justify-between items-center mb-2">
              <h3 className="gm5-mobile-panel-title !mb-0">圖層管理</h3>
              <button className="text-xs text-blue-500 font-bold" onClick={() => setIsExpanded(false)}>收起</button>
            </div>
            <div className="gm5-layers">
              {[...textBlocks].reverse().map(b => (
                <div key={b.id} className={`gm5-layer ${selectedIds.includes(b.id) ? 'is-selected' : ''}`}>
                  <button 
                    className="gm5-layer-main" 
                    onClick={() => { setSelectedIds([b.id]); setPrimaryId(b.id); }}
                  >
                    {b.label || (b.text ? b.text.slice(0, 10) : '圖層')}
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

        {activeTab === 'edit' && (
          <div className="gm5-mobile-panel">
            <div className="flex justify-between items-center mb-2">
              <h3 className="gm5-mobile-panel-title !mb-0">屬性編輯</h3>
              <button className="text-xs text-blue-500 font-bold" onClick={() => setIsExpanded(false)}>收起</button>
            </div>
            {primaryId ? (
              textBlocks.find(b => b.id === primaryId)?.type !== 'signature' ? (
                <div className="space-y-4">
                  <textarea 
                    className="gm5-input" 
                    placeholder="內容" 
                    value={textBlocks.find(b => b.id === primaryId)?.text || ''} 
                    onChange={e => updateBlockById(primaryId, { text: e.target.value })} 
                  />
                  <div className="flex gap-2">
                     <select 
                       className="gm5-input flex-1" 
                       value={textBlocks.find(b => b.id === primaryId)?.font || ''} 
                       onChange={e => updateBlockById(primaryId, { font: e.target.value })}
                     >
                       {allFonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                     </select>
                     <div className="flex gap-1">
                       <button 
                         className="gm5-btn gm5-btn-soft p-2" 
                         onClick={() => { 
                           const b = textBlocks.find(x => x.id === primaryId); 
                           updateBlockById(primaryId, { width: Math.max(b.width, b.height), height: Math.min(b.width, b.height) }); 
                         }}
                       >橫</button>
                       <button 
                         className="gm5-btn gm5-btn-soft p-2" 
                         onClick={() => { 
                           const b = textBlocks.find(x => x.id === primaryId); 
                           updateBlockById(primaryId, { width: Math.min(b.width, b.height), height: Math.max(b.width, b.height) }); 
                         }}
                       >直</button>
                     </div>
                  </div>
                  <div className="gm5-color-grid">
                    <label><span>填色</span><input type="color" value={textBlocks.find(b => b.id === primaryId)?.fillColor || '#000000'} onChange={e => updateBlockById(primaryId, { fillColor: e.target.value })} /></label>
                    <label><span>描邊</span><input type="color" value={textBlocks.find(b => b.id === primaryId)?.strokeColor || '#ffffff'} onChange={e => updateBlockById(primaryId, { strokeColor: e.target.value })} /></label>
                  </div>
                </div>
              ) : <p className="text-center py-4 text-gray-500">已選中簽名檔</p>
            ) : <p className="text-center py-4 text-gray-400">請先選擇一個圖層</p>}
          </div>
        )}
      </div>

      <div className="gm5-mobile-tabs">
        {['tool', 'preset', 'layers', 'edit'].map(tab => (
          <button 
            key={tab}
            className={`gm5-btn ${activeTab === tab ? 'gm5-btn-primary' : 'gm5-btn-soft'}`} 
            onClick={() => {
              if (activeTab === tab) {
                setIsExpanded(!isExpanded);
              } else {
                setActiveTab(tab);
                setIsExpanded(true);
              }
            }}
          >
            {tab === 'tool' && '工具'}
            {tab === 'preset' && '預設'}
            {tab === 'layers' && '圖層'}
            {tab === 'edit' && '編輯'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileControls;
