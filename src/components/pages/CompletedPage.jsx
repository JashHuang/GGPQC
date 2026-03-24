import React, { useCallback, useState, useEffect } from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import { isOffline } from '../../utils/cacheManager';

const CompletedPage = ({ imageData, background, isRegenerating, onRegenerate, onChangeBackground, onDIY, onHome }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showOfflineHint, setShowOfflineHint] = useState(false);

  useEffect(() => {
    if (isOffline()) {
      setShowOfflineHint(true);
    }
  }, []);

  const sourceLabel = background?.sourceLabel || '';
  const isPexelsBackground = sourceLabel.startsWith('pexels-');
  const photographerName = background?.photographerName;
  const photographerUrl = background?.photographerUrl;
  const photoPageUrl = background?.photoPageUrl;

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
          files: [file],
        };

        if (!navigator.canShare || navigator.canShare(payload)) {
          await navigator.share(payload);
          return;
        }
      }

      alert('此裝置不支援直接分享圖片到 LINE，請先下載圖片再傳送。');
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

      {showOfflineHint && (
        <div className="gm6-offline-hint">
          <span>🖼️ 使用快取的背景</span>
          <small>圖片可能與今天不同</small>
        </div>
      )}

      {isPexelsBackground && photographerName && (
        <div className="gm6-attribution-card">
          <div className="gm6-attribution-copy">
            <span className="gm6-attribution-eyebrow">背景來源</span>
            <p className="gm6-attribution-text">
              背景照片由{' '}
              {photographerUrl ? (
                <a href={photographerUrl} target="_blank" rel="noreferrer" className="gm6-attribution-link">
                  {photographerName}
                </a>
              ) : (
                <span>{photographerName}</span>
              )}
              {' '}提供，來自 Pexels。
            </p>
          </div>
          <a
            href={photoPageUrl || 'https://www.pexels.com'}
            target="_blank"
            rel="noreferrer"
            className="gm6-attribution-link gm6-attribution-link--cta"
          >
            查看原圖
          </a>
        </div>
      )}

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
