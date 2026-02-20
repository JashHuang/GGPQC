import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './good-morning-generator.css';
import FontManager from './FontManager';
import WisdomManager, { getCustomWisdomFromDB } from './WisdomManager';
import SignatureManager from './SignatureManager';
import MobileControls from './MobileControls';

const DEFAULT_WISDOM_PATH = 'wisdom/';

const BUILTIN_FONTS = [
  { name: '思源黑體 (TC)', family: '"Noto Sans TC", sans-serif' },
  { name: '思源宋體 (TC)', family: '"Noto Serif TC", serif' },
  { name: '霞鶩文楷 (TC)', family: '"LXGW WenKai TC", sans-serif' },
  { name: '霞鶩文楷等寬 (TC)', family: '"LXGW WenKai Mono TC", monospace' },
  { name: '馬善政楷體', family: '"Ma Shan Zheng", cursive' },
  { name: '至莽行書', family: '"Zhi Mang Xing", cursive' },
  { name: '劉建毛草', family: '"Liu Jian Mao Cao", cursive' },
  { name: '小薇 LOGO 體', family: '"ZCOOL XiaoWei", sans-serif' },
  { name: '正酷快樂體', family: '"ZCOOL Kuaile", sans-serif' },
  { name: '青刻黃油體', family: '"ZCOOL QingKe HuangYou", sans-serif' },
  { name: '微軟正黑體', family: '"Microsoft JhengHei", sans-serif' },
  { name: '系統預設黑體', family: 'sans-serif' },
  { name: '系統預設明體', family: 'serif' },
];

const WISDOM_CONFIG = [
  { name: '1.一般問候', file: 'GPT問候語2.txt' },
  { name: '2.隨機智慧語', file: '名言merged.csv' },
  { name: '3.365名言', file: '365句名言2.csv' },
  { name: '4.聖嚴法師', file: '聖嚴法師108自在語-全.csv' },
  { name: '5.證嚴法師', file: '證嚴法師-靜思語400句.csv' },
  { name: '6.週末問候語', file: '週末問候.csv' },
];

const USER_SETTINGS_STORAGE_KEY = 'gm-v5-user-settings-v1';
const ACTIVE_USER_STORAGE_KEY = 'gm-v5-active-user-v1';
const DISABLED_FONTS_STORAGE_KEY = 'gm-v5-disabled-fonts-v1';
const THEME_STORAGE_KEY = 'gm-v5-theme-v1';
const DEFAULT_USER_NAME = '預設用戶';
const DEFAULT_USER_STYLE_SETTINGS = {
  greetingFont: BUILTIN_FONTS[0].name,
  wisdomFont: BUILTIN_FONTS[1].name,
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
  const result = trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  return result;
};

const Download = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
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

const ThemeSelector = ({ current, onSelect }) => (
  <div className="theme-selector">
    {['light', 'dark', 'sunset', 'forest'].map(t => (
      <div 
        key={t} 
        className={`theme-opt opt-${t} ${current === t ? 'active' : ''}`} 
        onClick={() => onSelect(t)} 
        title={t} 
      />
    ))}
  </div>
);

