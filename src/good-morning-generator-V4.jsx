import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './good-morning-generator-V4.css';

const FONT_BASE_PATH = '/fonts/';
const DEFAULT_WISDOM_PATH = '/wisdom/';

const LOCAL_FONTS = [
  { name: '青柳隸書', file: 'aoyagireisyosimo.ttf' },
  { name: '青柳草跡', file: 'AoyagiSoseki2.ttf' },
  { name: '爆台 Light', file: 'Bakudai-Light.ttf' },
  { name: '爆台 Regular', file: 'Bakudai-Regular.ttf' },
  { name: '辰宇落雁體', file: 'ChenYuluoyan-Mono.ttf' },
  { name: 'CJK 全宋體', file: 'cjkFonts_allseto_v1.11.ttf' },
  { name: 'Glow Sans TC', file: 'GlowSansTC-Normal-Regular.otf' },
  { name: '漢儀森體唐', file: 'HanyiSentyTang.ttf' },
  { name: '芫荽體', file: 'Iansui-Regular.ttf' },
  { name: 'I.明體', file: 'I.MingCP-8.00.ttf' },
  { name: 'Jason 手寫', file: 'JasonHandwriting5.ttf' },
  { name: '粉圓體', file: 'jf-openhuninn-2.0.ttf' },
  { name: 'Kurewa Gothic', file: 'KurewaGothicCjkTc-Light.ttf' },
  { name: 'Masa Font Light', file: 'MasaFont-Light.ttf' },
  { name: 'Masa Font', file: 'MasaFont-Regular.ttf' },
  { name: '馬善政楷體', file: 'MaShanZheng-Regular.ttf' },
  { name: 'Moe LI 隸書', file: 'MoeLI隸書3.ttf' },
  { name: '內海字體 Light', file: 'NaikaiFont-Light.ttf' },
  { name: 'Nani Font ExtraLight', file: 'NaniFont-ExtraLight.ttf' },
  { name: 'Nani Font Light', file: 'NaniFont-Light.ttf' },
  { name: 'Pop Gothic', file: 'PopGothicCjkTc-Light.ttf' },
  { name: 'Slide 俠星體', file: 'Slidexiaxing-Regular.ttf' },
  { name: 'Slide 悠然體', file: 'slideyouran-Regular.ttf' },
  { name: 'The Peak Font', file: 'ThePeakFont.ttf' },
  { name: 'WD-XL潤飾體', file: 'WD-XLLubrifontTC-Regular.otf' },
  { name: '小賴體', file: 'XiaolaiSC-Regular.ttf' },
  { name: 'Yozai Light', file: 'Yozai-Light.ttf' },
  { name: 'Yozai Regular', file: 'Yozai-Regular.ttf' },
  { name: '三極行楷', file: '三极行楷简体-粗.ttf' },
  { name: '宅在家粉條甜', file: '宅在家粉條甜.ttf' },
  { name: '宅在家自動筆', file: '宅在家自動筆20220605.ttf' },
  { name: '宅在家麥克筆', file: '宅在家麥克筆.ttf' },
  { name: '清松手寫體', file: '清松手寫體1.ttf' },
  { name: '演示秋鴻楷', file: '演示秋鸿楷2.0.ttf' },
  { name: '鴻雷板書', file: '鴻雷板書.ttf' },
];

const WISDOM_CONFIG = [
  { name: '1.一般問候', file: 'GPT問候語2.txt' },
  { name: '2.隨機智慧語', file: '名言merged.csv' },
  { name: '3.365名言', file: '365句名言2.csv' },
  { name: '4.聖嚴法師', file: '聖嚴法師108自在語-全.csv' },
  { name: '5.證嚴法師', file: '證嚴法師-靜思語400句.csv' },
  { name: '6.週末問候語', file: '週末問候.csv' },
];

const USER_SETTINGS_STORAGE_KEY = 'gm-v4-user-settings-v1';
const ACTIVE_USER_STORAGE_KEY = 'gm-v4-active-user-v1';
const DEFAULT_USER_NAME = '預設用戶';
const DEFAULT_USER_STYLE_SETTINGS = {
  greetingFont: LOCAL_FONTS[0].name,
  wisdomFont: LOCAL_FONTS[1].name,
  greetingFillColor: '#fff5b1',
  greetingStrokeColor: '#8d4a16',
  wisdomFillColor: '#f8f7ff',
  wisdomStrokeColor: '#25526b',
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const cloneBlocks = (blocks) => blocks.map((b) => ({ ...b }));

const normalizeWisdomPath = (path) => {
  const trimmed = (path || '').trim();
  if (!trimmed) return DEFAULT_WISDOM_PATH;
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
};

const Download = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const Undo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-15-6l-3 2" />
  </svg>
);

const Redo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 15-6l3 2" />
  </svg>
);

