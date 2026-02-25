import React, { forwardRef } from 'react';

const CanvasPreview = forwardRef(({ src, alt = '預覽', className = '' }, ref) => {
  return (
    <div className={`gm6-canvas-preview ${className}`}>
      {src ? (
        <img ref={ref} src={src} alt={alt} className="gm6-canvas-preview-image" />
      ) : (
        <div className="gm6-canvas-preview-placeholder">
          <span>尚無預覽</span>
        </div>
      )}
    </div>
  );
});

CanvasPreview.displayName = 'CanvasPreview';

export default CanvasPreview;
