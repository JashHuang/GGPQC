import React, { useCallback, useState } from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';

const CompletedPage = ({ imageData, isRegenerating, onRegenerate, onChangeBackground, onDIY, onHome }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(() => {
    if (!imageData) return;
    
    setIsDownloading(true);
    const link = document.createElement('a');
    link.download = `good-morning-${Date.now()}.jpg`;
    link.href = imageData;
    link.click();
    setIsDownloading(false);
  }, [imageData]);

  const handleShareToLine = useCallback(() => {
    if (!imageData) return;
    
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `good-morning-${Date.now()}.jpg`;
    link.click();
    
    setTimeout(() => {
      window.open('https://line.me/zh-hant/', '_blank');
    }, 500);
  }, [imageData]);

  if (!imageData) {
    return (
      <div className="gm6-completed">
        <div className="gm6-completed-preview">
          <p>無法載入圖片</p>
        </div>
        <div className="gm6-completed-actions">
          <PrimaryButton onClick={onHome}>
            返回首頁
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="gm6-completed">
      <div className="gm6-completed-preview">
        <img 
          src={imageData} 
          alt="早安圖" 
          className="gm6-completed-image" 
        />
      </div>

      <div className="gm6-completed-actions">
        <PrimaryButton onClick={handleShareToLine}>
          📱 傳到 LINE
        </PrimaryButton>
        
        <SecondaryButton onClick={handleDownload} disabled={isDownloading}>
          ⬇️ 下載圖片
        </SecondaryButton>
        
        <div className="gm6-action-row">
          <SecondaryButton onClick={onChangeBackground} disabled={isRegenerating}>
            🖼️ 換背景
          </SecondaryButton>
          
          <SecondaryButton onClick={onRegenerate} disabled={isRegenerating}>
            🔄 換一句話
          </SecondaryButton>
        </div>
        
        <SecondaryButton onClick={onDIY}>
          🎨 自己編輯
        </SecondaryButton>
      </div>
    </div>
  );
};

export default CompletedPage;
