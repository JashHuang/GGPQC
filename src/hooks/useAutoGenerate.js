import { useState, useCallback, useRef } from 'react';
import {
  getFestivalTheme,
  getBackdropsByTheme,
  getLiveBackgroundCandidates,
  getBlessingsByLength,
  getRandomItem,
  DEFAULT_BLESSINGS,
} from '../data/backgrounds';
import { getSignatureById } from '../data/signatureStore';

const RECENT_HISTORY_KEY = 'gm-v6-recent-history-v1';
const MAX_RECENT_HISTORY = 5;
const SOURCE_HEALTH_KEY = 'gm-v6-image-source-health-v1';
const SOURCE_FAILURE_THRESHOLD = 3;
const SOURCE_PENALTY_MS = 10 * 60 * 1000;
const PENALIZED_WEIGHT_FACTOR = 0.2;
const WISDOM_FILE_LIST = [
  'GPT問候語2.txt',
  '名言merged.csv',
  '365句名言2.csv',
  '聖嚴法師108自在語-全.csv',
  '證嚴法師-靜思語400句.csv',
  '週末問候.csv',
];

let wisdomFileBlessingsCache = null;
let wisdomFileBlessingsPromise = null;

const loadRecentHistory = () => {
  try {
    const stored = localStorage.getItem(RECENT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentHistory = (history) => {
  localStorage.setItem(RECENT_HISTORY_KEY, JSON.stringify(history));
};

const addToRecentHistory = (backgroundId, blessingId) => {
  const history = loadRecentHistory();
  const newEntry = { backgroundId, blessingId, timestamp: Date.now() };
  const newHistory = [newEntry, ...history].slice(0, MAX_RECENT_HISTORY);
  saveRecentHistory(newHistory);
};

const getRecentBackgroundIds = () => {
  return loadRecentHistory().slice(0, 3).map(h => h.backgroundId);
};

const getRecentBlessingIds = () => {
  return loadRecentHistory().slice(0, 3).map(h => h.blessingId);
};

const selectBlessingLength = (safeArea) => {
  const { width, height } = safeArea;
  const areaRatio = width * height;
  
  if (areaRatio > 0.5) return 'long';
  if (areaRatio > 0.35) return 'medium';
  return 'short';
};

const classifyBlessingLength = (text = '') => {
  const normalized = text.replace(/\s+/g, '');
  const len = normalized.length;
  if (len <= 14) return 'short';
  if (len <= 28) return 'medium';
  return 'long';
};

const parseWisdomFileText = (fileName, rawText) => {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (fileName.endsWith('.txt')) return lines;
  return lines.slice(1).map((line) => line.split(',')[0].replace(/^["']|["']$/g, '')).filter(Boolean);
};

const getWisdomBlessingsFromFiles = async () => {
  if (wisdomFileBlessingsCache) return wisdomFileBlessingsCache;
  if (wisdomFileBlessingsPromise) return wisdomFileBlessingsPromise;

  wisdomFileBlessingsPromise = (async () => {
    const uniqueMap = new Map();

    await Promise.all(WISDOM_FILE_LIST.map(async (fileName) => {
      try {
        const response = await fetch(`/wisdom/${fileName}`);
        if (!response.ok) return;
        const rawText = await response.text();
        const parsed = parseWisdomFileText(fileName, rawText);

        parsed.forEach((text, index) => {
          const normalized = text.trim();
          if (!normalized || normalized.includes('載入失敗') || normalized.includes('暫無語錄')) return;
          if (uniqueMap.has(normalized)) return;

          uniqueMap.set(normalized, {
            id: `wf-${fileName}-${index}`,
            category: 'wisdom-file',
            text: normalized,
            length: classifyBlessingLength(normalized),
          });
        });
      } catch {
        // ignore file fetch failures and fallback to defaults
      }
    }));

    wisdomFileBlessingsCache = [...uniqueMap.values()];
    wisdomFileBlessingsPromise = null;
    return wisdomFileBlessingsCache;
  })();

  return wisdomFileBlessingsPromise;
};

const getMixedBlessingsByLength = async (length) => {
  const defaultBlessings = getBlessingsByLength(length);
  const fileBlessings = await getWisdomBlessingsFromFiles();
  const matchedFileBlessings = fileBlessings.filter((item) => item.length === length);
  return [...defaultBlessings, ...matchedFileBlessings];
};

const loadSourceHealth = () => {
  try {
    const stored = localStorage.getItem(SOURCE_HEALTH_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveSourceHealth = (health) => {
  localStorage.setItem(SOURCE_HEALTH_KEY, JSON.stringify(health));
};

const getSourceFromUrl = (url) => {
  if (url.includes('source.unsplash.com/featured')) return 'unsplash-featured';
  if (url.includes('source.unsplash.com')) return 'unsplash-source';
  if (url.includes('picsum.photos')) return 'picsum';
  if (url.includes('loremflickr.com')) return 'loremflickr';
  return 'fallback-static';
};

const normalizeImageCandidates = (primaryUrl, fallbackUrls = [], imageCandidates = []) => {
  if (imageCandidates.length > 0) return imageCandidates;

  return [primaryUrl, ...fallbackUrls]
    .filter(Boolean)
    .map((url) => ({ url, source: getSourceFromUrl(url) }));
};

const getSourceWeight = (sourceHealth, source, now) => {
  const health = sourceHealth[source];
  if (!health) return 1;
  if (health.penalizedUntil && health.penalizedUntil > now) return PENALIZED_WEIGHT_FACTOR;
  return 1;
};

const pickWeightedIndex = (candidates, sourceHealth, now) => {
  const weights = candidates.map(item => Math.max(0.01, getSourceWeight(sourceHealth, item.source, now)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i += 1) {
    random -= weights[i];
    if (random <= 0) return i;
  }

  return weights.length - 1;
};

const orderCandidatesByWeight = (candidates) => {
  const pool = [...candidates];
  const ordered = [];
  const sourceHealth = loadSourceHealth();
  const now = Date.now();

  while (pool.length > 0) {
    const index = pickWeightedIndex(pool, sourceHealth, now);
    ordered.push(pool[index]);
    pool.splice(index, 1);
  }

  return ordered;
};

const updateSourceHealth = (source, isSuccess) => {
  if (!source || source === 'fallback-static') return;

  const now = Date.now();
  const sourceHealth = loadSourceHealth();
  const current = sourceHealth[source] || { consecutiveFailures: 0, penalizedUntil: 0 };

  if (isSuccess) {
    sourceHealth[source] = { consecutiveFailures: 0, penalizedUntil: 0 };
    saveSourceHealth(sourceHealth);
    return;
  }

  const nextFailures = current.consecutiveFailures + 1;
  const penalizedUntil = nextFailures >= SOURCE_FAILURE_THRESHOLD ? now + SOURCE_PENALTY_MS : current.penalizedUntil;

  sourceHealth[source] = {
    consecutiveFailures: nextFailures,
    penalizedUntil,
  };

  saveSourceHealth(sourceHealth);
};

const loadSingleImage = (url, source) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ success: true, img, url, source });
    img.onerror = () => resolve({ success: false, url, source });
    img.src = url;
  });

const loadImage = async (primaryUrl, fallbackUrls = [], imageCandidates = []) => {
  const normalizedCandidates = normalizeImageCandidates(primaryUrl, fallbackUrls, imageCandidates);
  const orderedCandidates = orderCandidatesByWeight(normalizedCandidates);

  for (let i = 0; i < orderedCandidates.length; i += 1) {
    const candidate = orderedCandidates[i];
    const result = await loadSingleImage(candidate.url, candidate.source);
    updateSourceHealth(candidate.source, result.success);
    if (result.success) return result;
  }

  return { success: false };
};

const createRequestSeed = () => Date.now() + Math.floor(Math.random() * 1000000);

const getBackgroundPool = (theme, requestSeed) => {
  const liveBackgrounds = getLiveBackgroundCandidates(theme, { perQuery: 3, requestSeed });
  const fallbackBackgrounds = getBackdropsByTheme(theme);
  return [...liveBackgrounds, ...fallbackBackgrounds];
};

const loadDataImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = src;
  });

const BUILTIN_FONT_FAMILY_BY_NAME = {
  '思源黑體 (TC)': '"Noto Sans TC", sans-serif',
  '思源宋體 (TC)': '"Noto Serif TC", serif',
  '昭源圓體 (TC)': '"Chiron GoRound TC", sans-serif',
  '霞鶩文楷 (TC)': '"LXGW WenKai TC", sans-serif',
  '馬善政楷體': '"Ma Shan Zheng", cursive',
  '至莽行書': '"Zhi Mang Xing", cursive',
  '小薇 LOGO 體': '"ZCOOL XiaoWei", sans-serif',
  '青刻黃油體': '"ZCOOL QingKe HuangYou", sans-serif',
  '系統預設黑體': 'sans-serif',
  '系統預設明體': 'serif',
};

const normalizeBlockFont = (fontName) => {
  if (!fontName) return FONT_STACK;
  if (fontName.includes('"') || fontName.includes(',')) return fontName;
  const mappedFamily = BUILTIN_FONT_FAMILY_BY_NAME[fontName];
  if (mappedFamily) return mappedFamily;
  return `"${fontName}", ${FONT_STACK}`;
};

const FONT_STACK = '"Noto Sans TC", "Microsoft JhengHei", sans-serif';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const RGB_HEX_REGEX = /^#([a-fA-F0-9]{6})$/;

const colorToHex = (color, fallback = '#000000') => {
  if (!color) return fallback;
  const value = String(color).trim();
  if (RGB_HEX_REGEX.test(value)) return value.toLowerCase();

  const rgbaMatch = value.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbaMatch) {
    const r = clamp(parseInt(rgbaMatch[1], 10), 0, 255);
    const g = clamp(parseInt(rgbaMatch[2], 10), 0, 255);
    const b = clamp(parseInt(rgbaMatch[3], 10), 0, 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  return fallback;
};

const hashString = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const wrapText = (ctx, text, maxWidth) => {
  const normalized = (text || '').trim();
  if (!normalized) return [''];

  const lines = [];
  let line = '';

  normalized.split('').forEach((char) => {
    if (char === '\n') {
      if (line) lines.push(line);
      line = '';
      return;
    }

    const testLine = line + char;
    if (line && ctx.measureText(testLine).width > maxWidth) {
      lines.push(line);
      line = char;
      return;
    }
    line = testLine;
  });

  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
};

const fitTextInBox = (ctx, {
  text,
  maxWidth,
  maxHeight,
  minSize,
  maxSize,
  weight = 700,
  lineHeightRatio = 1.35,
  maxLines = Number.POSITIVE_INFINITY,
  fontFamily = FONT_STACK,
}) => {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = size * lineHeightRatio;
    const textHeight = lines.length * lineHeight;

    if (lines.length <= maxLines && textHeight <= maxHeight) {
      return { size, lines, lineHeight, textHeight };
    }
  }

  ctx.font = `${weight} ${minSize}px ${fontFamily}`;
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = minSize * lineHeightRatio;
  return { size: minSize, lines: lines.slice(0, maxLines), lineHeight, textHeight: lines.length * lineHeight };
};

const getRegionTone = (ctx, rect) => {
  try {
    const x = Math.floor(clamp(rect.x, 0, ctx.canvas.width - 1));
    const y = Math.floor(clamp(rect.y, 0, ctx.canvas.height - 1));
    const width = Math.floor(clamp(rect.width, 1, ctx.canvas.width - x));
    const height = Math.floor(clamp(rect.height, 1, ctx.canvas.height - y));
    const imageData = ctx.getImageData(x, y, width, height);
    const { data } = imageData;

    let sum = 0;
    let sumSq = 0;
    let count = 0;
    const stride = 20;

    for (let i = 0; i < data.length; i += stride) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      sum += lum;
      sumSq += lum * lum;
      count += 1;
    }

    if (count === 0) return null;
    const average = sum / count;
    const variance = Math.max(0, (sumSq / count) - (average * average));
    return { average, variance };
  } catch {
    return null;
  }
};

const LIGHT_PALETTES = [
  { greeting: '#FFF8E7', body: '#FFFDF8', signature: '#FFEFD6', stroke: '#111827', intent: 'light' },
  { greeting: '#EAF8FF', body: '#F8FDFF', signature: '#DDF2FF', stroke: '#0f172a', intent: 'light' },
  { greeting: '#F3FFEE', body: '#FBFFF8', signature: '#E4F7D8', stroke: '#1f2937', intent: 'light' },
];

const DARK_PALETTES = [
  { greeting: '#1F2937', body: '#111827', signature: '#334155', stroke: '#f8fafc', intent: 'dark' },
  { greeting: '#3F1D1D', body: '#4A2F23', signature: '#5B3A2E', stroke: '#fef2f2', intent: 'dark' },
  { greeting: '#13332A', body: '#15403A', signature: '#1E4D3F', stroke: '#f0fdf4', intent: 'dark' },
];

const TYPOGRAPHY_PRESETS = {
  large: {
    greeting: { min: 80, max: 176, widthRatio: 0.7, heightRatio: 0.24 },
    wisdom: { min: 44, max: 78, lineHeightRatio: 1.32, maxLines: 4, offsets: [0, 0.06, 0.12] },
    signature: { min: 36, max: 56 },
  },
  balanced: {
    greeting: { min: 64, max: 158, widthRatio: 0.6, heightRatio: 0.22 },
    wisdom: { min: 38, max: 70, lineHeightRatio: 1.35, maxLines: 5, offsets: [0, 0.08, 0.16] },
    signature: { min: 34, max: 52 },
  },
  compact: {
    greeting: { min: 54, max: 140, widthRatio: 0.56, heightRatio: 0.2 },
    wisdom: { min: 30, max: 62, lineHeightRatio: 1.4, maxLines: 7, offsets: [0, 0.1, 0.2] },
    signature: { min: 28, max: 44 },
  },
};

const selectPalette = (background, blessingId, safeTone) => {
  const prefersLight = background.preferredTextColor === 'light';
  const shouldUseLight = safeTone ? safeTone.average < 0.55 : prefersLight;
  const group = shouldUseLight ? LIGHT_PALETTES : DARK_PALETTES;
  const seed = `${background.id}-${blessingId || 'b'}-${background.theme || 'general'}`;
  const index = hashString(seed) % group.length;
  return group[index];
};

const drawLines = (ctx, lines, x, startY, lineHeight, styles) => {
  const { fillColor, strokeColor, strokeWidth } = styles;
  lines.forEach((line, index) => {
    const y = startY + (index * lineHeight);
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = fillColor;
    ctx.fillText(line, x, y);
  });
};

const estimateLegacyFontSize = (ctx, block, fontFamily, weight = 400) => {
  const text = block.text || '字';
  const minSize = 12;
  const maxSize = 260;

  const fitHorizontal = (size) => {
    const padding = 14;
    const maxWidth = Math.max(20, block.width - (padding * 2));
    const maxHeight = Math.max(20, block.height - (padding * 2));
    const lineHeight = size * 1.28;
    let lines = 1;
    let current = '';
    text.split('').forEach((char) => {
      const next = current + char;
      if (current && ctx.measureText(next).width > maxWidth) {
        lines += 1;
        current = char;
      } else {
        current = next;
      }
    });
    return (lines * lineHeight) <= maxHeight;
  };

  const fitVertical = (size) => {
    const padding = 12;
    const spacing = 4;
    const charWidth = Math.max(1, ctx.measureText('測').width);
    const cols = Math.max(1, Math.floor((block.width - padding * 2 + spacing) / (charWidth + spacing)));
    const rows = Math.max(1, Math.floor((block.height - padding * 2 + spacing) / (size + spacing)));
    return text.length <= cols * rows;
  };

  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (block.height > block.width ? fitVertical(size) : fitHorizontal(size)) return size;
  }

  return minSize;
};

const drawLegacyHorizontalText = (ctx, block, fontSize) => {
  const padding = 14;
  const maxWidth = block.width - padding * 2;
  const lines = [];
  let current = '';

  (block.text || '').split('').forEach((char) => {
    if (ctx.measureText(current + char).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current += char;
    }
  });
  if (current) lines.push(current);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.imageSmoothingQuality = 'high';
  ctx.lineWidth = Math.max(2, fontSize * 0.05);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  lines.forEach((line, index) => {
    const x = Math.round(block.x + padding);
    const y = Math.round(block.y + padding + index * fontSize * 1.28);
    if (block.hasStroke !== false) {
      ctx.strokeStyle = block.strokeColor || '#000000';
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = block.fillColor || '#ffffff';
    ctx.fillText(line, x, y);
  });
};

const drawLegacyVerticalText = (ctx, block, fontSize) => {
  const spacing = 4;
  const padding = 12;
  const charWidth = ctx.measureText('測').width;
  let x = block.x + block.width - padding - charWidth;
  let y = block.y + padding;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.imageSmoothingQuality = 'high';
  ctx.lineWidth = Math.max(2, fontSize * 0.05);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  (block.text || '').split('').forEach((char) => {
    if (y + fontSize > block.y + block.height - padding) {
      y = block.y + padding;
      x -= charWidth + spacing;
    }
    if (x < block.x + padding) return;

    const drawX = Math.round(x);
    const drawY = Math.round(y);

    if (block.hasStroke !== false) {
      ctx.strokeStyle = block.strokeColor || '#000000';
      ctx.strokeText(char, drawX, drawY);
    }
    ctx.fillStyle = block.fillColor || '#ffffff';
    ctx.fillText(char, drawX, drawY);
    y += fontSize + spacing;
  });
};

const getSignaturePlacement = (safeArea, width, height, position) => {
  const margin = Math.max(12, safeArea.width * 0.03);
  switch (position) {
    case 'top-left':
      return { x: safeArea.x + margin, y: safeArea.y + margin };
    case 'top-right':
      return { x: safeArea.x + safeArea.width - width - margin, y: safeArea.y + margin };
    case 'bottom-left':
      return { x: safeArea.x + margin, y: safeArea.y + safeArea.height - height - margin };
    case 'bottom-center':
      return { x: safeArea.x + ((safeArea.width - width) / 2), y: safeArea.y + safeArea.height - height - margin };
    case 'bottom-right':
    default:
      return { x: safeArea.x + safeArea.width - width - margin, y: safeArea.y + safeArea.height - height - margin };
  }
};

const renderAutoTypography = (ctx, canvas, background, blessing, settings, signatureAssetImage) => {
  const { x: saX, y: saY, width: saW, height: saH } = background.textSafeArea;
  const safeArea = {
    x: saX * canvas.width,
    y: saY * canvas.height,
    width: saW * canvas.width,
    height: saH * canvas.height,
  };

  const safeTone = getRegionTone(ctx, safeArea);
  const palette = selectPalette(background, blessing.id, safeTone);
  const rememberedStyle = settings.editorStylePrefs || {};
  const greetingFontFamily = normalizeBlockFont(rememberedStyle.greeting?.font);
  const wisdomFontFamily = normalizeBlockFont(rememberedStyle.wisdom?.font);
  const greetingStyle = {
    font: rememberedStyle.greeting?.font || '思源黑體 (TC)',
    fillColor: rememberedStyle.greeting?.fillColor || palette.greeting,
    strokeColor: rememberedStyle.greeting?.strokeColor || palette.stroke,
    hasStroke: rememberedStyle.greeting?.hasStroke !== false,
  };
  const wisdomStyle = {
    font: rememberedStyle.wisdom?.font || '思源宋體 (TC)',
    fillColor: rememberedStyle.wisdom?.fillColor || palette.body,
    strokeColor: rememberedStyle.wisdom?.strokeColor || palette.stroke,
    hasStroke: rememberedStyle.wisdom?.hasStroke !== false,
  };
  const greetingText = '早安';
  const preset = TYPOGRAPHY_PRESETS[settings.typographyMode] || TYPOGRAPHY_PRESETS.balanced;
  const signatureMode = settings.signatureMode || 'text';
  const signaturePosition = settings.signaturePosition || 'bottom-right';
  const signatureText = signatureMode === 'text' && settings.userName
    ? (settings.autoAddSignature ? `- ${settings.userName}` : settings.userName)
    : '';
  const hasSignatureImage = signatureMode === 'image' && signatureAssetImage;
  const hasSignatureText = Boolean(signatureText);
  const hasSignature = hasSignatureImage || hasSignatureText;

  const greetingBox = {
    x: safeArea.x + ((safeArea.width * (1 - preset.greeting.widthRatio)) / 2),
    y: safeArea.y + (safeArea.height * 0.02),
    width: safeArea.width * preset.greeting.widthRatio,
    height: safeArea.height * preset.greeting.heightRatio,
  };

  const greetingFit = fitTextInBox(ctx, {
    text: greetingText,
    maxWidth: greetingBox.width,
    maxHeight: greetingBox.height,
    minSize: preset.greeting.min,
    maxSize: preset.greeting.max,
    weight: 800,
    lineHeightRatio: 1.1,
    maxLines: 1,
    fontFamily: greetingFontFamily,
  });

  const signatureFit = hasSignatureText ? fitTextInBox(ctx, {
    text: signatureText,
    maxWidth: safeArea.width * 0.52,
    maxHeight: safeArea.height * 0.12,
    minSize: preset.signature.min,
    maxSize: preset.signature.max,
    weight: 500,
    lineHeightRatio: 1.2,
    maxLines: 1,
  }) : null;

  const signatureImageSize = hasSignatureImage
    ? (() => {
      const rawW = signatureAssetImage.naturalWidth || signatureAssetImage.width || 1;
      const rawH = signatureAssetImage.naturalHeight || signatureAssetImage.height || 1;
      const ratio = rawW / rawH;
      const maxW = safeArea.width * 0.28;
      const maxH = safeArea.height * 0.15;
      let width = maxW;
      let height = width / ratio;
      if (height > maxH) {
        height = maxH;
        width = height * ratio;
      }
      return { width, height };
    })()
    : null;

  const signatureReserved = hasSignature
    ? Math.max(
      signatureFit ? signatureFit.lineHeight + 18 : 0,
      signatureImageSize ? signatureImageSize.height + 18 : 0,
      safeArea.height * 0.1,
    )
    : 0;
  const wisdomTop = greetingBox.y + greetingBox.height + safeArea.height * 0.03;
  const reserveBottom = ['bottom-left', 'bottom-right', 'bottom-center'].includes(signaturePosition);
  const wisdomBottom = (safeArea.y + safeArea.height) - (reserveBottom ? signatureReserved : 0) - (safeArea.height * 0.04);
  const wisdomHeight = Math.max(140, wisdomBottom - wisdomTop);
  const wisdomWidth = safeArea.width * 0.9;
  const wisdomX = safeArea.x + ((safeArea.width - wisdomWidth) / 2);

  const wisdomCandidates = preset.wisdom.offsets.map((offset) => ({
    x: wisdomX,
    y: wisdomTop + (wisdomHeight * offset),
    width: wisdomWidth,
    height: wisdomHeight * (1 - offset),
  }));

  const wisdomBest = wisdomCandidates.reduce((best, rect) => {
    const fit = fitTextInBox(ctx, {
      text: blessing.text,
      maxWidth: rect.width,
      maxHeight: rect.height,
      minSize: preset.wisdom.min,
      maxSize: preset.wisdom.max,
      weight: 700,
      lineHeightRatio: preset.wisdom.lineHeightRatio,
      maxLines: preset.wisdom.maxLines,
      fontFamily: wisdomFontFamily,
    });
    const tone = getRegionTone(ctx, rect);
    const contrastScore = tone
      ? (palette.intent === 'light' ? (1 - tone.average) : tone.average)
      : 0.5;
    const variancePenalty = tone ? Math.min(0.3, tone.variance * 0.8) : 0;
    const score = (fit.size * 0.025) + contrastScore - variancePenalty;
    if (!best || score > best.score) return { rect, fit, score };
    return best;
  }, null);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.font = `800 ${greetingFit.size}px ${greetingFontFamily}`;
  drawLines(
    ctx,
    greetingFit.lines,
    greetingBox.x + (greetingBox.width / 2),
    greetingBox.y,
    greetingFit.lineHeight,
    {
      fillColor: greetingStyle.fillColor,
      strokeColor: greetingStyle.hasStroke ? greetingStyle.strokeColor : null,
      strokeWidth: Math.max(2.5, greetingFit.size * 0.08),
    },
  );

  ctx.font = `700 ${wisdomBest.fit.size}px ${wisdomFontFamily}`;
  const wisdomTextHeight = wisdomBest.fit.lines.length * wisdomBest.fit.lineHeight;
  const wisdomStartY = wisdomBest.rect.y + Math.max(0, (wisdomBest.rect.height - wisdomTextHeight) / 2);
  drawLines(
    ctx,
    wisdomBest.fit.lines,
    wisdomBest.rect.x + (wisdomBest.rect.width / 2),
    wisdomStartY,
    wisdomBest.fit.lineHeight,
    {
      fillColor: wisdomStyle.fillColor,
      strokeColor: wisdomStyle.hasStroke ? wisdomStyle.strokeColor : null,
      strokeWidth: Math.max(1.5, wisdomBest.fit.size * 0.06),
    },
  );

  let signatureTextBlock = null;
  if (hasSignatureText && signatureFit) {
    ctx.font = `500 ${signatureFit.size}px ${FONT_STACK}`;
    const measuredWidth = Math.min(ctx.measureText(signatureText).width, safeArea.width * 0.52);
    const placement = getSignaturePlacement(safeArea, measuredWidth, signatureFit.lineHeight, signaturePosition);

    if (['top-left', 'bottom-left'].includes(signaturePosition)) {
      ctx.textAlign = 'left';
    } else if (['top-right', 'bottom-right'].includes(signaturePosition)) {
      ctx.textAlign = 'right';
    } else {
      ctx.textAlign = 'center';
    }

    const textX = ctx.textAlign === 'center'
      ? placement.x + (measuredWidth / 2)
      : ctx.textAlign === 'right'
        ? placement.x + measuredWidth
        : placement.x;

    drawLines(
      ctx,
      [signatureText],
      textX,
      placement.y,
      signatureFit.lineHeight,
      {
        fillColor: palette.signature,
        strokeColor: palette.stroke,
        strokeWidth: Math.max(1, signatureFit.size * 0.045),
      },
    );
    signatureTextBlock = {
      id: 'v6-signature-text',
      type: 'signature-text',
      label: '簽名文字',
      visible: true,
      locked: false,
      text: signatureText,
      x: placement.x,
      y: placement.y,
      width: measuredWidth,
      height: signatureFit.lineHeight,
      font: greetingStyle.font,
      fillColor: palette.signature,
      strokeColor: palette.stroke,
      fontWeight: 500,
      hasStroke: true,
      textAlign: ctx.textAlign,
      fontSize: signatureFit.size,
      lineHeight: signatureFit.lineHeight,
    };
    ctx.textAlign = 'center';
  }

  let signatureImageBlock = null;
  if (hasSignatureImage && signatureImageSize) {
    const savedSignature = rememberedStyle.signature;
    let placement = getSignaturePlacement(
      safeArea,
      signatureImageSize.width,
      signatureImageSize.height,
      signaturePosition,
    );
    let drawWidth = signatureImageSize.width;
    let drawHeight = signatureImageSize.height;

    if (
      savedSignature
      && Number.isFinite(savedSignature.xRatio)
      && Number.isFinite(savedSignature.yRatio)
      && Number.isFinite(savedSignature.widthRatio)
      && Number.isFinite(savedSignature.heightRatio)
    ) {
      placement = {
        x: canvas.width * savedSignature.xRatio,
        y: canvas.height * savedSignature.yRatio,
      };
      drawWidth = Math.max(60, canvas.width * savedSignature.widthRatio);
      drawHeight = Math.max(24, canvas.height * savedSignature.heightRatio);
    }

    ctx.drawImage(
      signatureAssetImage,
      placement.x,
      placement.y,
      drawWidth,
      drawHeight,
    );
    signatureImageBlock = {
      id: 'v6-signature-image',
      type: 'signature',
      label: '簽名檔',
      visible: true,
      locked: false,
      x: placement.x,
      y: placement.y,
      width: drawWidth,
      height: drawHeight,
      data: signatureAssetImage.src,
    };
  }

  const sceneBlocks = [
    {
      id: 'v6-greeting',
      type: 'greeting',
      label: '早安',
      visible: true,
      locked: false,
      text: greetingText,
      x: greetingBox.x,
      y: greetingBox.y,
      width: greetingBox.width,
      height: greetingBox.height,
      font: '思源黑體 (TC)',
      fillColor: greetingStyle.fillColor,
      strokeColor: greetingStyle.strokeColor,
      fontWeight: 800,
      hasStroke: greetingStyle.hasStroke,
      textAlign: 'center',
      fontSize: greetingFit.size,
      lineHeight: greetingFit.lineHeight,
    },
    {
      id: 'v6-wisdom',
      type: 'wisdom',
      label: '祝福語',
      visible: true,
      locked: false,
      text: blessing.text,
      x: wisdomBest.rect.x,
      y: wisdomStartY,
      width: wisdomBest.rect.width,
      height: wisdomTextHeight,
      font: wisdomStyle.font,
      fillColor: wisdomStyle.fillColor,
      strokeColor: wisdomStyle.strokeColor,
      fontWeight: 700,
      hasStroke: wisdomStyle.hasStroke,
      textAlign: 'center',
      fontSize: wisdomBest.fit.size,
      lineHeight: wisdomBest.fit.lineHeight,
    },
    ...(signatureTextBlock ? [signatureTextBlock] : []),
    ...(signatureImageBlock ? [signatureImageBlock] : []),
  ];

  return {
    textColor: palette.body,
      strokeColor: palette.stroke,
    textColorType: palette.intent,
    sceneBlocks,
    safeArea,
  };
};

const createComposedImage = async (background, blessing, settings) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const imageLoadResult = await loadImage(
    background.imageUrl,
    background.fallbackUrls,
    background.imageCandidates,
  );

  if (imageLoadResult.success) {
    ctx.drawImage(imageLoadResult.img, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#f8f2e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  let signatureAssetImage = null;
  if (settings.signatureMode === 'image' && settings.signatureAssetId) {
    try {
      const signatureAsset = await getSignatureById(settings.signatureAssetId);
      if (signatureAsset?.data) {
        signatureAssetImage = await loadDataImage(signatureAsset.data);
      }
    } catch (error) {
      console.error('載入簽名檔失敗:', error);
    }
  }

  const backgroundDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const textStyles = renderAutoTypography(ctx, canvas, background, blessing, settings, signatureAssetImage);
  const editorScene = {
    canvasSize: { width: canvas.width, height: canvas.height },
    backgroundDataUrl,
    textBlocks: textStyles.sceneBlocks,
    safeArea: textStyles.safeArea,
  };
  return { canvas, textStyles, editorScene };
};

const renderSceneToCanvas = async (editorScene, options = {}) => {
  const { blessingText = null, backgroundDataUrl = null } = options;
  const canvas = document.createElement('canvas');
  const sceneSize = editorScene?.canvasSize || { width: 1080, height: 1080 };
  canvas.width = sceneSize.width || 1080;
  canvas.height = sceneSize.height || 1080;
  const ctx = canvas.getContext('2d');
  const sceneBackground = backgroundDataUrl || editorScene?.backgroundDataUrl;

  if (sceneBackground) {
    try {
      const bgImg = await loadDataImage(sceneBackground);
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      }
    } catch {
      ctx.fillStyle = '#f8f2e8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    ctx.fillStyle = '#f8f2e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const blocks = (editorScene?.textBlocks || []).map((block) => ({ ...block }));
  const wisdomBlockIndex = blocks.findIndex((block) => block.type === 'wisdom');
  if (wisdomBlockIndex >= 0 && blessingText) {
    blocks[wisdomBlockIndex] = { ...blocks[wisdomBlockIndex], text: blessingText };
  }

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.visible === false) continue;

    if (block.type === 'signature' && block.data) {
      try {
        const sigImg = await loadDataImage(block.data);
        if (sigImg) {
          ctx.drawImage(sigImg, block.x, block.y, block.width, block.height);
        }
      } catch {
        // ignore broken signature image
      }
      continue;
    }

    const text = block.text || '';
    if (!text) continue;

    const weight = block.fontWeight || 700;
    const fontFamily = normalizeBlockFont(block.font);
    const isWisdom = block.type === 'wisdom';
    const isLegacyBlock = !block.textAlign;
    const isVerticalLayout = block.height > block.width;

    if (isLegacyBlock) {
      const legacySize = Number.isFinite(block.fontSize) && block.fontSize > 0
        ? block.fontSize
        : estimateLegacyFontSize(ctx, block, fontFamily, weight);
      ctx.font = `${weight} ${legacySize}px ${fontFamily}`;

      if (isVerticalLayout) {
        drawLegacyVerticalText(ctx, block, legacySize);
      } else {
        drawLegacyHorizontalText(ctx, block, legacySize);
      }

      blocks[i] = {
        ...block,
        fontSize: legacySize,
        lineHeight: block.lineHeight || (isVerticalLayout ? legacySize + 4 : legacySize * 1.28),
        fillColor: colorToHex(block.fillColor, '#ffffff'),
        strokeColor: colorToHex(block.strokeColor, '#000000'),
      };
      continue;
    }

    if (isVerticalLayout) {
      const verticalSize = Number.isFinite(block.fontSize) && block.fontSize > 0
        ? block.fontSize
        : estimateLegacyFontSize(ctx, block, fontFamily, weight);
      ctx.font = `${weight} ${verticalSize}px ${fontFamily}`;
      drawLegacyVerticalText(ctx, block, verticalSize);
      blocks[i] = {
        ...block,
        fontSize: verticalSize,
        lineHeight: block.lineHeight || (verticalSize + 4),
        fillColor: colorToHex(block.fillColor, '#ffffff'),
        strokeColor: colorToHex(block.strokeColor, '#000000'),
      };
      continue;
    }

    let drawLinesData;
    if (isWisdom) {
      drawLinesData = fitTextInBox(ctx, {
        text,
        maxWidth: Math.max(10, block.width),
        maxHeight: Math.max(10, block.height),
        minSize: 20,
        maxSize: 260,
        weight,
        lineHeightRatio: 1.32,
        maxLines: 8,
      });
    } else if (block.fontSize) {
      ctx.font = `${weight} ${block.fontSize}px ${fontFamily}`;
      drawLinesData = {
        size: block.fontSize,
        lineHeight: block.lineHeight || (block.fontSize * 1.3),
        lines: wrapText(ctx, text, Math.max(10, block.width)),
      };
    } else {
      drawLinesData = fitTextInBox(ctx, {
        text,
        maxWidth: Math.max(10, block.width),
        maxHeight: Math.max(10, block.height),
        minSize: 20,
        maxSize: 260,
        weight,
        lineHeightRatio: 1.32,
        maxLines: 8,
        fontFamily,
      });
    }

    ctx.font = `${weight} ${drawLinesData.size}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    const align = block.textAlign || 'center';
    ctx.textAlign = align;
    const linesHeight = drawLinesData.lines.length * drawLinesData.lineHeight;
    const startY = isWisdom
      ? block.y + Math.max(0, (block.height - linesHeight) / 2)
      : block.y;
    let drawX = block.x + (block.width / 2);
    if (align === 'left') drawX = block.x;
    if (align === 'right') drawX = block.x + block.width;

    drawLines(
      ctx,
      drawLinesData.lines,
      drawX,
      startY,
      drawLinesData.lineHeight,
      {
        fillColor: block.fillColor || '#ffffff',
        strokeColor: (block.hasStroke === false) ? null : (block.strokeColor || 'rgba(0,0,0,0.5)'),
        strokeWidth: Math.max(1, drawLinesData.size * 0.05),
      },
    );

    blocks[i] = {
      ...block,
      lineHeight: block.lineHeight || drawLinesData.lineHeight,
      fillColor: colorToHex(block.fillColor, '#ffffff'),
      strokeColor: colorToHex(block.strokeColor, '#000000'),
    };
  }

  const updatedScene = {
    ...editorScene,
    canvasSize: { width: canvas.width, height: canvas.height },
    backgroundDataUrl: sceneBackground || null,
    textBlocks: blocks,
  };

  return { canvas, editorScene: updatedScene };
};

export const useAutoGenerate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const generate = useCallback(async (settings) => {
    setIsGenerating(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const today = new Date();
      const festival = getFestivalTheme(today);
      const theme = festival?.theme || 'general';
      const requestSeed = createRequestSeed();

      const backgrounds = getBackgroundPool(theme, requestSeed);
      const recentBackgroundIds = getRecentBackgroundIds();
      
      let background;
      
      const availableBackgrounds = backgrounds.length > 0 ? backgrounds : [];
      
      if (availableBackgrounds.length > 0) {
        background = getRandomItem(availableBackgrounds, recentBackgroundIds);
      } else {
        background = {
          id: 'fallback-001',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80',
          theme: 'sunrise',
          textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
          preferredTextColor: 'light',
        };
      }

      const length = selectBlessingLength(background.textSafeArea);
      const blessings = await getMixedBlessingsByLength(length);
      const recentBlessingIds = getRecentBlessingIds();
      const blessing = getRandomItem(
        blessings.length > 0 ? blessings : DEFAULT_BLESSINGS,
        recentBlessingIds
      );

      const { canvas, textStyles, editorScene } = await createComposedImage(background, blessing, settings);

      addToRecentHistory(background.id, blessing.id);

      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      canvasRef.current = canvas;

      const result = {
        imageData,
        background,
        blessing,
        settings: {
          textColor: textStyles.textColor,
          strokeColor: textStyles.strokeColor,
          textColorType: textStyles.textColorType,
        },
        editorScene,
      };

      return result;
    } catch (err) {
      setError(err.message || '生成失敗，請重試');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const regenerateBlessingOnly = useCallback(async (currentData, settings) => {
    setIsGenerating(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const background = currentData.background;
      const recentBlessingIds = getRecentBlessingIds();
      const length = selectBlessingLength(background.textSafeArea);
      const blessings = await getMixedBlessingsByLength(length);
      
      const blessing = getRandomItem(
        blessings.length > 0 ? blessings : DEFAULT_BLESSINGS,
        recentBlessingIds
      );

      let canvas;
      let textStyles;
      let editorScene;

      if (currentData?.editorScene && Array.isArray(currentData.editorScene.textBlocks)) {
        const sceneResult = await renderSceneToCanvas(currentData.editorScene, {
          blessingText: blessing.text,
          backgroundDataUrl: currentData.editorScene.backgroundDataUrl
            || currentData?.background?.imageUrl
            || null,
        });
        canvas = sceneResult.canvas;
        editorScene = sceneResult.editorScene;
        textStyles = {
          textColor: currentData?.settings?.textColor || '#ffffff',
          strokeColor: currentData?.settings?.strokeColor || 'rgba(0,0,0,0.5)',
          textColorType: currentData?.settings?.textColorType || background.preferredTextColor,
        };
      } else {
        const composed = await createComposedImage(background, blessing, settings);
        canvas = composed.canvas;
        textStyles = composed.textStyles;
        editorScene = composed.editorScene;
      }

      addToRecentHistory(background.id, blessing.id);

      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      canvasRef.current = canvas;

      return {
        imageData,
        background,
        blessing,
        settings: {
          textColor: textStyles.textColor,
          strokeColor: textStyles.strokeColor,
          textColorType: textStyles.textColorType,
        },
        editorScene,
      };
    } catch (err) {
      setError(err.message || '生成失敗，請重試');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const regenerateBackgroundOnly = useCallback(async (currentData, settings) => {
    setIsGenerating(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const today = new Date();
      const festival = getFestivalTheme(today);
      const theme = festival?.theme || 'general';
      const requestSeed = createRequestSeed();
      
      const backgrounds = getBackgroundPool(theme, requestSeed);
      const recentBackgroundIds = getRecentBackgroundIds();
      const excludeIds = [...recentBackgroundIds, currentData.background.id];
      
      let background;
      
      const availableBackgrounds = backgrounds.length > 0 ? backgrounds : [];
      
      if (availableBackgrounds.length > 0) {
        const filteredBackgrounds = availableBackgrounds.filter(bg => !excludeIds.includes(bg.id));
        if (filteredBackgrounds.length > 0) {
          background = getRandomItem(filteredBackgrounds, []);
        } else {
          background = getRandomItem(availableBackgrounds, [currentData.background.id]);
        }
      } else {
        background = {
          id: 'fallback-001',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80',
          theme: 'sunrise',
          textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
          preferredTextColor: 'light',
        };
      }

      const blessing = currentData.blessing;
      let canvas;
      let textStyles;
      let editorScene;

      if (currentData?.editorScene && Array.isArray(currentData.editorScene.textBlocks)) {
        const sceneSize = currentData.editorScene.canvasSize || { width: 1080, height: 1080 };
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = sceneSize.width || 1080;
        bgCanvas.height = sceneSize.height || 1080;
        const bgCtx = bgCanvas.getContext('2d');

        const bgResult = await loadImage(
          background.imageUrl,
          background.fallbackUrls,
          background.imageCandidates,
        );
        if (bgResult.success) {
          bgCtx.drawImage(bgResult.img, 0, 0, bgCanvas.width, bgCanvas.height);
        } else {
          bgCtx.fillStyle = '#f8f2e8';
          bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        }

        const nextBackgroundDataUrl = bgCanvas.toDataURL('image/jpeg', 0.95);
        const sceneResult = await renderSceneToCanvas(currentData.editorScene, {
          backgroundDataUrl: nextBackgroundDataUrl,
        });
        canvas = sceneResult.canvas;
        editorScene = sceneResult.editorScene;
        textStyles = {
          textColor: currentData?.settings?.textColor || '#ffffff',
          strokeColor: currentData?.settings?.strokeColor || 'rgba(0,0,0,0.5)',
          textColorType: currentData?.settings?.textColorType || background.preferredTextColor,
        };
      } else {
        const composed = await createComposedImage(background, blessing, settings);
        canvas = composed.canvas;
        textStyles = composed.textStyles;
        editorScene = composed.editorScene;
      }

      addToRecentHistory(background.id, blessing.id);

      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      canvasRef.current = canvas;

      return {
        imageData,
        background,
        blessing,
        settings: {
          textColor: textStyles.textColor,
          strokeColor: textStyles.strokeColor,
          textColorType: textStyles.textColorType,
        },
        editorScene,
      };
    } catch (err) {
      setError(err.message || '生成失敗，請重試');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const downloadImage = useCallback(() => {
    if (!canvasRef.current) return null;
    
    const link = document.createElement('a');
    link.download = `good-morning-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.9);
    link.click();
    
    return link.href;
  }, []);

  return {
    generate,
    regenerateBlessingOnly,
    regenerateBackgroundOnly,
    isGenerating,
    error,
    canvasRef,
    downloadImage,
  };
};

export default useAutoGenerate;
