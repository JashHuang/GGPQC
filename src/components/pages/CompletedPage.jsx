import React, { useCallback, useState } from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';

const CompletedPage = ({ imageData, isRegenerating, onRegenerate, onChangeBackground, onDIY, onHome }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const dataUrlToFile = useCallback(async (dataUrl, filename) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }, []);

  const handleDownload = useCallback(() => {
    if (!imageData) return;
    
    setIsDownloading(true);
    const link = document.createElement('a');
    link.download = `good-morning-${Date.now()}.jpg`;
    link.href = imageData;
    link.click();
    setIsDownloading(false);
  }, [imageData]);

  const handleShareToLine = useCallback(async () => {
    if (!imageData) return;
    setIsSharing(true);

    try {
      const now = Date.now();
      const file = await dataUrlToFile(imageData, `good-morning-${now}.jpg`);

      if (navigator.share) {
        const payload = {
          title: '早安圖',
          text: '早安！送你一張祝福圖',
          files: [file],
        };

        if (!navigator.canShare || navigator.canShare(payload)) {
          await navigator.share(payload);
          return;
        }
      }

      const text = encodeURIComponent('早安！我分享一張祝福圖給你');
      window.open(`https://line.me/R/msg/text/?${text}`, '_blank');
      alert('此裝置不支援直接分享圖片到 LINE，已改為開啟 LINE 文字分享。您也可以先下載圖片再傳送。');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('分享到 LINE 失敗:', error);
        alert('分享失敗，請改用「下載圖片」後手動傳到 LINE。');
      }
    } finally {
      setIsSharing(false);
    }
  }, [dataUrlToFile, imageData]);

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
        <PrimaryButton onClick={handleShareToLine} disabled={isSharing}>
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
