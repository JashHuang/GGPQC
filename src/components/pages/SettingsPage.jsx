import React, { useEffect, useState } from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import InputField from '../ui/InputField';
import Card from '../ui/Card';
import { getSignaturesFromDB } from '../../data/signatureStore';

const TYPOGRAPHY_OPTIONS = [
  { value: 'large', label: '字體偏大', description: '更大字級，行數較少' },
  { value: 'balanced', label: '適中', description: '均衡字級與留白' },
  { value: 'compact', label: '精簡', description: '字級較小，可容納更多字' },
];

const SIGNATURE_MODE_OPTIONS = [
  { value: 'none', label: '不顯示簽名' },
  { value: 'text', label: '顯示名字簽名' },
  { value: 'image', label: '顯示簽名檔' },
];

const SIGNATURE_POSITION_OPTIONS = [
  { value: 'bottom-right', label: '右下角（預設）' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-center', label: '下方置中' },
  { value: 'top-right', label: '右上角' },
  { value: 'top-left', label: '左上角' },
];

const SettingsPage = ({ settings, onSave, onBack }) => {
  const [userName, setUserName] = useState(settings.userName || '');
  const [autoAddSignature, setAutoAddSignature] = useState(settings.autoAddSignature || false);
  const [typographyMode, setTypographyMode] = useState(settings.typographyMode || 'balanced');
  const [signatureMode, setSignatureMode] = useState(settings.signatureMode || 'text');
  const [signatureAssetId, setSignatureAssetId] = useState(settings.signatureAssetId || null);
  const [signaturePosition, setSignaturePosition] = useState(settings.signaturePosition || 'bottom-right');
  const [signatures, setSignatures] = useState([]);

  useEffect(() => {
    const loadSignatures = async () => {
      try {
        const data = await getSignaturesFromDB();
        setSignatures(data);
      } catch (error) {
        console.error('載入簽名檔失敗:', error);
      }
    };

    loadSignatures();
  }, []);

  useEffect(() => {
    if (signatureMode !== 'image') return;
    if (signatures.length === 0) {
      setSignatureAssetId(null);
      return;
    }

    const hasSelected = signatures.some((sig) => sig.id === signatureAssetId);
    if (!hasSelected) {
      setSignatureAssetId(signatures[0].id);
    }
  }, [signatureMode, signatures, signatureAssetId]);

  const handleSave = () => {
    onSave({
      userName: userName.trim(),
      autoAddSignature,
      typographyMode,
      signatureMode,
      signatureAssetId: signatureMode === 'image' ? signatureAssetId : null,
      signaturePosition,
    });
    onBack();
  };

  return (
    <div className="gm6-settings">
      <h1 className="gm6-hero-title">設定</h1>

      <div className="gm6-settings-form">
        <InputField
          label="我的名字"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="請輸入您的名字"
        />
        
        <Card>
          <div className="gm6-settings-row">
            <div>
              <div style={{ fontWeight: 600 }}>自動加入簽名</div>
              <div style={{ fontSize: '14px', color: 'var(--gm6-text-secondary)', marginTop: '4px' }}>
                自動在早安圖加上「- 您的名字」
              </div>
            </div>
            <button
              className={`gm6-toggle ${autoAddSignature ? 'is-active' : ''}`}
              onClick={() => setAutoAddSignature(!autoAddSignature)}
              type="button"
            />
          </div>
        </Card>

        <Card>
          <div style={{ padding: '16px' }}>
            <div style={{ fontWeight: 600 }}>自動排版模式</div>
            <div style={{ fontSize: '14px', color: 'var(--gm6-text-secondary)', marginTop: '4px' }}>
              調整字體大小與文字密度
            </div>
            <div className="gm6-mode-picker">
              {TYPOGRAPHY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`gm6-mode-option ${typographyMode === option.value ? 'is-active' : ''}`}
                  onClick={() => setTypographyMode(option.value)}
                >
                  <div>{option.label}</div>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '16px' }}>
            <div style={{ fontWeight: 600 }}>簽名內容</div>
            <div style={{ fontSize: '14px', color: 'var(--gm6-text-secondary)', marginTop: '4px' }}>
              名字與簽名檔擇一，若未選擇則保持空白
            </div>
            <div className="gm6-mode-picker gm6-mode-picker--signature">
              {SIGNATURE_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`gm6-mode-option ${signatureMode === option.value ? 'is-active' : ''}`}
                  onClick={() => setSignatureMode(option.value)}
                >
                  <div>{option.label}</div>
                </button>
              ))}
            </div>

            {signatureMode === 'image' && (
              <div style={{ marginTop: '12px' }}>
                {signatures.length === 0 ? (
                  <div className="gm6-signature-empty">尚未上傳簽名檔，請先到 DIY 頁面上傳簽名檔</div>
                ) : (
                  <div className="gm6-signature-grid">
                    {signatures.map((sig) => (
                      <button
                        key={sig.id}
                        type="button"
                        className={`gm6-signature-option ${signatureAssetId === sig.id ? 'is-active' : ''}`}
                        onClick={() => setSignatureAssetId(sig.id)}
                      >
                        <img src={sig.data} alt={sig.name} />
                        <span>{sig.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '12px' }}>
              <label className="gm6-form-label">簽名位置</label>
              <select
                className="gm6-signature-position"
                value={signaturePosition}
                onChange={(e) => setSignaturePosition(e.target.value)}
              >
                {SIGNATURE_POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <PrimaryButton onClick={handleSave}>
            儲存設定
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
