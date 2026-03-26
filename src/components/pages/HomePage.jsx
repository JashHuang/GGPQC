import React from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import Card from '../ui/Card';

const ASPECT_RATIOS = [
  { value: '1:1', label: '方形 (1:1)' },
  { value: '3:4', label: '直式 (3:4)' },
  { value: '9:16', label: '手機 (9:16)' },
  { value: '4:3', label: '標準 (4:3)' },
];

const HomePage = ({ settings, onAutoGenerate, onDIY, onSettings, onUpdateSettings }) => {
  const today = new Date();
  const dateString = `${today.getMonth() + 1}月${today.getDate()}日`;
  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dayName = dayNames[today.getDay()];
  const currentRatio = settings.aspectRatio || '1:1';

  return (
    <div className="gm6-container">
      <header className="gm6-hero">
        <h1 className="gm6-hero-title">{dateString} {dayName}</h1>
        <p className="gm6-hero-subtitle">
          {settings.userName ? `${settings.userName}，` : ''}早安！
        </p>
      </header>

      <div className="gm6-preview-card">
        <div className="gm6-preview-placeholder">
          <div className="gm6-preview-placeholder-icon">☀️</div>
          <p>每天都美好～早安</p>
        </div>
      </div>

      <div className="gm6-ratio-selector">
        <div className="gm6-ratio-label">選擇尺寸</div>
        <select
          className="gm6-ratio-select"
          value={currentRatio}
          onChange={(e) => onUpdateSettings({ aspectRatio: e.target.value })}
        >
          {ASPECT_RATIOS.map((ratio) => (
            <option key={ratio.value} value={ratio.value}>
              {ratio.label}
            </option>
          ))}
        </select>
      </div>

      <div className="gm6-actions">
        <PrimaryButton onClick={onAutoGenerate}>
          ✨ 幫我做一張
        </PrimaryButton>
        
        <SecondaryButton onClick={onDIY}>
          🎨 我自己做
        </SecondaryButton>
      </div>

      <section className="gm6-section">
        <Card>
          <h2 className="gm6-section-title">快速設定</h2>
          <div 
            className="gm6-settings-row"
            onClick={onSettings}
            style={{ cursor: 'pointer' }}
          >
            <span>我的名字</span>
            <span style={{ color: settings.userName ? 'var(--gm6-text-primary)' : '#9ca3af' }}>
              {settings.userName || '尚未設定'} →
            </span>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
