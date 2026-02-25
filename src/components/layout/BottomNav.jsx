import React from 'react';

const BottomNav = ({ currentPath, onHome, onMyName, onSettings }) => {
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
        className={`gm6-bottom-nav-item ${currentPath === '/settings' ? 'is-active' : ''}`}
        onClick={onMyName}
      >
        <span className="gm6-bottom-nav-icon">🪪</span>
        <span>我的名字</span>
      </button>
      
      <button 
        className={`gm6-bottom-nav-item ${currentPath === '/settings' ? 'is-active' : ''}`}
        onClick={onSettings}
      >
        <span className="gm6-bottom-nav-icon">⚙️</span>
        <span>設定</span>
      </button>
    </nav>
  );
};

export default BottomNav;
