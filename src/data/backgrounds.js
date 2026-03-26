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

const DEFAULT_BACKGROUNDS = [];

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

export const getPexelsBackgroundCandidates = async (theme, options = {}) => {
  const { perQuery = 3, requestSeed } = options;
  const themeQueries = {
    sunrise: 'sunrise,morning',
    flower: 'flower,bloom',
    mountain: 'mountain,landscape',
    festival: 'celebration,decoration',
    general: 'nature,beautiful',
  };
  const query = themeQueries[theme] || themeQueries.general;
  const baseSeed = normalizeSeed(requestSeed);
  const candidates = [];

  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${query}&per_page=${perQuery}&orientation=all`,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const photos = data.photos || [];

        for (let i = 0; i < Math.min(photos.length, perQuery); i++) {
          const photo = photos[i];
          const imageUrl = photo.src?.large2x || photo.src?.large || photo.src?.original;
          
          if (imageUrl) {
            const sig = baseSeed + i;
            candidates.push({
              id: `pexels-${theme}-${sig}`,
              imageUrl,
              fallbackUrls: [
                photo.src?.large,
                photo.src?.medium,
              ].filter(Boolean),
              imageCandidates: [
                { source: 'pexels-api', url: imageUrl, baseWeight: 1.2 },
                ...(photo.src?.large ? [{ source: 'pexels-api', url: photo.src.large, baseWeight: 1 }] : []),
              ],
              theme,
              textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
              preferredTextColor: theme === 'flower' ? 'dark' : 'light',
            });
          }
        }
      }
    } catch (error) {
      console.error('Pexels API 請求失敗，使用備選方案:', error);
    }
  }

  if (candidates.length === 0) {
    for (let i = 0; i < perQuery; i++) {
      const sig = baseSeed + i;
      const url = `https://source.pexels.com/${query}?sig=${sig}`;
      candidates.push({
        id: `pexels-${theme}-${sig}`,
        imageUrl: url,
        fallbackUrls: [],
        imageCandidates: [{ source: 'pexels-source', url, baseWeight: 1 }],
        theme,
        textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
        preferredTextColor: theme === 'flower' ? 'dark' : 'light',
      });
    }
  }

  return candidates;
};

export const getUnsplashBackgroundCandidates = async (theme, options = {}) => {
  const { perQuery = 3, requestSeed } = options;
  const themeQueries = {
    sunrise: 'sunrise',
    flower: 'flowers',
    mountain: 'mountains',
    festival: 'celebration',
    general: 'nature',
  };
  const query = themeQueries[theme] || themeQueries.general;
  const baseSeed = normalizeSeed(requestSeed);
  const candidates = [];

  for (let i = 0; i < perQuery; i++) {
    const sig = baseSeed + i;
    const url = `https://source.unsplash.com/1080x1080/?${query}&sig=${sig}`;
    candidates.push({
      id: `unsplash-${theme}-${sig}`,
      imageUrl: url,
      fallbackUrls: [],
      imageCandidates: [{ source: 'unsplash-source', url, baseWeight: 1 }],
      theme,
      textSafeArea: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
      preferredTextColor: theme === 'flower' ? 'dark' : 'light',
    });
  }

  return candidates;
};
