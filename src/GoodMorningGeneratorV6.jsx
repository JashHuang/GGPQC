import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './components/pages/HomePage';
import AutoGenPage from './components/pages/AutoGenPage';
import CompletedPage from './components/pages/CompletedPage';
import DIYPage from './components/pages/DIYPage';
import SettingsPage from './components/pages/SettingsPage';
import BottomNav from './components/layout/BottomNav';
import { useAutoGenerate } from './hooks/useAutoGenerate';
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
  editorStylePrefs: {
    greeting: null,
    wisdom: null,
    signature: null,
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
  const signature = blocks.find((b) => b.type === 'signature' && b.data);

  const next = {
    greeting: greeting ? {
      font: greeting.font || null,
      fillColor: greeting.fillColor || '#ffffff',
      strokeColor: greeting.strokeColor || '#000000',
      hasStroke: greeting.hasStroke !== false,
    } : null,
    wisdom: wisdom ? {
      font: wisdom.font || null,
      fillColor: wisdom.fillColor || '#ffffff',
      strokeColor: wisdom.strokeColor || '#000000',
      hasStroke: wisdom.hasStroke !== false,
    } : null,
    signature: null,
  };

  if (signature && isFiniteNumber(signature.x) && isFiniteNumber(signature.y) && sceneSize.width > 0 && sceneSize.height > 0) {
    next.signature = {
      xRatio: signature.x / sceneSize.width,
      yRatio: signature.y / sceneSize.height,
      widthRatio: signature.width / sceneSize.width,
      heightRatio: signature.height / sceneSize.height,
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
  const showBackButton = location.pathname === '/completed';

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
            onClick={() => navigate(-1)}
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
