import React, { useEffect, useRef } from 'react';
import useAutoGenerate from '../../hooks/useAutoGenerate';

const AutoGenPage = ({ settings, onGenerated }) => {
  const { generate, error } = useAutoGenerate();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const doGenerate = async () => {
      try {
        const result = await generate(settings);
        onGenerated(result.imageData, result);
      } catch (err) {
        console.error('生成失敗:', err);
      }
    };

    doGenerate();
  }, [generate, onGenerated, settings]);

  return (
    <div className="gm6-loading">
      <div className="gm6-loading-spinner" />
      <p className="gm6-loading-text">正在幫您製作...</p>
      {error && (
        <p style={{ color: '#ef4444', marginTop: '16px' }}>{error}</p>
      )}
    </div>
  );
};

export default AutoGenPage;