const GoodMorningGeneratorV4 = () => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const dragRef = useRef({
    mode: null,
    startX: 0,
    startY: 0,
    handle: null,
    selectedIds: [],
    snapshotById: new Map(),
  });

  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [wisdomLoaded, setWisdomLoaded] = useState(false);

  const [wisdomPath] = useState(DEFAULT_WISDOM_PATH);
  const [wisdomCategories, setWisdomCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);

  const [backgroundImage, setBackgroundImage] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [zoom, setZoom] = useState(70);
  const [showGrid, setShowGrid] = useState(true);
  const [showRuler, setShowRuler] = useState(true);

  const [greetingText, setGreetingText] = useState('早安，願你今天順心如意');
  const [wisdomText, setWisdomText] = useState('Every morning is a new beginning.');
  const [greetingFont, setGreetingFont] = useState(DEFAULT_USER_STYLE_SETTINGS.greetingFont);
  const [wisdomFont, setWisdomFont] = useState(DEFAULT_USER_STYLE_SETTINGS.wisdomFont);
  const [greetingFillColor, setGreetingFillColor] = useState(DEFAULT_USER_STYLE_SETTINGS.greetingFillColor);
  const [greetingStrokeColor, setGreetingStrokeColor] = useState(DEFAULT_USER_STYLE_SETTINGS.greetingStrokeColor);
  const [wisdomFillColor, setWisdomFillColor] = useState(DEFAULT_USER_STYLE_SETTINGS.wisdomFillColor);
  const [wisdomStrokeColor, setWisdomStrokeColor] = useState(DEFAULT_USER_STYLE_SETTINGS.wisdomStrokeColor);
  const [activeUser, setActiveUser] = useState(DEFAULT_USER_NAME);
  const [userOptions, setUserOptions] = useState([DEFAULT_USER_NAME]);
  const [newUserName, setNewUserName] = useState('');
  const [settingsReady, setSettingsReady] = useState(false);

  const [textBlocks, setTextBlocks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [primaryId, setPrimaryId] = useState(null);
  const [guideLines, setGuideLines] = useState({ x: null, y: null });

  const maxZoom = 180;
  const minZoom = 30;
  const snapThreshold = 10;

  const selectionSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const applyUserStyleSettings = useCallback((settings = {}) => {
    const fontNames = LOCAL_FONTS.map((font) => font.name);
    const nextGreetingFont = settings.greetingFont ?? DEFAULT_USER_STYLE_SETTINGS.greetingFont;
    const nextWisdomFont = settings.wisdomFont ?? DEFAULT_USER_STYLE_SETTINGS.wisdomFont;
    setGreetingFont(fontNames.includes(nextGreetingFont) ? nextGreetingFont : DEFAULT_USER_STYLE_SETTINGS.greetingFont);
    setWisdomFont(fontNames.includes(nextWisdomFont) ? nextWisdomFont : DEFAULT_USER_STYLE_SETTINGS.wisdomFont);
    setGreetingFillColor(settings.greetingFillColor ?? DEFAULT_USER_STYLE_SETTINGS.greetingFillColor);
    setGreetingStrokeColor(settings.greetingStrokeColor ?? DEFAULT_USER_STYLE_SETTINGS.greetingStrokeColor);
    setWisdomFillColor(settings.wisdomFillColor ?? DEFAULT_USER_STYLE_SETTINGS.wisdomFillColor);
    setWisdomStrokeColor(settings.wisdomStrokeColor ?? DEFAULT_USER_STYLE_SETTINGS.wisdomStrokeColor);
  }, []);

  const readStoredUsers = useCallback(() => {
    try {
      const stored = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      const users = parsed?.users && typeof parsed.users === 'object' ? parsed.users : {};
      return { users };
    } catch (error) {
      console.error('讀取使用者樣式設定失敗:', error);
      return { users: {} };
    }
  }, []);

  const pushHistory = useCallback((sourceBlocks) => {
    historyRef.current.push(cloneBlocks(sourceBlocks));
    if (historyRef.current.length > 80) historyRef.current.shift();
    futureRef.current = [];
    setHistoryVersion((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(cloneBlocks(textBlocks));
    setTextBlocks(prev);
    const first = prev[0]?.id ?? null;
    setSelectedIds(first ? [first] : []);
    setPrimaryId(first);
    setHistoryVersion((v) => v + 1);
  }, [textBlocks]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(cloneBlocks(textBlocks));
    setTextBlocks(next);
    const first = next[0]?.id ?? null;
    setSelectedIds(first ? [first] : []);
    setPrimaryId(first);
    setHistoryVersion((v) => v + 1);
  }, [textBlocks]);

  const parseWisdomContent = (fileName, text) => {
    if (fileName.endsWith('.txt')) {
      return text.split('\n').map((line) => line.trim()).filter(Boolean);
    }
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    const startIndex = (firstLine.includes('名言') || firstLine.includes('內容') || firstLine.includes('語錄')) ? 1 : 0;
    return lines.slice(startIndex)
      .map((line) => {
        const parts = line.split(',');
        return parts.length > 1 ? parts[0].replace(/^["']|["']$/g, '') : line;
      })
      .filter(Boolean);
  };

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Promise.all(
          LOCAL_FONTS.map(async (font) => {
            const fontFace = new FontFace(font.name, `url(${FONT_BASE_PATH}${font.file})`);
            await fontFace.load();
            document.fonts.add(fontFace);
          })
        );
      } catch (error) {
        console.error('字型載入失敗:', error);
      } finally {
        setFontsLoaded(true);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    const { users } = readStoredUsers();
    const allUsers = Object.keys(users).length > 0
      ? users
      : { [DEFAULT_USER_NAME]: { ...DEFAULT_USER_STYLE_SETTINGS } };
    const storedActiveUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    const initialUser = (storedActiveUser && allUsers[storedActiveUser])
      ? storedActiveUser
      : Object.keys(allUsers)[0];

    setUserOptions(Object.keys(allUsers));
    setActiveUser(initialUser);
    applyUserStyleSettings(allUsers[initialUser]);
    setSettingsReady(true);
  }, [applyUserStyleSettings, readStoredUsers]);

  useEffect(() => {
    if (!settingsReady) return;
    const nextUsers = { ...readStoredUsers().users };
    nextUsers[activeUser] = {
      greetingFont,
      wisdomFont,
      greetingFillColor,
      greetingStrokeColor,
      wisdomFillColor,
      wisdomStrokeColor,
    };
    try {
      localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify({ users: nextUsers }));
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, activeUser);
    } catch (error) {
      console.error('儲存使用者樣式設定失敗:', error);
    }
  }, [
    settingsReady,
    readStoredUsers,
    activeUser,
    greetingFont,
    wisdomFont,
    greetingFillColor,
    greetingStrokeColor,
    wisdomFillColor,
    wisdomStrokeColor,
  ]);

  const handleSwitchUser = (userName) => {
    const { users } = readStoredUsers();
    const nextSettings = users[userName] || { ...DEFAULT_USER_STYLE_SETTINGS };
    setActiveUser(userName);
    applyUserStyleSettings(nextSettings);
  };

  const handleCreateUser = () => {
    const candidate = newUserName.trim();
    if (!candidate) return;

    const { users } = readStoredUsers();
    if (!users[candidate]) {
      users[candidate] = { ...DEFAULT_USER_STYLE_SETTINGS };
      try {
        localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify({ users }));
      } catch (error) {
        console.error('新增使用者失敗:', error);
      }
      setUserOptions(Object.keys(users));
    }

    setNewUserName('');
    handleSwitchUser(candidate);
  };

  useEffect(() => {
    const loadWisdom = async () => {
      setWisdomLoaded(false);
      try {
        const normalizedPath = normalizeWisdomPath(wisdomPath);
        const categories = await Promise.all(WISDOM_CONFIG.map(async (config) => {
          try {
            const response = await fetch(`${normalizedPath}${config.file}`);
            const text = await response.text();
            const quotes = parseWisdomContent(config.file, text);
            return { name: config.name, quotes: quotes.length ? quotes : ['暫無語錄'] };
          } catch {
            return { name: config.name, quotes: ['載入失敗'] };
          }
        }));
        setWisdomCategories(categories);
        setWisdomText((prev) => prev || categories[0]?.quotes?.[0] || '');
      } finally {
        setWisdomLoaded(true);
      }
    };

    loadWisdom();
  }, [wisdomPath]);

  useEffect(() => {
    const fitToView = () => {
      if (!wrapRef.current) return;
      const availableWidth = Math.max(wrapRef.current.clientWidth - 28, 360);
      const availableHeight = Math.max(window.innerHeight - 290, 360);
      const scale = Math.min(availableWidth / canvasSize.width, availableHeight / canvasSize.height);
      setZoom(clamp(Math.round(scale * 100), minZoom, maxZoom));
    };
    fitToView();
    window.addEventListener('resize', fitToView);
    return () => window.removeEventListener('resize', fitToView);
  }, [canvasSize.width, canvasSize.height]);

  const syncSelectedByType = useCallback((type, patch) => {
    if (!selectedIds.length) return;
    const before = textBlocks;
    const next = before.map((block) => {
      if (!selectionSet.has(block.id) || block.type !== type) return block;
      return { ...block, ...patch };
    });
    const changed = next.some((b, i) => b !== before[i]);
    if (!changed) return;
    pushHistory(before);
    setTextBlocks(next);
  }, [selectedIds.length, selectionSet, textBlocks, pushHistory]);

  const generateRandomQuote = useCallback(() => {
    const current = wisdomCategories[selectedCategory];
    if (!current?.quotes?.length) return;
    const quote = current.quotes[Math.floor(Math.random() * current.quotes.length)];
    setWisdomText(quote);
    syncSelectedByType('wisdom', { text: quote });
  }, [wisdomCategories, selectedCategory, syncSelectedByType]);

  const buildTemplateBlock = (type) => {
    const sameTypeCount = textBlocks.filter((b) => b.type === type).length;
    const offset = Math.min(sameTypeCount * 24, 120);

    if (type === 'greeting') {
      return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type,
        label: `問候語 ${sameTypeCount + 1}`,
        visible: true,
        locked: false,
        text: greetingText,
        x: canvasSize.width * 0.12 + offset,
        y: canvasSize.height * 0.08 + offset * 0.3,
        width: canvasSize.width * 0.76,
        height: canvasSize.height * 0.2,
        font: greetingFont,
        fillColor: greetingFillColor,
        strokeColor: greetingStrokeColor,
      };
    }

    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type,
      label: `智慧語 ${sameTypeCount + 1}`,
      visible: true,
      locked: false,
      text: wisdomText,
      x: canvasSize.width * 0.1 + offset * 0.6,
      y: canvasSize.height * 0.52 + offset * 0.3,
      width: canvasSize.width * 0.8,
      height: canvasSize.height * 0.36,
      font: wisdomFont,
      fillColor: wisdomFillColor,
      strokeColor: wisdomStrokeColor,
    };
  };

  const addTextBlock = (type) => {
    const nextBlock = buildTemplateBlock(type);
    pushHistory(textBlocks);
    setTextBlocks((prev) => [...prev, nextBlock]);
    setSelectedIds([nextBlock.id]);
    setPrimaryId(nextBlock.id);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    pushHistory(textBlocks);
    setTextBlocks((prev) => prev.filter((block) => !selectionSet.has(block.id)));
    setSelectedIds([]);
    setPrimaryId(null);
  }, [selectedIds.length, selectionSet, pushHistory, textBlocks]);

  const moveLayer = (id, direction) => {
    const idx = textBlocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const target = direction === 'up' ? idx + 1 : idx - 1;
    if (target < 0 || target >= textBlocks.length) return;
    pushHistory(textBlocks);
    const next = [...textBlocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    setTextBlocks(next);
  };

  const updateBlockById = (id, patch, options = {}) => {
    const { recordHistory = true } = options;
    const before = textBlocks;
    const next = before.map((block) => (block.id === id ? { ...block, ...patch } : block));
    const changed = next.some((block, idx) => block !== before[idx]);
    if (!changed) return;
    if (recordHistory) pushHistory(before);
    setTextBlocks(next);
  };

  const saveImage = () => {
    if (!canvasRef.current) return;
    setSelectedIds([]);
    setPrimaryId(null);
    setGuideLines({ x: null, y: null });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `good-morning-v4-${Date.now()}.jpg`;
        link.href = canvasRef.current.toDataURL('image/jpeg', 0.9);
        link.click();
      });
    });
  };

  const calculateFontSize = useCallback((ctx, text, width, height, fontFamily) => {
    const maxArea = (width * height) / 1.55;
    let fontSize = 12;
    while (fontSize < 140) {
      fontSize += 1;
      ctx.font = `${fontSize}px "${fontFamily}"`;
      const metrics = ctx.measureText(text || '字');
      if (metrics.width * (fontSize * 1.22) > maxArea) break;
    }
    return Math.max(fontSize - 4, 12);
  }, []);

  const drawHorizontalText = useCallback((ctx, block, fontSize) => {
    const padding = 14;
    const maxWidth = block.width - padding * 2;
    const chars = (block.text || '').split('');
    const lines = [];
    let current = '';

    chars.forEach((char) => {
      const test = current + char;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);

    lines.forEach((line, i) => {
      const x = block.x + padding;
      const y = block.y + padding + i * fontSize * 1.28;
      ctx.lineWidth = 3;
      ctx.strokeStyle = block.strokeColor;
      ctx.strokeText(line, x, y);
      ctx.fillStyle = block.fillColor;
      ctx.fillText(line, x, y);
    });
  }, []);

  const drawVerticalText = useCallback((ctx, block, fontSize) => {
    const spacing = 4;
    const padding = 12;
    const chars = (block.text || '').split('');

    const charWidth = ctx.measureText('測').width;
    const charHeight = fontSize;
    let x = block.x + block.width - padding - charWidth;
    let y = block.y + padding;

    chars.forEach((char) => {
      if (y + charHeight > block.y + block.height - padding) {
        y = block.y + padding;
        x -= charWidth + spacing;
      }
      if (x < block.x + padding) return;

      ctx.lineWidth = 3;
      ctx.strokeStyle = block.strokeColor;
      ctx.strokeText(char, x, y);
      ctx.fillStyle = block.fillColor;
      ctx.fillText(char, x, y);
      y += charHeight + spacing;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontsLoaded) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvasSize.width, canvasSize.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height);
      gradient.addColorStop(0, '#f8f2e8');
      gradient.addColorStop(1, '#e6edf3');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    textBlocks.filter((block) => block.visible !== false).forEach((block) => {
      const isSelected = selectionSet.has(block.id);
      const isPrimary = primaryId === block.id;

      ctx.save();
      if (isSelected) {
        ctx.strokeStyle = isPrimary ? '#1d5f8a' : '#d18d35';
        ctx.lineWidth = isPrimary ? 3 : 2;
        if (!isPrimary) ctx.setLineDash([6, 5]);
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        ctx.setLineDash([]);

        if (isPrimary) {
          const handles = [
            [block.x, block.y],
            [block.x + block.width, block.y],
            [block.x, block.y + block.height],
            [block.x + block.width, block.y + block.height],
          ];
          ctx.fillStyle = '#1d5f8a';
          handles.forEach(([hx, hy]) => {
            ctx.fillRect(hx - 5, hy - 5, 10, 10);
          });
        }
      }

      const fontSize = calculateFontSize(ctx, block.text, block.width, block.height, block.font);
      ctx.font = `${fontSize}px "${block.font}"`;
      ctx.textBaseline = 'top';
      if (block.height > block.width) drawVerticalText(ctx, block, fontSize);
      else drawHorizontalText(ctx, block, fontSize);
      ctx.restore();
    });

    if (guideLines.x !== null || guideLines.y !== null) {
      ctx.save();
      ctx.strokeStyle = '#d18d35';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([8, 6]);
      if (guideLines.x !== null) {
        ctx.beginPath();
        ctx.moveTo(guideLines.x, 0);
        ctx.lineTo(guideLines.x, canvasSize.height);
        ctx.stroke();
      }
      if (guideLines.y !== null) {
        ctx.beginPath();
        ctx.moveTo(0, guideLines.y);
        ctx.lineTo(canvasSize.width, guideLines.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [
    backgroundImage,
    canvasSize.height,
    canvasSize.width,
    drawHorizontalText,
    drawVerticalText,
    fontsLoaded,
    guideLines.x,
    guideLines.y,
    primaryId,
    selectionSet,
    textBlocks,
    calculateFontSize,
  ]);

  const getHandle = (block, x, y) => {
    const points = {
      tl: [block.x, block.y],
      tr: [block.x + block.width, block.y],
      bl: [block.x, block.y + block.height],
      br: [block.x + block.width, block.y + block.height],
    };
    const hit = 11;
    for (const [name, [px, py]] of Object.entries(points)) {
      if (Math.abs(px - x) <= hit && Math.abs(py - y) <= hit) return name;
    }
    return null;
  };

  const getClosestSnap = (value, targets) => {
    let best = null;
    targets.forEach((target) => {
      const d = Math.abs(value - target);
      if (d <= snapThreshold && (!best || d < best.d)) best = { target, d };
    });
    return best;
  };

  const startPointer = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasSize.height / rect.height);
    const multi = e.shiftKey || e.ctrlKey || e.metaKey;

    const hitBlocks = textBlocks.filter((block) => block.visible !== false);
    for (let i = hitBlocks.length - 1; i >= 0; i -= 1) {
      const block = hitBlocks[i];
      const inBlock = x >= block.x && x <= block.x + block.width && y >= block.y && y <= block.y + block.height;
      if (!inBlock) continue;

      if (!block.locked && selectedIds.length === 1 && primaryId === block.id) {
        const handle = getHandle(block, x, y);
        if (handle) {
          pushHistory(textBlocks);
          dragRef.current = {
            mode: 'resize',
            startX: x,
            startY: y,
            handle,
            selectedIds: [block.id],
            snapshotById: new Map([[block.id, { ...block }]]),
          };
          return;
        }
      }

      if (multi) {
        const toggled = selectionSet.has(block.id)
          ? selectedIds.filter((id) => id !== block.id)
          : [...selectedIds, block.id];
        setSelectedIds(toggled);
        setPrimaryId(toggled[toggled.length - 1] ?? null);
        return;
      }

      const effectiveIds = selectionSet.has(block.id) ? selectedIds : [block.id];
      setSelectedIds(effectiveIds);
      setPrimaryId(block.id);
      if (block.locked) return;

      pushHistory(textBlocks);
      dragRef.current = {
        mode: 'drag',
        startX: x,
        startY: y,
        handle: null,
        selectedIds: effectiveIds,
        snapshotById: new Map(effectiveIds.map((id) => {
          const hit = textBlocks.find((b) => b.id === id);
          return [id, { ...hit }];
        })),
      };
      return;
    }

    setSelectedIds([]);
    setPrimaryId(null);
  };

  const movePointer = useCallback((e) => {
    const dragState = dragRef.current;
    if (!dragState.mode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasSize.height / rect.height);

    if (dragState.mode === 'drag') {
      const deltaX = x - dragState.startX;
      const deltaY = y - dragState.startY;
      const selectedSnapshot = dragState.selectedIds.map((id) => dragState.snapshotById.get(id));
      const primarySnapshot = dragState.snapshotById.get(primaryId) || selectedSnapshot[0];
      if (!primarySnapshot) return;

      const others = textBlocks.filter((b) => b.visible !== false && !dragState.selectedIds.includes(b.id));
      const targetsX = [0, canvasSize.width / 2, canvasSize.width, ...others.flatMap((b) => [b.x, b.x + b.width / 2, b.x + b.width])];
      const targetsY = [0, canvasSize.height / 2, canvasSize.height, ...others.flatMap((b) => [b.y, b.y + b.height / 2, b.y + b.height])];

      const proposedX = primarySnapshot.x + deltaX;
      const proposedY = primarySnapshot.y + deltaY;
      const snapCenterX = getClosestSnap(proposedX + primarySnapshot.width / 2, targetsX);
      const snapCenterY = getClosestSnap(proposedY + primarySnapshot.height / 2, targetsY);

      const offsetX = snapCenterX ? snapCenterX.target - (proposedX + primarySnapshot.width / 2) : 0;
      const offsetY = snapCenterY ? snapCenterY.target - (proposedY + primarySnapshot.height / 2) : 0;

      const moved = textBlocks.map((block) => {
        const source = dragState.snapshotById.get(block.id);
        if (!source) return block;
        const nextX = clamp(source.x + deltaX + offsetX, 0, canvasSize.width - block.width);
        const nextY = clamp(source.y + deltaY + offsetY, 0, canvasSize.height - block.height);
        return { ...block, x: nextX, y: nextY };
      });

      setGuideLines({ x: snapCenterX?.target ?? null, y: snapCenterY?.target ?? null });
      setTextBlocks(moved);
      return;
    }

    if (dragState.mode === 'resize') {
      const id = dragState.selectedIds[0];
      const source = dragState.snapshotById.get(id);
      if (!source) return;

      const dx = x - dragState.startX;
      const dy = y - dragState.startY;

      setTextBlocks((prev) => prev.map((block) => {
        if (block.id !== id) return block;

        let nextX = source.x;
        let nextY = source.y;
        let nextW = source.width;
        let nextH = source.height;

        if (dragState.handle.includes('r')) nextW = clamp(source.width + dx, 80, canvasSize.width - source.x);
        if (dragState.handle.includes('l')) {
          nextX = clamp(source.x + dx, 0, source.x + source.width - 80);
          nextW = source.width - (nextX - source.x);
        }
        if (dragState.handle.includes('b')) nextH = clamp(source.height + dy, 80, canvasSize.height - source.y);
        if (dragState.handle.includes('t')) {
          nextY = clamp(source.y + dy, 0, source.y + source.height - 80);
          nextH = source.height - (nextY - source.y);
        }

        return { ...block, x: nextX, y: nextY, width: nextW, height: nextH };
      }));
    }
  }, [canvasSize.height, canvasSize.width, primaryId, textBlocks]);

  const endPointer = useCallback(() => {
    dragRef.current = { mode: null, startX: 0, startY: 0, handle: null, selectedIds: [], snapshotById: new Map() };
    setGuideLines({ x: null, y: null });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', movePointer);
    window.addEventListener('mouseup', endPointer);
    return () => {
      window.removeEventListener('mousemove', movePointer);
      window.removeEventListener('mouseup', endPointer);
    };
  }, [movePointer, endPointer]);

  const nudgeSelected = useCallback((dx, dy) => {
    if (!selectedIds.length) return;
    pushHistory(textBlocks);
    setTextBlocks((prev) => prev.map((block) => {
      if (!selectionSet.has(block.id) || block.locked) return block;
      return {
        ...block,
        x: clamp(block.x + dx, 0, canvasSize.width - block.width),
        y: clamp(block.y + dy, 0, canvasSize.height - block.height),
      };
    }));
  }, [selectedIds.length, pushHistory, textBlocks, selectionSet, canvasSize.width, canvasSize.height]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const isEditable = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );
      if (isEditable) return;

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 's') {
        e.preventDefault();
        saveImage();
        return;
      }
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelected(e.shiftKey ? -10 : -1, 0);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelected(e.shiftKey ? 10 : 1, 0);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelected(0, e.shiftKey ? -10 : -1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelected(0, e.shiftKey ? 10 : 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelected, nudgeSelected, redo, undo]);

  const uploadImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        pushHistory(textBlocks);
        setCanvasSize({ width: Math.max(1, img.width), height: Math.max(1, img.height) });
        setBackgroundImage(img);
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const canvasDisplayWidth = Math.round((canvasSize.width * zoom) / 100);
  const canvasDisplayHeight = Math.round((canvasSize.height * zoom) / 100);
  const canUndo = historyVersion >= 0 && historyRef.current.length > 0;
  const canRedo = historyVersion >= 0 && futureRef.current.length > 0;
  const orderedLayers = [...textBlocks].reverse();

  return (
    <div className="gm4-page">
      <div className="gm4-shell">
        <header className="gm4-header">
          <div>
            <h1>Good Morning Generator V4</h1>
            <p>更乾淨的介面、更可預測的排版，以及即時套用編輯流程</p>
          </div>
          <div className="gm4-header-actions">
            <details className="gm4-user-menu">
              <summary className="gm4-btn gm4-btn-soft">使用者設定</summary>
              <div className="gm4-user-panel">
                <select
                  className="gm4-input"
                  value={activeUser}
                  onChange={(e) => handleSwitchUser(e.target.value)}
                >
                  {userOptions.map((user) => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
                <div className="gm4-row">
                  <input
                    className="gm4-input"
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="新增使用者名稱"
                  />
                  <button className="gm4-btn gm4-btn-soft" onClick={handleCreateUser}>新增/切換</button>
                </div>
                <p className="gm4-meta">每位使用者會記住字型與顏色設定。</p>
              </div>
            </details>
            <button className="gm4-btn gm4-btn-soft" onClick={undo} disabled={!canUndo}><Undo /> 復原</button>
            <button className="gm4-btn gm4-btn-soft" onClick={redo} disabled={!canRedo}><Redo /> 重做</button>
            <button className="gm4-btn gm4-btn-primary" onClick={saveImage}><Download /> 匯出 JPG</button>
          </div>
        </header>

        {(!fontsLoaded || !wisdomLoaded) && (
          <div className="gm4-status">{!fontsLoaded ? '載入字型中... ' : ''}{!wisdomLoaded ? '載入語錄中...' : ''}</div>
        )}

        <main className="gm4-main">
          <aside className="gm4-sidebar">
            <section className="gm4-card">
              <h2>素材</h2>
              <label className="gm4-upload">
                <input type="file" accept="image/*" onChange={uploadImage} />
                <span>上傳背景圖片</span>
              </label>
              <div className="gm4-row">
                <button className="gm4-btn gm4-btn-primary" onClick={() => addTextBlock('greeting')}>新增問候語框</button>
                <button className="gm4-btn gm4-btn-soft" onClick={() => addTextBlock('wisdom')}>新增智慧語框</button>
              </div>
            </section>

            <section className="gm4-card">
              <h2>問候語樣式（即時套用）</h2>
              <input
                className="gm4-input"
                value={greetingText}
                onChange={(e) => {
                  const v = e.target.value;
                  setGreetingText(v);
                  syncSelectedByType('greeting', { text: v });
                }}
                placeholder="輸入問候語"
              />
              <select
                className="gm4-input"
                value={greetingFont}
                onChange={(e) => {
                  const v = e.target.value;
                  setGreetingFont(v);
                  syncSelectedByType('greeting', { font: v });
                }}
              >
                {LOCAL_FONTS.map((font) => <option key={font.name} value={font.name}>{font.name}</option>)}
              </select>
              <div className="gm4-color-grid">
                <label>填色<input type="color" value={greetingFillColor} onChange={(e) => {
                  const v = e.target.value;
                  setGreetingFillColor(v);
                  syncSelectedByType('greeting', { fillColor: v });
                }} /></label>
                <label>描邊<input type="color" value={greetingStrokeColor} onChange={(e) => {
                  const v = e.target.value;
                  setGreetingStrokeColor(v);
                  syncSelectedByType('greeting', { strokeColor: v });
                }} /></label>
              </div>
            </section>

            <section className="gm4-card">
              <h2>智慧語樣式（即時套用）</h2>
              <select
                className="gm4-input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                disabled={!wisdomLoaded}
              >
                {wisdomCategories.map((cat, idx) => <option key={cat.name} value={idx}>{cat.name} ({cat.quotes.length})</option>)}
              </select>
              <div className="gm4-row">
                <button className="gm4-btn gm4-btn-soft" onClick={generateRandomQuote} disabled={!wisdomLoaded}>隨機語錄</button>
              </div>
              <textarea
                className="gm4-input gm4-textarea"
                value={wisdomText}
                onChange={(e) => {
                  const v = e.target.value;
                  setWisdomText(v);
                  syncSelectedByType('wisdom', { text: v });
                }}
                placeholder="輸入智慧語"
              />
              <select
                className="gm4-input"
                value={wisdomFont}
                onChange={(e) => {
                  const v = e.target.value;
                  setWisdomFont(v);
                  syncSelectedByType('wisdom', { font: v });
                }}
              >
                {LOCAL_FONTS.map((font) => <option key={font.name} value={font.name}>{font.name}</option>)}
              </select>
              <div className="gm4-color-grid">
                <label>填色<input type="color" value={wisdomFillColor} onChange={(e) => {
                  const v = e.target.value;
                  setWisdomFillColor(v);
                  syncSelectedByType('wisdom', { fillColor: v });
                }} /></label>
                <label>描邊<input type="color" value={wisdomStrokeColor} onChange={(e) => {
                  const v = e.target.value;
                  setWisdomStrokeColor(v);
                  syncSelectedByType('wisdom', { strokeColor: v });
                }} /></label>
              </div>
            </section>

            <section className="gm4-card">
              <h2>圖層 ({textBlocks.length})</h2>
              <div className="gm4-layers">
                {orderedLayers.map((block) => {
                  const isSelected = selectionSet.has(block.id);
                  return (
                    <div key={block.id} className={`gm4-layer ${isSelected ? 'is-selected' : ''}`}>
                      <button
                        className="gm4-layer-main"
                        onClick={() => {
                          setSelectedIds([block.id]);
                          setPrimaryId(block.id);
                        }}
                      >
                        {block.label || (block.type === 'greeting' ? '問候語' : '智慧語')}
                      </button>
                      <div className="gm4-layer-actions">
                        <button onClick={() => {
                          const name = window.prompt('圖層名稱', block.label || '');
                          if (name === null) return;
                          updateBlockById(block.id, { label: name.trim() || block.label || '未命名圖層' });
                        }}>名</button>
                        <button onClick={() => {
                          const nextVisible = block.visible === false;
                          updateBlockById(block.id, { visible: nextVisible });
                          if (!nextVisible && selectionSet.has(block.id)) {
                            const nextSelected = selectedIds.filter((id) => id !== block.id);
                            setSelectedIds(nextSelected);
                            if (primaryId === block.id) setPrimaryId(nextSelected[0] ?? null);
                          }
                        }}>{block.visible === false ? '藏' : '顯'}</button>
                        <button onClick={() => updateBlockById(block.id, { locked: !block.locked })}>{block.locked ? '鎖' : '開'}</button>
                        <button onClick={() => moveLayer(block.id, 'up')}>↑</button>
                        <button onClick={() => moveLayer(block.id, 'down')}>↓</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="gm4-btn gm4-btn-danger" disabled={!selectedIds.length} onClick={deleteSelected}>刪除選取區塊 ({selectedIds.length})</button>
            </section>

          </aside>

          <section className="gm4-preview">
            <div className="gm4-toolbar">
              <div className="gm4-row">
                <button className="gm4-btn gm4-btn-soft" onClick={() => setZoom((z) => clamp(z - 10, minZoom, maxZoom))}>-</button>
                <button className="gm4-btn gm4-btn-soft" onClick={() => setZoom(100)}>{zoom}%</button>
                <button className="gm4-btn gm4-btn-soft" onClick={() => setZoom((z) => clamp(z + 10, minZoom, maxZoom))}>+</button>
              </div>
              <div className="gm4-row">
                <button className={`gm4-btn ${showGrid ? 'gm4-btn-primary' : 'gm4-btn-soft'}`} onClick={() => setShowGrid((v) => !v)}>網格</button>
                <button className={`gm4-btn ${showRuler ? 'gm4-btn-primary' : 'gm4-btn-soft'}`} onClick={() => setShowRuler((v) => !v)}>尺規</button>
                <span className="gm4-meta">畫布 {canvasSize.width} x {canvasSize.height}</span>
              </div>
            </div>

            <div className="gm4-canvas-wrap" ref={wrapRef}>
              <div className="gm4-canvas-stage" style={{ width: canvasDisplayWidth, height: canvasDisplayHeight }}>
                {showGrid && <div className="gm4-grid" />}
                {showRuler && (
                  <>
                    <div className="gm4-ruler gm4-ruler-top" />
                    <div className="gm4-ruler gm4-ruler-left" />
                  </>
                )}
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  onMouseDown={startPointer}
                  style={{ width: canvasDisplayWidth, height: canvasDisplayHeight }}
                />
              </div>
            </div>
            <p className="gm4-tip">快捷鍵：Ctrl/Cmd+S 匯出、Ctrl/Cmd+Z 復原、Shift+Z/Ctrl+Y 重做、Delete 刪除、方向鍵微調</p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default GoodMorningGeneratorV4;
