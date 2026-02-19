import React, { useState, useRef, useEffect, useCallback } from 'react';

const FONT_BASE_PATH = '/fonts/';

// 本地字型列表（從 src/assets/fonts/ 載入）
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

// 智慧語錄檔案配置（對應 Python 原始程式）
const WISDOM_CONFIG = [
  { name: '1.一般問候', file: 'GPT問候語2.txt' },
  { name: '2.隨機智慧語', file: '名言merged.csv' },
  { name: '3.365名言', file: '365句名言2.csv' },
  { name: '4.聖嚴法師', file: '聖嚴法師108自在語-全.csv' },
  { name: '5.證嚴法師', file: '證嚴法師-靜思語400句.csv' },
  { name: '6.週末問候語', file: '週末問候.csv' },
];

const USER_SETTINGS_STORAGE_KEY = 'gm-user-settings-v1';
const ACTIVE_USER_STORAGE_KEY = 'gm-active-user-v1';
const DEFAULT_USER_NAME = '預設用戶';
const DEFAULT_WISDOM_PATH = '/wisdom/';
const DEFAULT_FONT_NAME = LOCAL_FONTS[0].name;

const DEFAULT_USER_SETTINGS = {
  theme: 'light',
  showGrid: true,
  showRuler: true,
  greetingText: '早安',
  wisdomText: '',
  greetingFillColor: '#FFD700',
  greetingStrokeColor: '#FF4500',
  wisdomFillColor: '#87CEEB',
  wisdomStrokeColor: '#4169E1',
  greetingFont: DEFAULT_FONT_NAME,
  wisdomFont: DEFAULT_FONT_NAME,
  selectedCategory: 0,
  wisdomPath: DEFAULT_WISDOM_PATH
};

const normalizeWisdomPath = (path) => {
  const trimmed = (path || '').trim();
  if (!trimmed) return DEFAULT_WISDOM_PATH;
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
};

// SVG 圖標組件
const Download = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>
);

const RefreshCw = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

const Trash2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ImageIcon = ({ className = "" }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
  </svg>
);

const Type = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
  </svg>
);

