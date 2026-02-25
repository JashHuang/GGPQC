export const BACKGROUND_THEMES = {
  sunrise: '日出',
  flower: '花卉',
  mountain: '山景',
  festival: '節慶',
};

export const BLESSING_LENGTHS = {
  short: '短',
  medium: '中',
  long: '長',
};

const LIVE_THEME_QUERIES = {
  sunrise: ['sunrise', 'dawn landscape', 'morning sky', 'golden hour', 'sunlight clouds'],
  flower: ['flower garden', 'spring flowers', 'bloom', 'wildflowers', 'botanical'],
  mountain: ['mountain landscape', 'mountain sunrise', 'nature valley', 'forest mountain', 'misty peak'],
  festival: ['festival lights', 'celebration', 'lantern festival', 'confetti lights', 'holiday decoration'],
  general: ['morning nature', 'sunrise', 'peaceful landscape', 'serene scenery', 'nature background'],
};

const LIVE_QUERY_FLAVORS = [
  'high quality',
  'cinematic',
  'soft light',
  'peaceful',
  'wallpaper',
];

const queryToTags = (query) =>
  query
    .toLowerCase()
    .replace(/[^a-z0-9\s,]/g, ' ')
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(',');

const buildLiveUrlCandidates = (theme, query, sig) => {
  const tags = queryToTags(query) || 'nature,morning';
  const encodedSeed = encodeURIComponent(`${query}-${sig}`);
  return [
    {
      source: 'picsum',
      url: `https://picsum.photos/seed/gm6-${encodedSeed}/1080/1080`,
    },
    {
      source: 'picsum-random',
      url: `https://picsum.photos/1080/1080?random=${sig}`,
    },
    {
      source: 'loremflickr',
      url: `https://loremflickr.com/1080/1080/${tags}?lock=${sig}`,
    },
  ];
};

const buildLiveBackground = (theme, imageUrls, index, requestSeed) => ({
  id: `live-${theme}-${requestSeed}-${index}`,
  imageUrl: imageUrls[0]?.url || '',
  fallbackUrls: imageUrls.slice(1).map(item => item.url),
  imageCandidates: imageUrls,
  theme,
  textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
  preferredTextColor: theme === 'flower' ? 'dark' : 'light',
});

const getRandomSeed = () => Math.floor(Math.random() * 1000000);

const normalizeSeed = (requestSeed) => {
  if (Number.isFinite(requestSeed)) return Math.floor(requestSeed);
  return Date.now() + getRandomSeed();
};

const buildQueryVariants = (theme) => {
  const queries = LIVE_THEME_QUERIES[theme] || LIVE_THEME_QUERIES.general;
  const variants = [];

  queries.forEach((query, index) => {
    const flavor = LIVE_QUERY_FLAVORS[index % LIVE_QUERY_FLAVORS.length];
    variants.push(query);
    variants.push(`${query}, ${flavor}`);
  });

  return variants;
};

