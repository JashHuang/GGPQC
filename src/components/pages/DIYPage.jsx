import React, { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PrimaryButton from '../ui/PrimaryButton';
import V5Editor from '../../good-morning-generator';

const DIYPage = ({ settings, onComplete }) => {
  const location = useLocation();
  const initialData = location.state;

  useEffect(() => {
    const initTimer = setTimeout(() => {
      const event = new CustomEvent('v6-editor-init', {
        detail: {
          background: initialData?.background || null,
          blessing: initialData?.data?.blessing || initialData?.data?.textBlocks?.[0]?.text || null,
          textColor: initialData?.data?.settings?.textColor,
          textColorType: initialData?.data?.settings?.textColorType,
          editorScene: initialData?.editorScene || initialData?.data?.editorScene || null,
          rememberedStyle: settings?.editorStylePrefs || null,
          typographyMode: settings?.typographyMode || 'balanced',
          isFromCompleted: initialData?.source === 'diy',
        },
      });
      window.dispatchEvent(event);
    }, 800);

    return () => clearTimeout(initTimer);
  }, [initialData, settings]);

  const requestEditorScene = () => new Promise((resolve) => {
    const requestId = `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const onResponse = (e) => {
      if (e.detail?.requestId !== requestId) return;
      window.removeEventListener('v6-editor-export-response', onResponse);
      resolve(e.detail?.scene || null);
    };
    window.addEventListener('v6-editor-export-response', onResponse);
    window.dispatchEvent(new CustomEvent('v6-editor-export-request', { detail: { requestId } }));

    setTimeout(() => {
      window.removeEventListener('v6-editor-export-response', onResponse);
      resolve(null);
    }, 600);
  });

  const clearEditorSelection = () => new Promise((resolve) => {
    const requestId = `clear-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const onResponse = (e) => {
      if (e.detail?.requestId !== requestId) return;
      window.removeEventListener('v6-editor-clear-selection-response', onResponse);
      resolve();
    };

    window.addEventListener('v6-editor-clear-selection-response', onResponse);
    window.dispatchEvent(new CustomEvent('v6-editor-clear-selection-request', { detail: { requestId } }));

    setTimeout(() => {
      window.removeEventListener('v6-editor-clear-selection-response', onResponse);
      resolve();
    }, 600);
  });

  const saveEditorState = () => new Promise((resolve) => {
    const requestId = `save-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const onResponse = (e) => {
      if (e.detail?.requestId !== requestId) return;
      window.removeEventListener('v6-editor-save-state-response', onResponse);
      resolve();
    };
    window.addEventListener('v6-editor-save-state-response', onResponse);
    window.dispatchEvent(new CustomEvent('v6-editor-save-state-request', { detail: { requestId } }));

    setTimeout(() => {
      window.removeEventListener('v6-editor-save-state-response', onResponse);
      resolve();
    }, 600);
  });

  const handleComplete = async () => {
    await saveEditorState();
    await clearEditorSelection();
    const editorScene = await requestEditorScene();
    const canvas = document.querySelector('.gm5-page canvas');
    if (canvas) {
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      onComplete(imageData, {
        ...initialData?.data,
        background: initialData?.background || initialData?.data?.background,
        editorScene,
      });
    }
  };

  const handleBack = useCallback(async () => {
    await saveEditorState();
    window.history.back();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveEditorState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className="gm6-diy">
      <V5Editor />
      
      <div className="gm6-diy-complete-wrap">
        <PrimaryButton onClick={handleComplete} className="gm6-diy-complete-btn">
          ✅ 完成
        </PrimaryButton>
      </div>
    </div>
  );
};

export default DIYPage;
