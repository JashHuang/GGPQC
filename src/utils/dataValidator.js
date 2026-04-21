export const normalizeGeneratedData = (data) => {
  if (!data) return null;
  
  return {
    imageData: data?.imageData || null,
    background: data?.background || null,
    blessing: data?.blessing || null,
    editorScene: data?.editorScene || null,
    textBlocks: data?.textBlocks || [],
    canvasSize: data?.canvasSize || { width: 1080, height: 1080 },
    createdAt: data?.createdAt || Date.now(),
    source: data?.source || 'auto',
  };
};

export const isValidGeneratedData = (data) => {
  if (!data) return false;
  return !!(data.imageData || (data.background && data.blessing));
};

export const getValidationError = (data) => {
  if (!data) return '資料不存在';
  if (!data.imageData && !data.background) return '缺少背景圖片';
  if (!data.imageData && !data.blessing) return '缺少祝福語';
  return null;
};
