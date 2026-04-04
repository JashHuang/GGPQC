import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './components/pages/HomePage';
import AutoGenPage from './components/pages/AutoGenPage';
import CompletedPage from './components/pages/CompletedPage';
import DIYPage from './components/pages/DIYPage';
import SettingsPage from './components/pages/SettingsPage';
import BottomNav from './components/layout/BottomNav';
import { useAutoGenerate } from './hooks/useAutoGenerate';
import { registerServiceWorker } from './sw-register';
import { addOnlineStatusListener } from './utils/cacheManager';
import './styles/v6-tokens.css';
import './v6.css';

const GM6_STORAGE_KEY = 'gm-v6-user-settings-v1';

const getDefaultSettings = () => ({
  userName: '',
  autoAddSignature: false,
  typographyMode: 'balanced',
  signatureMode: 'text',
  signatureAssetId: null,
  signaturePosition: 'bottom-right',
  aspectRatio: '1:1',
  editorStylePrefs: {
    greeting: null,
    wisdom: null,
    signature: null,
    signatureText: null,
    canvasSize: null,
  },
});

const loadSettings = () => {
  try {
    const stored = localStorage.getItem(GM6_STORAGE_KEY);
    if (!stored) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(stored) };
  } catch {
    return getDefaultSettings();
  }
};

const saveSettings = (settings) => {
  localStorage.setItem(GM6_STORAGE_KEY, JSON.stringify(settings));
};

const isFiniteNumber = (value) => Number.isFinite(value);

const extractEditorStylePrefs = (editorScene) => {
  const blocks = editorScene?.textBlocks || [];
  const sceneSize = editorScene?.canvasSize || { width: 1080, height: 1080 };
  const greeting = blocks.find((b) => b.type === 'greeting');
  const wisdom = blocks.find((b) => b.type === 'wisdom');
  const signatureImage = blocks.find((b) => b.type === 'signature' && b.data);
  const signatureText = blocks.find((b) => b.type === 'signature-text');

  const next = {
    greeting: greeting ? {
      font: greeting.font || null,
      fillColor: greeting.fillColor || '#ffffff',
      strokeColor: greeting.strokeColor || '#000000',
      hasStroke: greeting.hasStroke !== false,
      fontWeight: greeting.fontWeight || 400,
    } : null,
    wisdom: wisdom ? {
      font: wisdom.font || null,
      fillColor: wisdom.fillColor || '#ffffff',
      strokeColor: wisdom.strokeColor || '#000000',
      hasStroke: wisdom.hasStroke !== false,
      fontWeight: wisdom.fontWeight || 400,
    } : null,
    signature: null,
    signatureText: null,
    canvasSize: null,
  };

  if (signatureImage && isFiniteNumber(signatureImage.x) && isFiniteNumber(signatureImage.y) && sceneSize.width > 0 && sceneSize.height > 0) {
    next.signature = {
      xRatio: signatureImage.x / sceneSize.width,
      yRatio: signatureImage.y / sceneSize.height,
      widthRatio: signatureImage.width / sceneSize.width,
      heightRatio: signatureImage.height / sceneSize.height,
    };
  }

  if (signatureText && isFiniteNumber(signatureText.x) && isFiniteNumber(signatureText.y) && sceneSize.width > 0 && sceneSize.height > 0) {
    next.signatureText = {
      xRatio: signatureText.x / sceneSize.width,
      yRatio: signatureText.y / sceneSize.height,
      widthRatio: signatureText.width / sceneSize.width,
      heightRatio: signatureText.height / sceneSize.height,
    };
  }

  if (isFiniteNumber(sceneSize.width) && isFiniteNumber(sceneSize.height)) {
    next.canvasSize = {
      width: sceneSize.width,
      height: sceneSize.height,
    };
  }

  return next;
};