const DEFAULT_BACKGROUNDS = [
  // 日出/晨曦
  {
    id: 'bg-sunrise-001',
    imageUrl: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-sunrise-002',
    imageUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-sunrise-003',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-sunrise-004',
    imageUrl: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  // 山景
  {
    id: 'bg-mountain-001',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80',
    theme: 'mountain',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-mountain-002',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80',
    theme: 'mountain',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-mountain-003',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&q=80',
    theme: 'mountain',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-mountain-004',
    imageUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1080&q=80',
    theme: 'mountain',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-mountain-005',
    imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1080&q=80',
    theme: 'mountain',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  // 花卉
  {
    id: 'bg-flower-001',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1080&q=80',
    theme: 'flower',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'dark',
  },
  {
    id: 'bg-flower-002',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1080&q=80',
    theme: 'flower',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'dark',
  },
  {
    id: 'bg-flower-003',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&q=80',
    theme: 'flower',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'dark',
  },
  {
    id: 'bg-flower-004',
    imageUrl: 'https://images.unsplash.com/photo-1462275646964-a0e3571f4f83?w=1080&q=80',
    theme: 'flower',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'dark',
  },
  // 節慶
  {
    id: 'bg-festival-001',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1080&q=80',
    theme: 'festival',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-festival-002',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1080&q=80',
    theme: 'festival',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-festival-003',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1080&q=80',
    theme: 'festival',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  // 天空/雲景
  {
    id: 'bg-sky-001',
    imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-sky-002',
    imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  // 自然/風景
  {
    id: 'bg-nature-001',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-nature-002',
    imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-nature-003',
    imageUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1080&q=80',
    theme: 'mountain',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-nature-004',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&q=80',
    theme: 'mountain',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  // 日落
  {
    id: 'bg-sunset-001',
    imageUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
  {
    id: 'bg-sunset-002',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80',
    theme: 'sunrise',
    textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
    preferredTextColor: 'light',
  },
];

export const getBackdropsByTheme = (theme) => {
  if (theme === 'general') {
    return DEFAULT_BACKGROUNDS.filter(bg => bg.theme !== 'festival');
  }
  return DEFAULT_BACKGROUNDS.filter(bg => bg.theme === theme);
};

export const getLiveBackgroundCandidates = (theme, options = {}) => {
  const { perQuery = 3, requestSeed } = options;
  const variants = buildQueryVariants(theme);
  const baseSeed = normalizeSeed(requestSeed);
  const normalizedTheme = theme === 'general' ? 'sunrise' : theme;
  const candidates = [];

  variants.forEach((query, queryIndex) => {
    for (let i = 0; i < perQuery; i += 1) {
      const index = queryIndex * perQuery + i;
      const sig = baseSeed + index;
      const imageUrls = buildLiveUrlCandidates(theme, query, sig);
      candidates.push(buildLiveBackground(normalizedTheme, imageUrls, index, baseSeed));
    }
  });

  return candidates;
};

export const getBlessingsByLength = (length) => {
  return DEFAULT_BLESSINGS.filter(b => b.length === length);
};

export const getRandomItem = (array, excludeList = []) => {
  const filtered = array.filter(item => !excludeList.includes(item.id));
  if (filtered.length === 0) return array[Math.floor(Math.random() * array.length)];
  return filtered[Math.floor(Math.random() * filtered.length)];
};

export const getFestivalTheme = (dateString) => {
  const monthDay = `${String(dateString.getMonth() + 1).padStart(2, '0')}-${String(dateString.getDate()).padStart(2, '0')}`;
  const festivals = {
    '01-01': { theme: 'festival', name: '元旦' },
    '02-14': { theme: 'festival', name: '情人節' },
    '10-10': { theme: 'festival', name: '雙十節' },
  };
  return festivals[monthDay] || null;
};

const DEFAULT_BLESSINGS = [
  { id: 'b-001', category: 'general', text: '早安！美好的一天開始了', length: 'short' },
  { id: 'b-002', category: 'general', text: '早上好！願你今天心情愉快，萬事順利', length: 'medium' },
  { id: 'b-003', category: 'general', text: '新的一天，新的開始。帶著微笑迎接每一個可能，願陽光照亮你的每一步', length: 'long' },
  { id: 'b-004', category: 'health', text: '健康是最大的財富', length: 'short' },
  { id: 'b-005', category: 'health', text: '照顧好自己身心靈，今天也要過得健康快樂', length: 'medium' },
  { id: 'b-006', category: 'health', text: '身體健康是最大的福氣，願你每天都有充足的精力與好心情', length: 'long' },
  { id: 'b-007', category: 'motivation', text: '今天也要加油！', length: 'short' },
  { id: 'b-008', category: 'motivation', text: '保持積極的心態相信自己的能力，你一定可以做到', length: 'medium' },
  { id: 'b-009', category: 'motivation', text: '每一次努力都是成長的痕跡，相信自己，勇敢邁出每一步，明天會更好', length: 'long' },
  { id: 'b-010', category: 'general', text: '早安，平安是福', length: 'short' },
  { id: 'b-011', category: 'general', text: '用一顆感恩的心，迎接美好的早晨', length: 'medium' },
  { id: 'b-012', category: 'general', text: '清晨的陽光喚醒大地，也喚醒我們心中的希望與夢想', length: 'long' },
  { id: 'b-013', category: 'motivation', text: '活在當下，珍惜現在', length: 'short' },
  { id: 'b-014', category: 'motivation', text: '每天進步一点点，就是最大的成功', length: 'medium' },
  { id: 'b-015', category: 'motivation', text: '失敗只是成功的過程，保持信念繼續前進，終會看到彩虹', length: 'long' },
];

export { DEFAULT_BLESSINGS };
