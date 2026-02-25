import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PrimaryButton from '../ui/PrimaryButton';
import V5Editor from '../../good-morning-generator';

const DIYPage = ({ onComplete }) => {
  const location = useLocation();
  const initialData = location.state;

  useEffect(() => {
    if (initialData?.background) {
      const initTimer = setTimeout(() => {
        const event = new CustomEvent('v6-editor-init', { 
          detail: { 
            background: initialData.background,
            blessing: initialData.data?.blessing,
            textColor: initialData.data?.settings?.textColor,
            textColorType: initialData.data?.settings?.textColorType,
            editorScene: initialData.editorScene || initialData.data?.editorScene || null,
          } 
        });
        window.dispatchEvent(event);
      }, 800);
      
      return () => clearTimeout(initTimer);
    }
  }, [initialData]);

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

  const handleComplete = async () => {
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