const V6Content = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = React.useState(loadSettings);
  const [generatedImage, setGeneratedImage] = React.useState(null);
  const [generatedData, setGeneratedData] = React.useState(null);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const { regenerateBlessingOnly, regenerateBackgroundOnly } = useAutoGenerate();

  useEffect(() => {
    registerServiceWorker();
    
    const cleanup = addOnlineStatusListener((isOnline) => {
      console.log('網路狀態:', isOnline ? '上線' : '離線');
    });
    
    return cleanup;
  }, []);

  const updateSettings = React.useCallback((newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    saveSettings(merged);
  }, [settings]);

  const handleAutoGenerate = React.useCallback((imageData, data) => {
    setGeneratedImage(imageData);
    setGeneratedData(data);
    navigate('/completed');
  }, [navigate]);

  const handleRegenerate = React.useCallback(async () => {
    if (!generatedData) {
      navigate('/auto-generate');
      return;
    }

    setIsRegenerating(true);
    try {
      const result = await regenerateBlessingOnly(generatedData, settings);
      setGeneratedImage(result.imageData);
      setGeneratedData(result);
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  }, [generatedData, settings, regenerateBlessingOnly, navigate]);

  const handleChangeBackground = React.useCallback(async () => {
    if (!generatedData) {
      navigate('/auto-generate');
      return;
    }

    setIsRegenerating(true);
    try {
      const result = await regenerateBackgroundOnly(generatedData, settings);
      setGeneratedImage(result.imageData);
      setGeneratedData(result);
    } catch (err) {
      console.error('Change background failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  }, [generatedData, settings, regenerateBackgroundOnly, navigate]);

  const handleDIYComplete = React.useCallback((imageData, diyData) => {
    const extractedPrefs = extractEditorStylePrefs(diyData?.editorScene);
    const mergedSettings = {
      ...settings,
      editorStylePrefs: {
        greeting: extractedPrefs.greeting || settings.editorStylePrefs?.greeting || null,
        wisdom: extractedPrefs.wisdom || settings.editorStylePrefs?.wisdom || null,
        signature: extractedPrefs.signature || settings.editorStylePrefs?.signature || null,
        signatureText: extractedPrefs.signatureText || settings.editorStylePrefs?.signatureText || null,
        canvasSize: extractedPrefs.canvasSize || settings.editorStylePrefs?.canvasSize || null,
      },
    };
    setSettings(mergedSettings);
    saveSettings(mergedSettings);

    setGeneratedImage(imageData);
    setGeneratedData((prev) => ({
      ...(prev || {}),
      ...(diyData || {}),
      imageData,
      editorScene: diyData?.editorScene || prev?.editorScene || null,
    }));
    navigate('/completed');
  }, [navigate, settings]);

  const handleDIYWithCurrent = React.useCallback(() => {
    navigate('/diy', { state: { 
      imageData: generatedImage, 
      data: generatedData,
      background: generatedData?.background,
      editorScene: generatedData?.editorScene || null,
    } });
  }, [generatedImage, generatedData, navigate]);

  const hideBottomNav = ['/auto-generate', '/completed', '/diy'].includes(location.pathname);
  const showBackButton = ['/completed', '/diy'].includes(location.pathname);

  return (
    <div className="gm6-page">
      <div className="gm6-shell">
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                settings={settings}
                onAutoGenerate={() => navigate('/auto-generate')}
                onDIY={() => navigate('/diy')}
                onSettings={() => navigate('/settings')}
                onUpdateSettings={updateSettings}
              />
            } 
          />
          <Route 
            path="/auto-generate" 
            element={
              <AutoGenPage 
                settings={settings}
                onGenerated={handleAutoGenerate}
              />
            } 
          />
          <Route 
            path="/completed" 
            element={
              <CompletedPage 
                imageData={generatedImage}
                background={generatedData?.background || null}
                isRegenerating={isRegenerating}
                onRegenerate={handleRegenerate}
                onChangeBackground={handleChangeBackground}
                onDIY={handleDIYWithCurrent}
                onHome={() => navigate('/')}
              />
            } 
          />
          <Route 
            path="/diy" 
            element={
              <DIYPage 
                settings={settings}
                onComplete={handleDIYComplete}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <SettingsPage 
                settings={settings}
                onSave={updateSettings}
                onBack={() => navigate('/')}
              />
            } 
          />
        </Routes>
        
        {showBackButton && (
          <button 
            className="gm6-back-btn"
            onClick={() => navigate('/')}
          >
            ← 返回
          </button>
        )}
        
        {!hideBottomNav && (
          <BottomNav 
            currentPath={location.pathname}
            onHome={() => navigate('/')}
            onMyName={() => navigate('/settings')}
            onSettings={() => navigate('/settings')}
          />
        )}
      </div>
    </div>
  );
};

const GoodMorningGeneratorV6 = () => {
  return (
    <BrowserRouter>
      <V6Content />
    </BrowserRouter>
  );
};

export default GoodMorningGeneratorV6;