const GoodMorningGenerator = () => {
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const dragSelectionRef = useRef([]);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [textBlocks, setTextBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [guideLines, setGuideLines] = useState({ vertical: null, horizontal: null });
  const [zoom, setZoom] = useState(70);
  const [theme, setTheme] = useState(DEFAULT_USER_SETTINGS.theme);
  const [showGrid, setShowGrid] = useState(DEFAULT_USER_SETTINGS.showGrid);
  const [showRuler, setShowRuler] = useState(DEFAULT_USER_SETTINGS.showRuler);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 });
  
  const [greetingText, setGreetingText] = useState(DEFAULT_USER_SETTINGS.greetingText);
  const [wisdomText, setWisdomText] = useState(DEFAULT_USER_SETTINGS.wisdomText);
  
  const [greetingFillColor, setGreetingFillColor] = useState(DEFAULT_USER_SETTINGS.greetingFillColor);
  const [greetingStrokeColor, setGreetingStrokeColor] = useState(DEFAULT_USER_SETTINGS.greetingStrokeColor);
  const [wisdomFillColor, setWisdomFillColor] = useState(DEFAULT_USER_SETTINGS.wisdomFillColor);
  const [wisdomStrokeColor, setWisdomStrokeColor] = useState(DEFAULT_USER_SETTINGS.wisdomStrokeColor);
  
  const [greetingFont, setGreetingFont] = useState(DEFAULT_USER_SETTINGS.greetingFont);
  const [wisdomFont, setWisdomFont] = useState(DEFAULT_USER_SETTINGS.wisdomFont);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [wisdomPath, setWisdomPath] = useState(DEFAULT_USER_SETTINGS.wisdomPath);
  const [wisdomPathDraft, setWisdomPathDraft] = useState(DEFAULT_USER_SETTINGS.wisdomPath);
  
  // 智慧語錄資料
  const [wisdomCategories, setWisdomCategories] = useState([]);
  const [wisdomLoaded, setWisdomLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_USER_SETTINGS.selectedCategory);
  const [activeUser, setActiveUser] = useState(DEFAULT_USER_NAME);
  const [userOptions, setUserOptions] = useState([DEFAULT_USER_NAME]);
  const [newUserName, setNewUserName] = useState('');
  const [settingsReady, setSettingsReady] = useState(false);
  
  const SNAP_THRESHOLD = 12;
  const MIN_ZOOM = 35;
  const MAX_ZOOM = 150;
  const MULTI_SELECT_MIN = 2;

  const applyUserSettings = useCallback((settings = {}) => {
    setTheme(settings.theme ?? DEFAULT_USER_SETTINGS.theme);
    setShowGrid(settings.showGrid ?? DEFAULT_USER_SETTINGS.showGrid);
    setShowRuler(settings.showRuler ?? DEFAULT_USER_SETTINGS.showRuler);
    setGreetingText(settings.greetingText ?? DEFAULT_USER_SETTINGS.greetingText);
    setWisdomText(settings.wisdomText ?? DEFAULT_USER_SETTINGS.wisdomText);
    setGreetingFillColor(settings.greetingFillColor ?? DEFAULT_USER_SETTINGS.greetingFillColor);
    setGreetingStrokeColor(settings.greetingStrokeColor ?? DEFAULT_USER_SETTINGS.greetingStrokeColor);
    setWisdomFillColor(settings.wisdomFillColor ?? DEFAULT_USER_SETTINGS.wisdomFillColor);
    setWisdomStrokeColor(settings.wisdomStrokeColor ?? DEFAULT_USER_SETTINGS.wisdomStrokeColor);
    const fontNames = LOCAL_FONTS.map((font) => font.name);
    const nextGreetingFont = settings.greetingFont ?? DEFAULT_USER_SETTINGS.greetingFont;
    const nextWisdomFont = settings.wisdomFont ?? DEFAULT_USER_SETTINGS.wisdomFont;
    setGreetingFont(fontNames.includes(nextGreetingFont) ? nextGreetingFont : DEFAULT_USER_SETTINGS.greetingFont);
    setWisdomFont(fontNames.includes(nextWisdomFont) ? nextWisdomFont : DEFAULT_USER_SETTINGS.wisdomFont);
    setSelectedCategory(settings.selectedCategory ?? DEFAULT_USER_SETTINGS.selectedCategory);
    const normalizedPath = normalizeWisdomPath(settings.wisdomPath ?? DEFAULT_USER_SETTINGS.wisdomPath);
    setWisdomPath(normalizedPath);
    setWisdomPathDraft(normalizedPath);
  }, []);

  const readStoredUsers = useCallback(() => {
    try {
      const stored = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      const users = parsed?.users && typeof parsed.users === 'object' ? parsed.users : {};
      return { users };
    } catch (error) {
      console.error('讀取用戶設定失敗:', error);
      return { users: {} };
    }
  }, []);
  
  // 載入本地字型
  const wrapText = useCallback((ctx, text, maxWidth) => {
    const words = text.split('');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  }, []);

  // 橫式文字繪製（由左到右）
  const drawHorizontalText = useCallback((ctx, block, fontSize) => {
    const padding = 10;
    const maxWidth = block.width - padding * 2;
    const lineHeight = fontSize * 1.3;

    const lines = wrapText(ctx, block.text, maxWidth);

    lines.forEach((line, index) => {
      const x = block.x + padding;
      const y = block.y + padding + index * lineHeight;

      // 描邊
      ctx.strokeStyle = block.strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeText(line, x, y);

      // 填充
      ctx.fillStyle = block.fillColor;
      ctx.fillText(line, x, y);
    });
  }, [wrapText]);

  // 直式文字繪製（由上到下，由右至左）
  const drawVerticalText = useCallback((ctx, block, fontSize) => {
    const spacing = 5;
    const padding = 10;

    // 取得單字寬高
    ctx.font = `${fontSize}px "${block.font}"`;
    const charMetrics = ctx.measureText('測');
    const charWidth = charMetrics.width;
    const charHeight = fontSize;

    // 將文字分成多列（columns）
    const text = block.text;
    const chars = text.split('');

    let x = block.x + block.width - padding - charWidth; // 從右側開始
    let y = block.y + padding; // 從上方開始

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      // 如果超過高度，換到下一列（向左移動）
      if (y + charHeight > block.y + block.height - padding) {
        y = block.y + padding;
        x -= charWidth + spacing;

        // 如果超出左邊界，停止繪製
        if (x < block.x + padding) {
          break;
        }
      }

      // 繪製字元
      // 描邊
      ctx.strokeStyle = block.strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeText(char, x, y);

      // 填充
      ctx.fillStyle = block.fillColor;
      ctx.fillText(char, x, y);

      // 移動到下一個字元位置（向下）
      y += charHeight + spacing;
    }
  }, []);

  useEffect(() => {
  const loadFonts = async () => {
    try {
      const fontPromises = LOCAL_FONTS.map(async (font) => {
        const fontFace = new FontFace(
          font.name,
          `url(${FONT_BASE_PATH}${font.file})`  // ✅ 新路徑
        );
        await fontFace.load();
        document.fonts.add(fontFace);
      });
      
      await Promise.all(fontPromises);
      setFontsLoaded(true);
      console.log('✅ 所有字型載入完成');
    } catch (error) {
      console.error('❌ 字型載入失敗:', error);
      setFontsLoaded(true);
    }
  };
  
  loadFonts();
}, []);

  useEffect(() => {
    const { users } = readStoredUsers();
    const allUsers = Object.keys(users).length > 0
      ? users
      : { [DEFAULT_USER_NAME]: { ...DEFAULT_USER_SETTINGS } };
    const storedActiveUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    const initialUser = (storedActiveUser && allUsers[storedActiveUser])
      ? storedActiveUser
      : Object.keys(allUsers)[0];

    setUserOptions(Object.keys(allUsers));
    setActiveUser(initialUser);
    applyUserSettings(allUsers[initialUser]);
    setSettingsReady(true);
  }, [applyUserSettings, readStoredUsers]);

  useEffect(() => {
    if (!settingsReady) return;
    const nextUsers = { ...readStoredUsers().users };
    nextUsers[activeUser] = {
      theme,
      showGrid,
      showRuler,
      greetingText,
      wisdomText,
      greetingFillColor,
      greetingStrokeColor,
      wisdomFillColor,
      wisdomStrokeColor,
      greetingFont,
      wisdomFont,
      selectedCategory,
      wisdomPath
    };
    try {
      localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify({ users: nextUsers }));
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, activeUser);
    } catch (error) {
      console.error('儲存用戶設定失敗:', error);
    }
  }, [
    settingsReady,
    readStoredUsers,
    activeUser,
    theme,
    showGrid,
    showRuler,
    greetingText,
    wisdomText,
    greetingFillColor,
    greetingStrokeColor,
    wisdomFillColor,
    wisdomStrokeColor,
    greetingFont,
    wisdomFont,
    selectedCategory,
    wisdomPath
  ]);

  const handleSwitchUser = (userName) => {
    const { users } = readStoredUsers();
    const nextSettings = users[userName] || { ...DEFAULT_USER_SETTINGS };
    setActiveUser(userName);
    setSelectedBlock(null);
    setSelectedBlocks([]);
    applyUserSettings(nextSettings);
  };

  const handleCreateUser = () => {
    const candidate = newUserName.trim();
    if (!candidate) return;

    const { users } = readStoredUsers();
    if (!users[candidate]) {
      users[candidate] = { ...DEFAULT_USER_SETTINGS };
      try {
        localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify({ users }));
      } catch (error) {
        console.error('新增用戶失敗:', error);
      }
      setUserOptions(Object.keys(users));
    }
    setNewUserName('');
    handleSwitchUser(candidate);
  };

  const parseWisdomContent = (fileName, text) => {
    if (fileName.endsWith('.txt')) {
      return text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    }
    if (fileName.endsWith('.csv')) {
      const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
      const firstLine = lines[0] || '';
      const startIndex = (firstLine.includes('名言') ||
        firstLine.includes('內容') ||
        firstLine.includes('語錄')) ? 1 : 0;
      return lines
        .slice(startIndex)
        .map((line) => {
          const parts = line.split(',');
          return parts.length > 1 ? parts[0].replace(/^["']|["']$/g, '') : line;
        })
        .filter((quote) => quote.length > 0);
    }
    return [];
  };

  // 載入智慧語錄檔案
  useEffect(() => {
  const loadWisdomFiles = async () => {
    setWisdomLoaded(false);
    try {
      const normalizedPath = normalizeWisdomPath(wisdomPath);
      const loadedCategories = await Promise.all(
        WISDOM_CONFIG.map(async (config) => {
          try {
            const response = await fetch(`${normalizedPath}${config.file}`);
            const text = await response.text();
            
            const quotes = parseWisdomContent(config.file, text);
            
            console.log(`✅ 載入 ${config.name}: ${quotes.length} 條語錄`);
            
            return {
              name: config.name,
              quotes: quotes.length > 0 ? quotes : ['暫無語錄']
            };
          } catch (error) {
            console.error(`❌ 載入 ${config.name} 失敗:`, error);
            return {
              name: config.name,
              quotes: ['載入失敗，請檢查檔案路徑']
            };
          }
        })
      );
      
      setWisdomCategories(loadedCategories);
      setWisdomLoaded(true);
      
      setSelectedCategory((prev) => {
        const maxIndex = Math.max(0, loadedCategories.length - 1);
        return Math.min(Math.max(prev, 0), maxIndex);
      });
      setWisdomText((prev) => prev || loadedCategories[0]?.quotes[0] || '');
      
      console.log('✅ 所有智慧語錄載入完成');
    } catch (error) {
      console.error('❌ 智慧語錄載入失敗:', error);
      setWisdomCategories([
        { name: '備用問候', quotes: ['祝你有美好的一天！'] }
      ]);
      setWisdomLoaded(true);
    }
  };
  
  loadWisdomFiles();
}, [wisdomPath]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fitCanvasToViewport = () => {
      const wrap = canvasWrapRef.current;
      if (!wrap) return;

      const availableWidth = Math.max(wrap.clientWidth - 24, 320);
      const availableHeight = Math.max(window.innerHeight - 320, 420);
      const scale = Math.min(availableWidth / canvasSize.width, availableHeight / canvasSize.height);
      const fittedZoom = Math.round(scale * 100);
      const safeZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fittedZoom));
      setZoom(safeZoom);
    };

    fitCanvasToViewport();
    window.addEventListener('resize', fitCanvasToViewport);
    return () => window.removeEventListener('resize', fitCanvasToViewport);
  }, [canvasSize.width, canvasSize.height]);
 
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setCanvasSize({
            width: Math.max(1, img.width || 512),
            height: Math.max(1, img.height || 512)
          });
          setBackgroundImage(img);
          setTextBlocks([]);
          setSelectedBlock(null);
          setSelectedBlocks([]);
          generateRandomQuote();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  const generateRandomQuote = () => {
    if (wisdomCategories.length === 0) return;
    
    const currentCategory = wisdomCategories[selectedCategory];
    if (!currentCategory || !currentCategory.quotes || currentCategory.quotes.length === 0) return;
    
    const quotes = currentCategory.quotes;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setWisdomText(randomQuote);
  };
  
  const addTextBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type: type,
      text: type === 'greeting' ? greetingText : wisdomText,
      x: Math.random() * (canvasSize.width / 2) + canvasSize.width / 4,
      y: Math.random() * (canvasSize.height / 2) + canvasSize.height / 4,
      width: Math.random() * 200 + 200,
      height: Math.random() * 150 + 150,
      fontSize: 40,
      font: type === 'greeting' ? greetingFont : wisdomFont,
      fillColor: type === 'greeting' ? greetingFillColor : wisdomFillColor,
      strokeColor: type === 'greeting' ? greetingStrokeColor : wisdomStrokeColor,
      rotation: 0
    };
    setTextBlocks((prev) => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
    setSelectedBlocks([newBlock.id]);
  };
  
  const calculateFontSize = (text, width, height, fontFamily) => {
    const maxArea = (width * height) / 1.5;
    let fontSize = 10;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    while (true) {
      fontSize += 1;
      ctx.font = `${fontSize}px "${fontFamily}"`;
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.2;
      
      if (textWidth * textHeight > maxArea || fontSize > 100) {
        break;
      }
    }
    return Math.max(fontSize - 5, 10);
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontsLoaded) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvasSize.width, canvasSize.height);
    } else {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }
    
    textBlocks.forEach((block) => {
      ctx.save();
      
      if (selectedBlocks.includes(block.id)) {
        const isPrimary = selectedBlock === block.id;
        ctx.strokeStyle = isPrimary ? '#00ff88' : '#f97316';
        ctx.lineWidth = isPrimary ? 3 : 2;
        if (!isPrimary) ctx.setLineDash([6, 6]);
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        ctx.setLineDash([]);
        if (isPrimary) {
          ctx.fillStyle = '#00ff88';
          ctx.fillRect(block.x + block.width - 10, block.y + block.height - 10, 10, 10);
        }
      }
      
      const fontSize = calculateFontSize(block.text, block.width, block.height, block.font);
      ctx.font = `${fontSize}px "${block.font}"`;
      ctx.textBaseline = 'top';
      
      // 判斷方向：寬 > 高為橫式，高 > 寬為直式
      const isVertical = block.height > block.width;
      
      if (isVertical) {
        // 直式輸出：由上到下，由右至左
        drawVerticalText(ctx, block, fontSize);
      } else {
        // 橫式輸出：由左到右
        drawHorizontalText(ctx, block, fontSize);
      }
      
      ctx.restore();
    });

    if (guideLines.vertical !== null || guideLines.horizontal !== null) {
      ctx.save();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      if (guideLines.vertical !== null) {
        ctx.beginPath();
        ctx.moveTo(guideLines.vertical, 0);
        ctx.lineTo(guideLines.vertical, canvasSize.height);
        ctx.stroke();
      }
      if (guideLines.horizontal !== null) {
        ctx.beginPath();
        ctx.moveTo(0, guideLines.horizontal);
        ctx.lineTo(canvasSize.width, guideLines.horizontal);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [backgroundImage, textBlocks, selectedBlock, selectedBlocks, fontsLoaded, guideLines, canvasSize.width, canvasSize.height, drawHorizontalText, drawVerticalText]);

  const getClosestSnap = (movingPoints, targets) => {
    let best = null;
    movingPoints.forEach((point) => {
      targets.forEach((target) => {
        const distance = Math.abs(point.value - target);
        if (distance <= SNAP_THRESHOLD && (!best || distance < best.distance)) {
          best = { target, edge: point.edge, distance };
        }
      });
    });
    return best;
  };

  const getSelectionBounds = (ids, blocks) => {
    const selected = blocks.filter((block) => ids.includes(block.id));
    if (selected.length === 0) return null;
    const left = Math.min(...selected.map((block) => block.x));
    const top = Math.min(...selected.map((block) => block.y));
    const right = Math.max(...selected.map((block) => block.x + block.width));
    const bottom = Math.max(...selected.map((block) => block.y + block.height));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };
  
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasSize.height / rect.height);
    const isMultiSelectKey = e.shiftKey || e.metaKey || e.ctrlKey;
    
    for (let i = textBlocks.length - 1; i >= 0; i--) {
      const block = textBlocks[i];
      
      if (
        selectedBlocks.length === 1 &&
        selectedBlock === block.id &&
        x >= block.x + block.width - 15 &&
        x <= block.x + block.width + 5 &&
        y >= block.y + block.height - 15 &&
        y <= block.y + block.height + 5
      ) {
        setIsResizing(true);
        setSelectedBlock(block.id);
        setSelectedBlocks([block.id]);
        setDragStart({ x, y });
        dragSelectionRef.current = [];
        setGuideLines({ vertical: null, horizontal: null });
        return;
      }
      
      if (
        x >= block.x &&
        x <= block.x + block.width &&
        y >= block.y &&
        y <= block.y + block.height
      ) {
        if (isMultiSelectKey) {
          const next = selectedBlocks.includes(block.id)
            ? selectedBlocks.filter((id) => id !== block.id)
            : [...selectedBlocks, block.id];
          setSelectedBlocks(next);
          setSelectedBlock(next.length > 0 ? next[next.length - 1] : null);
          return;
        }

        const dragIds = selectedBlocks.includes(block.id) ? selectedBlocks : [block.id];
        setIsDragging(true);
        setSelectedBlock(block.id);
        setSelectedBlocks(dragIds);
        setDragStart({ x, y });
        dragSelectionRef.current = dragIds.map((id) => {
          const dragBlock = textBlocks.find((item) => item.id === id);
          return {
            id,
            x: dragBlock.x,
            y: dragBlock.y,
            width: dragBlock.width,
            height: dragBlock.height
          };
        });
        setGuideLines({ vertical: null, horizontal: null });
        return;
      }
    }
    
    setSelectedBlock(null);
    setSelectedBlocks([]);
    dragSelectionRef.current = [];
    setGuideLines({ vertical: null, horizontal: null });
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging && !isResizing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasSize.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasSize.height / rect.height);

    if (isDragging) {
      const snapshots = dragSelectionRef.current;
      if (snapshots.length === 0) return;

      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      const snapshotById = new Map(snapshots.map((item) => [item.id, item]));
      const draggedIds = snapshots.map((item) => item.id);
      const primaryId = selectedBlock && snapshotById.has(selectedBlock) ? selectedBlock : draggedIds[0];
      const primary = snapshotById.get(primaryId);

      let offsetX = 0;
      let offsetY = 0;
      let guideVertical = null;
      let guideHorizontal = null;

      const proposedPrimaryX = primary.x + deltaX;
      const proposedPrimaryY = primary.y + deltaY;
      const otherBlocks = textBlocks.filter((item) => !draggedIds.includes(item.id));
      const verticalTargets = [0, canvasSize.width / 2, canvasSize.width];
      const horizontalTargets = [0, canvasSize.height / 2, canvasSize.height];

      otherBlocks.forEach((item) => {
        verticalTargets.push(item.x, item.x + item.width / 2, item.x + item.width);
        horizontalTargets.push(item.y, item.y + item.height / 2, item.y + item.height);
      });

      const movingXPoints = [
        { edge: 'left', value: proposedPrimaryX },
        { edge: 'center', value: proposedPrimaryX + primary.width / 2 },
        { edge: 'right', value: proposedPrimaryX + primary.width }
      ];
      const movingYPoints = [
        { edge: 'top', value: proposedPrimaryY },
        { edge: 'middle', value: proposedPrimaryY + primary.height / 2 },
        { edge: 'bottom', value: proposedPrimaryY + primary.height }
      ];

      const snapX = getClosestSnap(movingXPoints, verticalTargets);
      if (snapX) {
        if (snapX.edge === 'left') offsetX = snapX.target - proposedPrimaryX;
        if (snapX.edge === 'center') offsetX = snapX.target - (proposedPrimaryX + primary.width / 2);
        if (snapX.edge === 'right') offsetX = snapX.target - (proposedPrimaryX + primary.width);
        guideVertical = snapX.target;
      }

      const snapY = getClosestSnap(movingYPoints, horizontalTargets);
      if (snapY) {
        if (snapY.edge === 'top') offsetY = snapY.target - proposedPrimaryY;
        if (snapY.edge === 'middle') offsetY = snapY.target - (proposedPrimaryY + primary.height / 2);
        if (snapY.edge === 'bottom') offsetY = snapY.target - (proposedPrimaryY + primary.height);
        guideHorizontal = snapY.target;
      }

      let boundedDeltaX = deltaX + offsetX;
      let boundedDeltaY = deltaY + offsetY;
      const draggedBounds = getSelectionBounds(draggedIds, snapshots);
      if (draggedBounds) {
        if (draggedBounds.left + boundedDeltaX < 0) boundedDeltaX = -draggedBounds.left;
        if (draggedBounds.right + boundedDeltaX > canvasSize.width) boundedDeltaX = canvasSize.width - draggedBounds.right;
        if (draggedBounds.top + boundedDeltaY < 0) boundedDeltaY = -draggedBounds.top;
        if (draggedBounds.bottom + boundedDeltaY > canvasSize.height) boundedDeltaY = canvasSize.height - draggedBounds.bottom;
      }

      setGuideLines({ vertical: guideVertical, horizontal: guideHorizontal });
      setTextBlocks((prev) =>
        prev.map((block) => {
          const source = snapshotById.get(block.id);
          if (!source) return block;
          return { ...block, x: source.x + boundedDeltaX, y: source.y + boundedDeltaY };
        })
      );
      return;
    }

    if (isResizing && selectedBlock) {
      setTextBlocks((prev) =>
        prev.map((block) => {
          if (block.id !== selectedBlock) return block;
          const newWidth = Math.max(50, x - block.x);
          const newHeight = Math.max(50, y - block.y);
          return {
            ...block,
            width: Math.min(newWidth, canvasSize.width - block.x),
            height: Math.min(newHeight, canvasSize.height - block.y)
          };
        })
      );
      setGuideLines({ vertical: null, horizontal: null });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    dragSelectionRef.current = [];
    setGuideLines({ vertical: null, horizontal: null });
  };
  
  const clearSelection = useCallback(() => {
    setSelectedBlock(null);
    setSelectedBlocks([]);
  }, []);

  const deleteSelectedBlock = useCallback(() => {
    if (selectedBlocks.length === 0) return;
    setTextBlocks((prev) => prev.filter((block) => !selectedBlocks.includes(block.id)));
    clearSelection();
  }, [selectedBlocks, clearSelection]);
  
  const updateSelectedBlockText = () => {
    if (selectedBlocks.length === 0) return;
    setTextBlocks((prev) =>
      prev.map((block) => {
        if (!selectedBlocks.includes(block.id)) return block;
        return {
          ...block,
          text: block.type === 'greeting' ? greetingText : wisdomText,
          fillColor: block.type === 'greeting' ? greetingFillColor : wisdomFillColor,
          strokeColor: block.type === 'greeting' ? greetingStrokeColor : wisdomStrokeColor,
          font: block.type === 'greeting' ? greetingFont : wisdomFont
        };
      })
    );
  };
  
  const saveImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `good-morning-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const adjustZoom = (delta) => {
    setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  };

  const resetZoom = () => setZoom(100);

  const centerSelectedBlock = () => {
    if (selectedBlocks.length === 0) return;
    setTextBlocks((prev) =>
      prev.map((block) => {
        if (!selectedBlocks.includes(block.id)) return block;
        return {
          ...block,
          x: (canvasSize.width - block.width) / 2,
          y: (canvasSize.height - block.height) / 2
        };
      })
    );
  };

  const alignSelected = (direction) => {
    if (selectedBlocks.length < MULTI_SELECT_MIN) return;
    const selectedSet = new Set(selectedBlocks);
    const selected = textBlocks.filter((block) => selectedSet.has(block.id));
    const bounds = getSelectionBounds(selectedBlocks, selected);
    if (!bounds) return;

    setTextBlocks((prev) =>
      prev.map((block) => {
        if (!selectedSet.has(block.id)) return block;
        if (direction === 'left') return { ...block, x: bounds.left };
        if (direction === 'hcenter') return { ...block, x: bounds.left + (bounds.width - block.width) / 2 };
        if (direction === 'right') return { ...block, x: bounds.right - block.width };
        if (direction === 'top') return { ...block, y: bounds.top };
        if (direction === 'vcenter') return { ...block, y: bounds.top + (bounds.height - block.height) / 2 };
        if (direction === 'bottom') return { ...block, y: bounds.bottom - block.height };
        return block;
      })
    );
  };

  const distributeSelected = (axis) => {
    if (selectedBlocks.length < 3) return;
    const selectedSet = new Set(selectedBlocks);
    const selected = textBlocks.filter((block) => selectedSet.has(block.id));
    const sorted = [...selected].sort((a, b) =>
      axis === 'horizontal'
        ? a.x + a.width / 2 - (b.x + b.width / 2)
        : a.y + a.height / 2 - (b.y + b.height / 2)
    );

    const firstCenter = axis === 'horizontal'
      ? sorted[0].x + sorted[0].width / 2
      : sorted[0].y + sorted[0].height / 2;
    const lastCenter = axis === 'horizontal'
      ? sorted[sorted.length - 1].x + sorted[sorted.length - 1].width / 2
      : sorted[sorted.length - 1].y + sorted[sorted.length - 1].height / 2;
    const step = (lastCenter - firstCenter) / (sorted.length - 1);

    const nextPos = new Map();
    sorted.forEach((block, index) => {
      const targetCenter = firstCenter + step * index;
      if (axis === 'horizontal') {
        nextPos.set(block.id, { x: targetCenter - block.width / 2 });
      } else {
        nextPos.set(block.id, { y: targetCenter - block.height / 2 });
      }
    });

    setTextBlocks((prev) =>
      prev.map((block) => {
        const next = nextPos.get(block.id);
        if (!next) return block;
        return {
          ...block,
          x: next.x ?? block.x,
          y: next.y ?? block.y
        };
      })
    );
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const nudgeSelected = useCallback((dx, dy) => {
    if (selectedBlocks.length === 0) return;
    setTextBlocks((prev) =>
      prev.map((block) => {
        if (!selectedBlocks.includes(block.id)) return block;
        return {
          ...block,
          x: Math.max(0, Math.min(canvasSize.width - block.width, block.x + dx)),
          y: Math.max(0, Math.min(canvasSize.height - block.height, block.y + dy))
        };
      })
    );
  }, [selectedBlocks, canvasSize.width, canvasSize.height]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const isEditable = target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isEditable) return;

      const isMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isMod && key === 's') {
        e.preventDefault();
        saveImage();
        return;
      }
      if (isMod && (key === '=' || key === '+')) {
        e.preventDefault();
        adjustZoom(10);
        return;
      }
      if (isMod && key === '-') {
        e.preventDefault();
        adjustZoom(-10);
        return;
      }
      if (isMod && key === '0') {
        e.preventDefault();
        resetZoom();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedBlock();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelected(e.shiftKey ? -10 : -1, 0);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelected(e.shiftKey ? 10 : 1, 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelected(0, e.shiftKey ? -10 : -1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelected(0, e.shiftKey ? 10 : 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelectedBlock, nudgeSelected]);

  const selectedBlockData = textBlocks.find((block) => block.id === selectedBlock);
  const canvasDisplayWidth = Math.round((canvasSize.width * zoom) / 100);
  const canvasDisplayHeight = Math.round((canvasSize.height * zoom) / 100);
  
  return (
    <div className="gm-page">
      <div className="gm-shell">
        <header className="gm-header">
          <div className="gm-header-row">
            <div>
              <h1 className="gm-title">早安圖產生器 Good Morning Generator</h1>
              <p className="gm-subtitle">上傳背景圖、挑選語錄、編排文字，快速匯出高解析早安圖</p>
            </div>
            <div className="gm-header-actions">
              <button onClick={toggleTheme} className="gm-btn gm-btn-secondary gm-theme-btn">
                {theme === 'light' ? '夜間模式' : '日間模式'}
              </button>
              <details className="gm-menu">
                <summary className="gm-btn gm-btn-secondary">用戶設定</summary>
                <div className="gm-menu-panel">
                  <select
                    value={activeUser}
                    onChange={(e) => handleSwitchUser(e.target.value)}
                    className="gm-select"
                  >
                    {userOptions.map((user) => (
                      <option key={user} value={user}>
                        {user}
                      </option>
                    ))}
                  </select>
                  <div className="gm-grid-2">
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="gm-input"
                      placeholder="新增用戶名稱"
                    />
                    <button onClick={handleCreateUser} className="gm-btn gm-btn-secondary">
                      新增/切換
                    </button>
                  </div>
                  <input
                    type="text"
                    value={wisdomPathDraft}
                    onChange={(e) => setWisdomPathDraft(e.target.value)}
                    className="gm-input"
                    placeholder="/wisdom/"
                  />
                  <button
                    onClick={() => setWisdomPath(normalizeWisdomPath(wisdomPathDraft))}
                    className="gm-btn gm-btn-secondary"
                  >
                    套用智慧語路徑
                  </button>
                  <p className="gm-muted">智慧語路徑：{wisdomPath}</p>
                  <p className="gm-muted">每位用戶會記住字型、顏色與智慧語路徑設定。</p>
                </div>
              </details>
            </div>
          </div>
        </header>

        {(!fontsLoaded || !wisdomLoaded) && (
          <div className="gm-status">
            {!fontsLoaded && '載入字型中... '}
            {!wisdomLoaded && '載入智慧語錄中...'}
          </div>
        )}

        <div className="gm-main">
          <aside className="gm-sidebar">
            <div className="gm-card">
              <h2 className="gm-card-title">
                <ImageIcon className="w-4 h-4" />
                背景圖片
              </h2>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="gm-upload">點擊上傳背景圖片</div>
              </label>
            </div>

            <div className="gm-card">
              <h2 className="gm-card-title">
                <Type />
                文字區塊
              </h2>
              <div className="gm-grid-2">
                <button
                  onClick={() => addTextBlock('greeting')}
                  className="gm-btn gm-btn-primary"
                >
                  <Plus />
                  新增問候語
                </button>
                <button
                  onClick={() => addTextBlock('wisdom')}
                  className="gm-btn gm-btn-secondary"
                >
                  <Plus />
                  新增智慧語
                </button>
              </div>
            </div>

            <div className="gm-card">
              <h3 className="gm-section-title">問候語設定</h3>
              <div className="gm-stack-8">
                <input
                  type="text"
                  value={greetingText}
                  onChange={(e) => setGreetingText(e.target.value)}
                  className="gm-input"
                  placeholder="輸入問候語"
                />
                <select
                  value={greetingFont}
                  onChange={(e) => setGreetingFont(e.target.value)}
                  className="gm-select"
                  style={{ fontFamily: greetingFont }}
                >
                  {LOCAL_FONTS.map((font) => (
                    <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                      {font.name}
                    </option>
                  ))}
                </select>
                <div className="gm-grid-2">
                  <div>
                    <label className="gm-color-label">填充顏色</label>
                    <input
                      type="color"
                      value={greetingFillColor}
                      onChange={(e) => setGreetingFillColor(e.target.value)}
                      className="gm-color"
                    />
                  </div>
                  <div>
                    <label className="gm-color-label">描邊顏色</label>
                    <input
                      type="color"
                      value={greetingStrokeColor}
                      onChange={(e) => setGreetingStrokeColor(e.target.value)}
                      className="gm-color"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="gm-card">
              <h3 className="gm-section-title">智慧語設定</h3>
              <div className="gm-stack-8">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(parseInt(e.target.value, 10));
                    setTimeout(generateRandomQuote, 0);
                  }}
                  className="gm-select"
                  disabled={!wisdomLoaded}
                >
                  {wisdomCategories.map((cat, idx) => (
                    <option key={idx} value={idx}>
                      {cat.name} ({cat.quotes?.length || 0} 條)
                    </option>
                  ))}
                </select>
                <button
                  onClick={generateRandomQuote}
                  disabled={!wisdomLoaded}
                  className="gm-btn gm-btn-secondary"
                >
                  <RefreshCw />
                  隨機換句
                </button>
                <textarea
                  value={wisdomText}
                  onChange={(e) => setWisdomText(e.target.value)}
                  className="gm-textarea"
                  placeholder="智慧語錄"
                />
                <select
                  value={wisdomFont}
                  onChange={(e) => setWisdomFont(e.target.value)}
                  className="gm-select"
                  style={{ fontFamily: wisdomFont }}
                >
                  {LOCAL_FONTS.map((font) => (
                    <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                      {font.name}
                    </option>
                  ))}
                </select>
                <div className="gm-grid-2">
                  <div>
                    <label className="gm-color-label">填充顏色</label>
                    <input
                      type="color"
                      value={wisdomFillColor}
                      onChange={(e) => setWisdomFillColor(e.target.value)}
                      className="gm-color"
                    />
                  </div>
                  <div>
                    <label className="gm-color-label">描邊顏色</label>
                    <input
                      type="color"
                      value={wisdomStrokeColor}
                      onChange={(e) => setWisdomStrokeColor(e.target.value)}
                      className="gm-color"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="gm-card">
              <h3 className="gm-section-title">操作</h3>
              <div className="gm-stack-8">
                <button
                  onClick={updateSelectedBlockText}
                  disabled={selectedBlocks.length === 0}
                  className="gm-btn gm-btn-secondary"
                >
                  更新選中區塊
                </button>
                <button
                  onClick={deleteSelectedBlock}
                  disabled={selectedBlocks.length === 0}
                  className="gm-btn gm-btn-danger"
                >
                  <Trash2 />
                  刪除選中區塊 ({selectedBlocks.length})
                </button>
                <button
                  onClick={saveImage}
                  className="gm-btn gm-btn-success"
                >
                  <Download />
                  儲存圖片
                </button>
              </div>
              <p className="gm-muted">
                快捷鍵：`Ctrl/Cmd+S` 匯出，方向鍵微調，`Shift+方向鍵` 快速微調，`Delete` 刪除
              </p>
            </div>
          </aside>

          <section className="gm-preview">
            <div className="gm-preview-head">
              <div>
                <h2 className="gm-preview-title">預覽畫布</h2>
                <p className="gm-preview-meta">
                  畫布尺寸 {canvasSize.width} x {canvasSize.height}
                </p>
              </div>
              <p className="gm-preview-meta">
                {selectedBlocks.length > 1
                  ? `多選中：${selectedBlocks.length} 個區塊`
                  : selectedBlockData
                    ? `已選取：${selectedBlockData.type === 'greeting' ? '問候語區塊' : '智慧語區塊'}`
                    : '未選取任何區塊'}
              </p>
            </div>

            <div className="gm-toolbar">
              <div className="gm-toolbar-group">
                <button onClick={() => adjustZoom(-10)} className="gm-btn gm-btn-secondary gm-mini-btn">
                  -
                </button>
                <button onClick={resetZoom} className="gm-btn gm-btn-secondary gm-mini-btn">
                  {zoom}%
                </button>
                <button onClick={() => adjustZoom(10)} className="gm-btn gm-btn-secondary gm-mini-btn">
                  +
                </button>
                <button
                  onClick={() => setShowGrid((prev) => !prev)}
                  className={`gm-btn gm-mini-btn ${showGrid ? 'gm-btn-primary' : 'gm-btn-secondary'}`}
                >
                  網格
                </button>
                <button
                  onClick={() => setShowRuler((prev) => !prev)}
                  className={`gm-btn gm-mini-btn ${showRuler ? 'gm-btn-primary' : 'gm-btn-secondary'}`}
                >
                  尺規
                </button>
              </div>
              <div className="gm-toolbar-group">
                <button
                  onClick={centerSelectedBlock}
                  disabled={selectedBlocks.length === 0}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  置中選取
                </button>
                <button onClick={saveImage} className="gm-btn gm-btn-primary gm-mini-btn">
                  <Download />
                  快速匯出
                </button>
              </div>
              <div className="gm-toolbar-group">
                <button
                  onClick={() => alignSelected('left')}
                  disabled={selectedBlocks.length < MULTI_SELECT_MIN}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  左對齊
                </button>
                <button
                  onClick={() => alignSelected('hcenter')}
                  disabled={selectedBlocks.length < MULTI_SELECT_MIN}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  水平置中
                </button>
                <button
                  onClick={() => alignSelected('right')}
                  disabled={selectedBlocks.length < MULTI_SELECT_MIN}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  右對齊
                </button>
                <button
                  onClick={() => distributeSelected('horizontal')}
                  disabled={selectedBlocks.length < 3}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  水平分佈
                </button>
              </div>
              <div className="gm-toolbar-group">
                <button
                  onClick={() => alignSelected('top')}
                  disabled={selectedBlocks.length < MULTI_SELECT_MIN}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  上對齊
                </button>
                <button
                  onClick={() => alignSelected('vcenter')}
                  disabled={selectedBlocks.length < MULTI_SELECT_MIN}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  垂直置中
                </button>
                <button
                  onClick={() => alignSelected('bottom')}
                  disabled={selectedBlocks.length < MULTI_SELECT_MIN}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  下對齊
                </button>
                <button
                  onClick={() => distributeSelected('vertical')}
                  disabled={selectedBlocks.length < 3}
                  className="gm-btn gm-btn-secondary gm-mini-btn"
                >
                  垂直分佈
                </button>
              </div>
            </div>

            <div className="gm-canvas-wrap" ref={canvasWrapRef}>
              <div
                className="gm-canvas-stage"
                style={{ width: `${canvasDisplayWidth}px`, height: `${canvasDisplayHeight}px` }}
              >
                {showGrid && <div className="gm-grid-overlay" />}
                {showRuler && (
                  <>
                    <div className="gm-ruler gm-ruler-top" />
                    <div className="gm-ruler gm-ruler-left" />
                  </>
                )}
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="gm-canvas cursor-move"
                  style={{
                    width: `${canvasDisplayWidth}px`,
                    height: `${canvasDisplayHeight}px`
                  }}
                />
              </div>
            </div>

            <p className="gm-footer-tip">
              操作提示：`Shift/Ctrl/Cmd + 點擊` 可多選，拖曳時會吸附中心線，工具列可做對齊與分佈
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GoodMorningGenerator;