const GoodMorningGeneratorV5 = () => {
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

  const [greetingText, setGreetingText] = useState('早安');
  const [wisdomText, setWisdomText] = useState('美好的一天，順心如意');
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

  const [customFonts, setCustomFonts] = useState([]);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState(false);
  const [isWisdomManagerOpen, setIsWisdomManagerOpen] = useState(false);
  const [isSignatureManagerOpen, setIsSignatureManagerOpen] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [disabledPresetFonts, setDisabledPresetFonts] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');
  const [activeMobileTab, setActiveMobileTab] = useState('tool');
  const [isMobileDrawerExpanded, setIsMobileDrawerExpanded] = useState(true);

  const selectionSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const maxZoom = 180;
  const minZoom = 30;
  const snapThreshold = 10;

  // Sync theme
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Load disabled fonts
  useEffect(() => {
    const stored = localStorage.getItem(DISABLED_FONTS_STORAGE_KEY);
    if (stored) {
      try {
        setDisabledPresetFonts(JSON.parse(stored));
      } catch (e) {
        console.error('讀取停用字型設定失敗:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DISABLED_FONTS_STORAGE_KEY, JSON.stringify(disabledPresetFonts));
  }, [disabledPresetFonts]);

  const handleTogglePresetFont = (fontName) => {
    setDisabledPresetFonts((prev) =>
      prev.includes(fontName) ? prev.filter((f) => f !== fontName) : [...prev, fontName]
    );
  };

  // Combine fonts
  const allFonts = useMemo(() => {
    const builtin = BUILTIN_FONTS.filter(f => !disabledPresetFonts.includes(f.name));
    const custom = customFonts
      .filter(f => f.enabled !== false)
      .map(f => ({ name: f.name, isCustom: true }));
    return [...builtin, ...custom];
  }, [customFonts, disabledPresetFonts]);

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

  const updateBlockById = useCallback((id, patch, options = {}) => {
    const { recordHistory: shouldRecord = true } = options;
    const before = textBlocks;
    const next = before.map((block) => (block.id === id ? { ...block, ...patch } : block));
    const changed = next.some((block, idx) => block !== before[idx]);
    if (!changed) return;
    if (shouldRecord) pushHistory(before);
    setTextBlocks(next);
  }, [textBlocks, pushHistory]);

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

  const applyUserStyleSettings = useCallback((settings = {}) => {
    const fontNames = allFonts.map((font) => font.name);
    const nextGreetingFont = settings.greetingFont ?? DEFAULT_USER_STYLE_SETTINGS.greetingFont;
    const nextWisdomFont = settings.wisdomFont ?? DEFAULT_USER_STYLE_SETTINGS.wisdomFont;
    setGreetingFont(fontNames.includes(nextGreetingFont) ? nextGreetingFont : DEFAULT_USER_STYLE_SETTINGS.greetingFont);
    setWisdomFont(fontNames.includes(nextWisdomFont) ? nextWisdomFont : DEFAULT_USER_STYLE_SETTINGS.wisdomFont);
    setGreetingFillColor(settings.greetingFillColor ?? DEFAULT_USER_STYLE_SETTINGS.greetingFillColor);
    setGreetingStrokeColor(settings.greetingStrokeColor ?? DEFAULT_USER_STYLE_SETTINGS.greetingStrokeColor);
    setWisdomFillColor(settings.wisdomFillColor ?? DEFAULT_USER_STYLE_SETTINGS.wisdomFillColor);
    setWisdomStrokeColor(settings.wisdomStrokeColor ?? DEFAULT_USER_STYLE_SETTINGS.wisdomStrokeColor);
  }, [allFonts]);

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

  // Init users
  useEffect(() => {
    const { users } = readStoredUsers();
    const allUsers = Object.keys(users).length > 0 ? users : { [DEFAULT_USER_NAME]: { ...DEFAULT_USER_STYLE_SETTINGS } };
    const storedActiveUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    const initialUser = (storedActiveUser && allUsers[storedActiveUser]) ? storedActiveUser : Object.keys(allUsers)[0];
    setUserOptions(Object.keys(allUsers));
    setActiveUser(initialUser);
    applyUserStyleSettings(allUsers[initialUser]);
    setSettingsReady(true);
  }, [applyUserStyleSettings, readStoredUsers]);

  // Save users on change
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
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify({ users: nextUsers }));
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, activeUser);
  }, [settingsReady, readStoredUsers, activeUser, greetingFont, wisdomFont, greetingFillColor, greetingStrokeColor, wisdomFillColor, wisdomStrokeColor]);

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
      localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify({ users }));
      setUserOptions(Object.keys(users));
    }
    setNewUserName('');
    handleSwitchUser(candidate);
  };

  // Load Wisdom
  useEffect(() => {
    const loadWisdom = async () => {
      setWisdomLoaded(false);
      try {
        const path = normalizeWisdomPath(wisdomPath);
        const categories = await Promise.all(WISDOM_CONFIG.map(async (cfg) => {
          try {
            const res = await fetch(`${path}${cfg.file}`);
            const text = await res.text();
            let quotes = [];
            if (cfg.file.endsWith('.txt')) {
              quotes = text.split('\n').map(l => l.trim()).filter(Boolean);
            } else {
              const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
              quotes = lines.slice(1).map(l => l.split(',')[0].replace(/^["']|["']$/g, '')).filter(Boolean);
            }
            return { name: cfg.name, quotes: quotes.length ? quotes : ['暫無語錄'] };
          } catch { return { name: cfg.name, quotes: ['載入失敗'] }; }
        }));
        const custom = await getCustomWisdomFromDB();
        categories.push({ name: '7.自訂語錄', quotes: custom.length ? custom : ['尚未建立自訂語錄'] });
        setWisdomCategories(categories);
        if (categories[0]?.quotes?.[0]) setWisdomText(categories[0].quotes[0]);
      } finally { setWisdomLoaded(true); }
    };
    loadWisdom();
  }, [wisdomPath]);

  // Redraw handling
  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
        setHistoryVersion(v => v + 1);
      });
    } else { setTimeout(() => setFontsLoaded(true), 1500); }
  }, []);

  // Responsive zoom
  useEffect(() => {
    const fit = () => {
      if (!wrapRef.current) return;
      const aw = Math.max(wrapRef.current.clientWidth - 28, 360);
      const ah = Math.max(window.innerHeight - 320, 360);
      const scale = Math.min(aw / canvasSize.width, ah / canvasSize.height);
      setZoom(clamp(Math.round(scale * 100), minZoom, maxZoom));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [canvasSize.width, canvasSize.height]);

  const generateRandomQuote = useCallback(() => {
    const current = wisdomCategories[selectedCategory];
    if (!current?.quotes?.length) return;
    const q = current.quotes[Math.floor(Math.random() * current.quotes.length)];
    setWisdomText(q);
    syncSelectedByType('wisdom', { text: q });
  }, [wisdomCategories, selectedCategory, syncSelectedByType]);

  const addTextBlock = (type) => {
    const count = textBlocks.filter(b => b.type === type).length;
    const offset = Math.min(count * 24, 120);
    const id = Date.now() + Math.random();
    const block = {
      id,
      type,
      label: type === 'greeting' ? `問候語 ${count + 1}` : `智慧語 ${count + 1}`,
      visible: true,
      locked: false,
      text: type === 'greeting' ? greetingText : wisdomText,
      x: type === 'greeting' ? canvasSize.width * 0.12 + offset : canvasSize.width * 0.1 + offset * 0.6,
      y: type === 'greeting' ? canvasSize.height * 0.08 + offset * 0.3 : canvasSize.height * 0.52 + offset * 0.3,
      width: type === 'greeting' ? canvasSize.width * 0.76 : canvasSize.width * 0.8,
      height: type === 'greeting' ? canvasSize.height * 0.2 : canvasSize.height * 0.36,
      font: type === 'greeting' ? greetingFont : wisdomFont,
      fillColor: type === 'greeting' ? greetingFillColor : wisdomFillColor,
      strokeColor: type === 'greeting' ? greetingStrokeColor : wisdomStrokeColor,
    };
    pushHistory(textBlocks);
    setTextBlocks(prev => [...prev, block]);
    setSelectedIds([id]);
    setPrimaryId(id);
  };

  const addSignatureBlock = (sig) => {
    const img = new Image();
    img.onload = () => {
      const id = 'signature-layer';
      const block = {
        id, type: 'signature', label: '簽名檔', visible: true, locked: false,
        x: canvasSize.width * 0.7, y: canvasSize.height * 0.8,
        width: 180, height: 180 * (img.height / img.width),
        data: sig.data
      };
      setSignatureImage(img);
      const exists = textBlocks.findIndex(b => b.id === id);
      if (exists !== -1) {
        updateBlockById(id, block);
      } else {
        pushHistory(textBlocks);
        setTextBlocks(prev => [...prev, block]);
      }
      setSelectedIds([id]);
      setPrimaryId(id);
    };
    img.src = sig.data;
  };

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    pushHistory(textBlocks);
    setTextBlocks(prev => prev.filter(b => !selectionSet.has(b.id)));
    setSelectedIds([]);
    setPrimaryId(null);
  }, [selectedIds.length, selectionSet, textBlocks, pushHistory]);

  const moveLayer = (id, dir) => {
    const idx = textBlocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const target = dir === 'up' ? idx + 1 : idx - 1;
    if (target < 0 || target >= textBlocks.length) return;
    pushHistory(textBlocks);
    const next = [...textBlocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    setTextBlocks(next);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        pushHistory(textBlocks);
        setBackgroundImage(img);
        setCanvasSize({ width: img.width, height: img.height });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const saveImage = () => {
    if (!canvasRef.current) return;
    setSelectedIds([]);
    setPrimaryId(null);
    setGuideLines({ x: null, y: null });
    requestAnimationFrame(() => {
      const link = document.createElement('a');
      link.download = `gm5-${Date.now()}.jpg`;
      link.href = canvasRef.current.toDataURL('image/jpeg', 0.9);
      link.click();
    });
  };

  const calculateFontSize = useCallback((ctx, text, w, h, font) => {
    const area = (w * h) / 1.55;
    let size = 12;
    const f = font.includes('"') || font.includes(',') ? font : `"${font}"`;
    while (size < 140) {
      size++;
      ctx.font = `${size}px ${f}`;
      if (ctx.measureText(text || '字').width * (size * 1.22) > area) break;
    }
    return Math.max(size - 4, 12);
  }, []);

  const drawHorizontal = useCallback((ctx, b, fontSize) => {
    const p = 14;
    const mw = b.width - p * 2;
    const lines = [];
    let cur = '';
    (b.text || '').split('').forEach(char => {
      if (ctx.measureText(cur + char).width > mw && cur) {
        lines.push(cur); cur = char;
      } else { cur += char; }
    });
    if (cur) lines.push(cur);
    
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.imageSmoothingQuality = 'high';
    const sw = Math.max(2, fontSize * 0.05);
    ctx.lineWidth = sw;

    lines.forEach((l, i) => {
      const x = Math.round(b.x + p);
      const y = Math.round(b.y + p + i * fontSize * 1.28);
      
      // 使用微小陰影達成反鋸齒效果
      ctx.shadowColor = b.strokeColor;
      ctx.shadowBlur = 1.2;
      ctx.strokeStyle = b.strokeColor;
      ctx.strokeText(l, x, y);
      
      // 繪製填色時關閉陰影以免影響字體清晰度
      ctx.shadowBlur = 0;
      ctx.fillStyle = b.fillColor;
      ctx.fillText(l, x, y);
    });
  }, []);

  const drawVertical = useCallback((ctx, b, fontSize) => {
    const sp = 4;
    const p = 12;
    const cw = ctx.measureText('測').width;
    let x = b.x + b.width - p - cw, y = b.y + p;
    
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.imageSmoothingQuality = 'high';
    const sw = Math.max(2, fontSize * 0.05);
    ctx.lineWidth = sw;

    (b.text || '').split('').forEach(char => {
      if (y + fontSize > b.y + b.height - p) { y = b.y + p; x -= cw + sp; }
      if (x < b.x + p) return;
      
      const rx = Math.round(x);
      const ry = Math.round(y);
      
      ctx.shadowColor = b.strokeColor;
      ctx.shadowBlur = 1.2;
      ctx.strokeStyle = b.strokeColor;
      ctx.strokeText(char, rx, ry);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = b.fillColor;
      ctx.fillText(char, rx, ry);
      
      y += fontSize + sp;
    });
  }, []);

  // Main Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontsLoaded) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    if (backgroundImage) ctx.drawImage(backgroundImage, 0, 0, canvasSize.width, canvasSize.height);
    else {
      const g = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height);
      g.addColorStop(0, '#f8f2e8'); g.addColorStop(1, '#e6edf3');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }
    textBlocks.filter(b => b.visible !== false).forEach(b => {
      const isSel = selectionSet.has(b.id);
      const isPri = primaryId === b.id;
      const fDef = BUILTIN_FONTS.find(f => f.name === b.font);
      const font = fDef?.family || `"${b.font}"`;
      ctx.save();
      if (isSel) {
        ctx.strokeStyle = isPri ? '#1d5f8a' : '#d18d35'; ctx.lineWidth = isPri ? 3 : 2;
        if (!isPri) ctx.setLineDash([5, 5]);
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        if (isPri) {
          ctx.fillStyle = '#1d5f8a';
          [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].forEach(([hx, hy]) => ctx.fillRect(hx - 5, hy - 5, 10, 10));
        }
      }
      if (b.type === 'signature' && b.data) {
        if (signatureImage && signatureImage.src === b.data) ctx.drawImage(signatureImage, b.x, b.y, b.width, b.height);
        else { const i = new Image(); i.onload = () => { setSignatureImage(i); setHistoryVersion(v => v + 1); }; i.src = b.data; }
      } else {
        const size = calculateFontSize(ctx, b.text, b.width, b.height, font);
        ctx.font = `${size}px ${font}`; ctx.textBaseline = 'top';
        if (b.height > b.width) drawVertical(ctx, b, size); else drawHorizontal(ctx, b, size);
      }
      ctx.restore();
    });
    if (guideLines.x !== null || guideLines.y !== null) {
      ctx.strokeStyle = '#d18d35'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
      if (guideLines.x !== null) { ctx.beginPath(); ctx.moveTo(guideLines.x, 0); ctx.lineTo(guideLines.x, canvasSize.height); ctx.stroke(); }
      if (guideLines.y !== null) { ctx.beginPath(); ctx.moveTo(0, guideLines.y); ctx.lineTo(canvasSize.width, guideLines.y); ctx.stroke(); }
    }
  }, [backgroundImage, canvasSize, textBlocks, fontsLoaded, selectionSet, primaryId, guideLines, historyVersion, calculateFontSize, drawHorizontal, drawVertical, signatureImage]);

  const getHandle = (b, x, y) => {
    const hit = 25; // 增加感應區域
    const pts = { tl: [b.x, b.y], tr: [b.x + b.width, b.y], bl: [b.x, b.y + b.height], br: [b.x + b.width, b.y + b.height] };
    for (const [k, [px, py]] of Object.entries(pts)) if (Math.abs(px - x) < hit && Math.abs(py - y) < hit) return k;
    return null;
  };

  const updateCursor = (e) => {
    if (dragRef.current.mode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasSize.height / rect.height);
    
    // 找出最上層的物件
    const hit = [...textBlocks].reverse().find(b => b.visible !== false && x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    
    if (!hit || hit.locked) {
      canvasRef.current.style.cursor = 'default';
      return;
    }

    // 如果目前物件已選中，檢查縮放手把
    if (selectedIds.includes(hit.id) && primaryId === hit.id) {
      const h = getHandle(hit, x, y);
      if (h) {
        if (h === 'tl' || h === 'br') { canvasRef.current.style.cursor = 'nwse-resize'; return; }
        if (h === 'tr' || h === 'bl') { canvasRef.current.style.cursor = 'nesw-resize'; return; }
      }
    }
    
    canvasRef.current.style.cursor = 'move';
  };

  const getSnap = useCallback((val, targets) => {
    let best = null;
    targets.forEach(t => {
      const d = Math.abs(val - t);
      if (d <= snapThreshold && (!best || d < best.d)) best = { t, d };
    });
    return best;
  }, [snapThreshold]);

  const startPointer = (e) => {
    // 支援 Touch 事件
    const pointer = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (pointer.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (pointer.clientY - rect.top) * (canvasSize.height / rect.height);
    
    // 如果是觸控，防止頁面捲動
    if (e.touches && e.cancelable) e.preventDefault();

    const multi = e.shiftKey || e.ctrlKey || e.metaKey;
    const hit = [...textBlocks].reverse().find(b => b.visible !== false && x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
    if (!hit) { setSelectedIds([]); setPrimaryId(null); return; }
    if (!hit.locked && selectedIds.length === 1 && primaryId === hit.id) {
      const h = getHandle(hit, x, y);
      if (h) {
        pushHistory(textBlocks);
        dragRef.current = { mode: 'resize', startX: x, startY: y, handle: h, selectedIds: [hit.id], snapshotById: new Map([[hit.id, { ...hit }]]) };
        return;
      }
    }
    if (multi) {
      const next = selectionSet.has(hit.id) ? selectedIds.filter(id => id !== hit.id) : [...selectedIds, hit.id];
      setSelectedIds(next); setPrimaryId(next[next.length - 1] || null); return;
    }
    const ids = selectionSet.has(hit.id) ? selectedIds : [hit.id];
    setSelectedIds(ids); setPrimaryId(hit.id);
    if (hit.locked) return;
    pushHistory(textBlocks);
    dragRef.current = {
      mode: 'drag', startX: x, startY: y, selectedIds: ids,
      snapshotById: new Map(ids.map(id => [id, { ...textBlocks.find(b => b.id === id) }]))
    };
  };

  const movePointer = useCallback((e) => {
    const d = dragRef.current;
    if (!d.mode || !canvasRef.current) return;

    // 支援 Touch 事件
    const pointer = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (pointer.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (pointer.clientY - rect.top) * (canvasSize.height / rect.height);
    
    // 防止觸戴下的頁面干擾
    if (e.touches && e.cancelable) e.preventDefault();

    if (d.mode === 'drag') {
      const dx = x - d.startX, dy = y - d.startY;
      const pri = d.snapshotById.get(primaryId) || [...d.snapshotById.values()][0];
      const others = textBlocks.filter(b => b.visible !== false && !d.selectedIds.includes(b.id));
      const tx = [0, canvasSize.width / 2, canvasSize.width, ...others.flatMap(b => [b.x, b.x + b.width / 2, b.x + b.width])];
      const ty = [0, canvasSize.height / 2, canvasSize.height, ...others.flatMap(b => [b.y, b.y + b.height / 2, b.y + b.height])];
      const sx = getSnap(pri.x + dx + pri.width / 2, tx);
      const sy = getSnap(pri.y + dy + pri.height / 2, ty);
      const ox = sx ? sx.t - (pri.x + dx + pri.width / 2) : 0;
      const oy = sy ? sy.t - (pri.y + dy + pri.height / 2) : 0;
      setTextBlocks(prev => prev.map(b => {
        const s = d.snapshotById.get(b.id);
        if (!s) return b;
        return { ...b, x: clamp(s.x + dx + ox, 0, canvasSize.width - b.width), y: clamp(s.y + dy + oy, 0, canvasSize.height - b.height) };
      }));
      setGuideLines({ x: sx?.t ?? null, y: sy?.t ?? null });
    } else if (d.mode === 'resize') {
      const id = d.selectedIds[0], s = d.snapshotById.get(id);
      const dx = x - d.startX, dy = y - d.startY;
      setTextBlocks(prev => prev.map(b => {
        if (b.id !== id) return b;
        let { x: nx, y: ny, width: nw, height: nh } = s;
        if (d.handle.includes('r')) nw = Math.max(40, s.width + dx);
        if (d.handle.includes('b')) nh = Math.max(40, s.height + dy);
        if (d.handle.includes('l')) { const move = Math.min(dx, s.width - 40); nw = s.width - move; nx = s.x + move; }
        if (d.handle.includes('t')) { const move = Math.min(dy, s.height - 40); nh = s.height - move; ny = s.y + move; }
        return { ...b, x: nx, y: ny, width: nw, height: nh };
      }));
    }
  }, [canvasSize, primaryId, textBlocks, getSnap]);

  const endPointer = useCallback(() => {
    dragRef.current = { mode: null, startX: 0, startY: 0, handle: null, selectedIds: [], snapshotById: new Map() };
    setGuideLines({ x: null, y: null });
  }, []);

  const nudge = useCallback((dx, dy) => {
    if (!selectedIds.length) return;
    pushHistory(textBlocks);
    setTextBlocks(prev => prev.map(b => selectionSet.has(b.id) && !b.locked ? { ...b, x: clamp(b.x + dx, 0, canvasSize.width - b.width), y: clamp(b.y + dy, 0, canvasSize.height - b.height) } : b));
  }, [selectedIds.length, selectionSet, textBlocks, pushHistory, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    window.addEventListener('mousemove', movePointer); 
    window.addEventListener('mouseup', endPointer);
    window.addEventListener('touchmove', movePointer, { passive: false });
    window.addEventListener('touchend', endPointer);
    if (canvas) canvas.addEventListener('touchstart', startPointer, { passive: false });
    
    return () => { 
      window.removeEventListener('mousemove', movePointer); 
      window.removeEventListener('mouseup', endPointer); 
      window.removeEventListener('touchmove', movePointer);
      window.removeEventListener('touchend', endPointer);
      if (canvas) canvas.removeEventListener('touchstart', startPointer);
    };
  }, [movePointer, endPointer]);

  useEffect(() => {
    const down = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const s = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-s, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(s, 0); }
      if (e.key === 'ArrowUp') { e.preventDefault(); nudge(0, -s); }
      if (e.key === 'ArrowDown') { e.preventDefault(); nudge(0, s); }
      if (['Delete', 'Backspace'].includes(e.key)) { e.preventDefault(); deleteSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveImage(); }
    };
    window.addEventListener('keydown', down); return () => window.removeEventListener('keydown', down);
  }, [nudge, deleteSelected, undo, redo, saveImage]);

  return (
    <div className={`gm5-page theme-${theme}`}>
      <div className="gm5-shell">
        <header className="gm5-header">
          <div className="gm5-header-content">
            <h1>早安圖產生器</h1>
            <p>製作問候圖</p>
          </div>
          <div className="gm5-header-side">
            <ThemeSelector current={theme} onSelect={setTheme} />
            <div className="gm5-header-actions">
              <div className="gm5-user-menu">
                <details><summary className="gm5-btn gm5-btn-soft"><span>{activeUser}</span></summary>
                  <div className="gm5-user-panel p-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase text-gray-500">切換使用者</h3>
                      <div className="flex flex-col gap-2">{userOptions.map(u => <button key={u} onClick={() => handleSwitchUser(u)} className={`gm5-btn ${activeUser === u ? 'gm5-btn-primary' : 'gm5-btn-soft'}`}>{u}</button>)}</div>
                      <div className="pt-4 border-t flex gap-2"><input className="gm5-input flex-1" placeholder="新用戶" value={newUserName} onChange={e => setNewUserName(e.target.value)} /><button className="gm5-btn gm5-btn-primary" onClick={handleCreateUser}>新增</button></div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </header>

        {(!fontsLoaded || !wisdomLoaded) && (
          <div className="gm5-status">{!fontsLoaded ? '載入字型中... ' : ''}{!wisdomLoaded ? '載入語錄中...' : ''}</div>
        )}

        <main className="gm5-main">
          <aside className="gm5-sidebar">
            {/* ... 側邊欄內容保持不變 ... */}
            <div className="gm5-card"><h2>素材工具</h2>
              <label className="gm5-upload"><input type="file" accept="image/*" onChange={handleImageUpload} /><span>上傳底圖</span></label>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button className="gm5-btn gm5-btn-soft" onClick={() => addTextBlock('greeting')}>+ 問候語</button>
                <button className="gm5-btn gm5-btn-soft" onClick={() => addTextBlock('wisdom')}>+ 智慧語</button>
                <button className="gm5-btn gm5-btn-soft" onClick={() => setIsFontManagerOpen(true)}>字型管理</button>
                <button className="gm5-btn gm5-btn-soft" onClick={() => setIsSignatureManagerOpen(true)}>簽名管理</button>
              </div>
            </div>
            <div className="gm5-card"><h2>預設內容</h2>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500">問候語</label>
                <input className="gm5-input" value={greetingText} onChange={e => { setGreetingText(e.target.value); syncSelectedByType('greeting', { text: e.target.value }); }} />
                <label className="text-xs font-bold text-gray-500">智慧語來源</label>
                <div className="flex gap-2">
                  <select className="gm5-input flex-1" value={selectedCategory} onChange={e => setSelectedCategory(parseInt(e.target.value, 10))}>
                    {wisdomCategories.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
                  </select>
                  <button className="gm5-btn gm5-btn-soft" onClick={generateRandomQuote}>隨機</button>
                </div>
              </div>
            </div>
            <div className="gm5-card"><h2>圖層管理</h2>
              <div className="gm5-layers max-h-60 overflow-y-auto pr-2">
                {[...textBlocks].reverse().map(b => (
                  <div key={b.id} className={`gm5-layer ${selectedIds.includes(b.id) ? 'is-selected' : ''}`}>
                    <button className="gm5-layer-main" onClick={() => { setSelectedIds([b.id]); setPrimaryId(b.id); }}>{b.label || (b.text ? b.text.slice(0, 10) : '圖層')}</button>
                    <div className="gm5-layer-actions">
                      <button onClick={() => updateBlockById(b.id, { visible: !b.visible })}>{b.visible !== false ? '👁️' : '🕶️'}</button>
                      <button onClick={() => updateBlockById(b.id, { locked: !b.locked })}>{b.locked ? '🔒' : '🔓'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="gm5-preview">
            <div className="gm5-toolbar">
              <div className="gm5-row space-x-1">
                <button className="gm5-btn gm5-btn-soft p-2 min-w-0" onClick={undo} disabled={historyRef.current.length === 0}><Undo /></button>
                <button className="gm5-btn gm5-btn-soft p-2 min-w-0" onClick={redo} disabled={futureRef.current.length === 0}><Redo /></button>
                <div className="w-[1px] h-6 bg-gray-200 mx-1 hidden sm:block" />
                <button className={`gm5-btn ${showGrid ? 'gm5-btn-primary' : 'gm5-btn-soft'} px-3`} onClick={() => setShowGrid(!showGrid)}>網格</button>
                <button className="gm5-btn gm5-btn-danger px-3" onClick={deleteSelected} disabled={!selectedIds.length}>刪除</button>
                <button className="gm5-btn gm5-btn-primary px-3 ml-auto shadow-sm" onClick={saveImage}><Download /><span>載出</span></button>
              </div>
              <div className="gm5-row mt-2 sm:mt-0">
                <span className="text-xs opacity-60 mr-2">縮放: {zoom}%</span>
                <input type="range" min={minZoom} max={maxZoom} value={zoom} onChange={e => setZoom(parseInt(e.target.value, 10))} className="flex-1 max-w-[120px]" />
              </div>
            </div>
            <div className="gm5-canvas-wrap" ref={wrapRef}>
              <div className="gm5-canvas-stage shadow-2xl" style={{ width: canvasSize.width * zoom / 100, height: canvasSize.height * zoom / 100 }}>
                <canvas 
                  ref={canvasRef} 
                  width={canvasSize.width} 
                  height={canvasSize.height} 
                  style={{ width: '100%', height: '100%' }} 
                  onMouseDown={startPointer}
                  onMouseMove={updateCursor}
                />
                {showGrid && <div className="gm5-grid" />}
              </div>
            </div>

            {primaryId && (
              <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                {textBlocks.find(b => b.id === primaryId)?.type !== 'signature' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="gm5-card"><label className="text-xs font-bold text-gray-400 uppercase">內容</label><textarea className="gm5-input h-24" value={textBlocks.find(b => b.id === primaryId)?.text || ''} onChange={e => updateBlockById(primaryId, { text: e.target.value })} /></div>
                    <div className="gm5-card"><label className="text-xs font-bold text-gray-400 uppercase">字型</label>
                      <select className="gm5-input" value={textBlocks.find(b => b.id === primaryId)?.font || ''} onChange={e => updateBlockById(primaryId, { font: e.target.value })}>{allFonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}</select>
                      <div className="mt-4 flex gap-2">
                        <button className={`gm5-btn flex-1 ${textBlocks.find(b => b.id === primaryId)?.width >= textBlocks.find(b => b.id === primaryId)?.height ? 'gm5-btn-primary' : 'gm5-btn-soft'}`} onClick={() => { const b = textBlocks.find(x => x.id === primaryId); updateBlockById(primaryId, { width: Math.max(b.width, b.height), height: Math.min(b.width, b.height) }); }}>橫向</button>
                        <button className={`gm5-btn flex-1 ${textBlocks.find(b => b.id === primaryId)?.height > textBlocks.find(b => b.id === primaryId)?.width ? 'gm5-btn-primary' : 'gm5-btn-soft'}`} onClick={() => { const b = textBlocks.find(x => x.id === primaryId); updateBlockById(primaryId, { width: Math.min(b.width, b.height), height: Math.max(b.width, b.height) }); }}>直向</button>
                      </div>
                    </div>
                    <div className="gm5-card"><label className="text-xs font-bold text-gray-400 uppercase">色彩</label>
                      <div className="gm5-color-grid">
                        <label><span>填色</span><input type="color" value={textBlocks.find(b => b.id === primaryId)?.fillColor || '#000000'} onChange={e => updateBlockById(primaryId, { fillColor: e.target.value })} /></label>
                        <label><span>描邊</span><input type="color" value={textBlocks.find(b => b.id === primaryId)?.strokeColor || '#ffffff'} onChange={e => updateBlockById(primaryId, { strokeColor: e.target.value })} /></label>
                      </div>
                    </div>
                  </div>
                ) : <div className="gm5-card text-center py-4 text-gray-500">已選中簽名圖層</div>}
              </div>
            )}
          </section>
        </main>
      </div>

      <MobileControls 
        activeTab={activeMobileTab}
        setActiveTab={setActiveMobileTab}
        isExpanded={isMobileDrawerExpanded}
        setIsExpanded={setIsMobileDrawerExpanded}
        onImageUpload={handleImageUpload}
        onAddTextBlock={addTextBlock}
        openFontManager={() => setIsFontManagerOpen(true)}
        openSignatureManager={() => setIsSignatureManagerOpen(true)}
        greetingText={greetingText}
        setGreetingText={setGreetingText}
        syncSelectedByType={syncSelectedByType}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        wisdomCategories={wisdomCategories}
        onGenerateRandomQuote={generateRandomQuote}
        textBlocks={textBlocks}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        setPrimaryId={setPrimaryId}
        moveLayer={moveLayer}
        updateBlockById={updateBlockById}
        allFonts={allFonts}
        primaryId={primaryId}
      />

      <FontManager 
        isOpen={isFontManagerOpen} 
        onClose={() => setIsFontManagerOpen(false)} 
        onFontsChange={setCustomFonts} 
        presetFonts={BUILTIN_FONTS} 
        disabledPresetFonts={disabledPresetFonts} 
        onTogglePresetFont={handleTogglePresetFont} 
      />
      <WisdomManager isOpen={isWisdomManagerOpen} onClose={() => setIsWisdomManagerOpen(false)} onWisdomChange={(newQuotes) => { setWisdomCategories(prev => { const next = [...prev]; const idx = next.findIndex(c => c.name === '7.自訂語錄'); if (idx !== -1) next[idx] = { name: '7.自訂語錄', quotes: newQuotes.length ? newQuotes : ['尚未建立自訂語錄'] }; return next; }); }} />
      <SignatureManager isOpen={isSignatureManagerOpen} onClose={() => setIsSignatureManagerOpen(false)} onSignatureSelect={(sig) => addSignatureBlock(sig)} />
    </div>
  );
};

export default GoodMorningGeneratorV5;
