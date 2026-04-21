import React from 'react';

const BottomNav = ({ currentPath, onHome, onMyName, onSettings, activeTab }) => {
  const isSettingsActive = currentPath === '/settings';

  return (
    <nav className="gm6-bottom-nav">
      <button 
        className={`gm6-bottom-nav-item ${currentPath === '/' ? 'is-active' : ''}`}
        onClick={onHome}
      >
        <span className="gm6-bottom-nav-icon">🏠</span>
        <span>首頁</span>
      </button>

      <button
        className={`gm6-bottom-nav-item ${isSettingsActive && activeTab === 'name' ? 'is-active' : ''}`}
        onClick={onMyName}
      >
        <span className="gm6-bottom-nav-icon">🪪</span>
        <span>我的名字</span>
      </button>
      
      <button 
        className={`gm6-bottom-nav-item ${isSettingsActive && activeTab !== 'name' ? 'is-active' : ''}`}
        onClick={onSettings}
      >
        <span className="gm6-bottom-nav-icon">⚙️</span>
        <span>設定</span>
      </button>
    </nav>
  );
};

export default BottomNav;
