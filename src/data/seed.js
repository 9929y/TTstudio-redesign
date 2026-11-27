// =====================================================================
// 唯一数据源：一个模拟账号 + 作品 + 日序列。固定种子，刷新后数据不变。
// 账号级的每个数字都由作品的日序列求和得到，所以 KPI、图表、Top posts、
// 作品详情、Manage 列表之间能互相对上。
// =====================================================================

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261122);
const rand = (a, b) => a + (b - a) * R();
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const lognorm = (median, sigma) => {
  const u = Math.max(1e-9, R()), v = R();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return median * Math.exp(sigma * z);
};

// ---- 时间轴 ---------------------------------------------------------
// 原型「今天」= 2026-11-22 16:15（与 iOS 录屏状态栏时刻同风格）
export const NOW = new Date(2026, 10, 22, 16, 15);
export const DAY_MS = 86400000;
export const N_DAYS = 430; // 日序列长度，V4：最后一项 = 今天
const startDay = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - (N_DAYS - 1));
// V4：按日历加天数（之前用固定 24h 相加，跨过 11 月初夏令时结束后会少一天）
export const dayDate = (i) => new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + i);
export const dayIndexOf = (d) =>
  Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - startDay) / DAY_MS);
// Analytics 区间的最后一天 = 前天（o1g 0:36：4/25 录制，区间止于 4/23），且最后一天数据不完整（斜线阴影）
// V4：美国 2026-11-22 录屏里 Key metrics 区间是「11月16日 – 11月22日」，以今天为终点（今天数据不完整，斜线阴影）
export const PERIOD_END = N_DAYS - 1;
// Viewers 子 Tab 的区间晚 3 天（录屏 1:02：「11月13日 – 11月19日」）
export const VIEWERS_LAG = 3;

// ---- 账号 -----------------------------------------------------------
export const ACCOUNT = {
  name: 'Mira Lane',
  handle: 'miralane.travels',
  avatarHue: 18,
  bio: 'Weekend trips you can actually afford ✈️',
  followersStart: 9840,
};

// ---- 作品 -----------------------------------------------------------
const TITLES = [ // [caption, emoji, coverText, cover 照片名]（2026-11-25：账号改为旅行，封面用 illustrations/covers/ 的照片）
  ['3 days in Lisbon on a budget 🚋 #lisbon #traveltips', '🚋', 'LISBON IN 3 DAYS', 'travel_09_paris_lane'],
  ['The only packing list you need (carry-on only!) #packing #carryon', '🎒', 'CARRY-ON ONLY', 'travel_03_garibaldi_hike'],
  ['POV: you finally learn to use the Tokyo metro 🚇 #tokyo #traveltok', '🚇', 'METRO LIKE A LOCAL', 'travel_14_tokyo_street'],
  ['4 days in Italy on $400 — trains, beds and food #budgettravel', '💶', '$400 FOR 4 DAYS', 'travel_13_amalfi_town'],
  ['The café my grandma took me to every summer ❤️ #dubrovnik', '☕️', "GRANDMA'S CAFÉ", 'travel_05_dubrovnik_cafe'],
  ['Stop booking the first hotel you see. Do this instead #travelhacks', '🏨', 'DON’T BOOK YET', 'travel_19_paris_street'],
  ['5 apps that make any trip easier #travelapps', '📱', '5 APPS', 'travel_06_tokyo_crossing'],
  ['Hiking to the lake before sunrise — the view is unreal 🏔️ #hiking', '🏔️', 'LAKE HIKE', 'travel_11_hiker_lake'],
  ['I tried the viral cliff road so you don’t have to #bali', '🌴', 'VIRAL TEST', 'travel_10_bali_pathway'],
  ['Sunday planning: a 12-stop trip in 1 hour #tripplanning', '🗺️', '12 STOPS', 'travel_16_sardinia_walk'],
  ['One-bag weekend in Milan 👜 #milan #weekendtrip', '👜', 'ONE BAG', 'travel_01_milan_street'],
  ['Phone photo tips every traveler should know 📷 #travelphotography', '📷', 'PHOTO BASICS', 'travel_18_stone_alley'],
  ['Kyoto in the rain, no umbrella needed ☔️ #kyoto', '☔️', 'RAINY KYOTO', 'travel_12_kyoto_evening'],
  ['How I keep flights cheap all year ✈️ #flighthacks', '✈️', 'CHEAP FLIGHTS', 'travel_22_amalfi_cliff'],
  ['Solo hike attempt #1 (it went… ok) #hiking', '🥾', 'ATTEMPT #1', 'travel_03_garibaldi_hike'],
  ['A coast day trip that looks like you planned for weeks #amalfi', '⛵️', 'DAY TRIP', 'travel_07_italy_coast_boats'],
  ['Where I stayed in a week as a travel creator #traveldiary', '📅', 'WEEK OF STAYS', 'travel_24_vienna_cafe'],
  ['Tokyo in 7 hours on a layover 🔥 #tokyo #layover', '🔥', '7 HOURS', 'travel_06_tokyo_crossing'],
  ['Replying to your comments: why I never check a bag #packing', '💬', 'YOU ASKED', 'travel_09_paris_lane'],
  ['Travel basics under $30 that last for years #travelgear', '🧳', 'GEAR 101', 'travel_20_kyoto_historic_street'],
  ['Temple mornings, empty paths every time #kyoto', '⛩️', 'EMPTY PATHS', 'travel_04_temple_walkway'],
  ['Coast walks for hot days 🌊 #summertravel', '🌊', 'COAST WALK', 'travel_22_amalfi_cliff'],
  ['The street that went viral in my camera roll 📸 #milan', '📸', 'THAT STREET', 'travel_01_milan_street'],
  ['A pasta class in Bologna that was worth every euro 🍝 #italy', '🍝', 'PASTA CLASS', 'other_01_pasta_making'],
  ['Testing 3 carry-on backpacks so you don’t have to #travelgear', '🎒', 'BACKPACK TEST', 'travel_03_garibaldi_hike'],
  ['Dubrovnik before the cruise ships arrive ☀️ #croatia', '☀️', 'BEAT THE CROWDS', 'travel_05_dubrovnik_cafe'],
  ['How to read a Tokyo train map in 60 seconds #tokyo #traveltips', '🚇', 'TRAIN MAP 101', 'travel_14_tokyo_street'],
  ['Amalfi by ferry, cheaper than you think ⛴️ #amalfi', '⛴️', 'TAKE THE FERRY', 'travel_07_italy_coast_boats'],
  ['One day in Milan, 3 ways #milan', '👜', '3 WAYS', 'travel_01_milan_street'],
  ['Paris on foot: my Sunday morning loop 🥐 #paris', '🥐', '5 KM LOOP', 'travel_19_paris_street'],
  ['The Bali cliff road nobody tells you about 🌴 #bali', '🌴', 'HIDDEN ROAD', 'travel_10_bali_pathway'],
  ['Sunrise at the lake after a 4am start (step by step) #hiking', '🥾', '4AM START', 'travel_11_hiker_lake'],
  ['Things in my carry-on I’d buy again #travelfinds', '⭐️', 'WORTH IT', 'travel_09_paris_lane'],
  ['Kyoto for people scared of crowds #kyoto', '🏮', 'QUIET KYOTO', 'travel_20_kyoto_historic_street'],
  ['A long weekend on the Amalfi coast for two #amalfi', '🍋', 'AMALFI FOR 2', 'travel_13_amalfi_town'],
  ['Vienna coffee houses — don’t tell Paris ☕️ #vienna', '☕️', 'COFFEE HOUSES', 'travel_24_vienna_cafe'],
  ['The old-town stairway, top to bottom #oldtown', '🪜', '268 STEPS', 'travel_18_stone_alley'],
  ['Sardinia on foot: the full old-town route #sardinia', '🗺️', 'OLD TOWN WALK', 'travel_16_sardinia_walk'],
  ['Tokyo crossing at rush hour 🚦 #tokyo', '🚦', 'RUSH HOUR', 'travel_06_tokyo_crossing'],
  ['Kyoto temple shortcut through the back entrance #kyoto', '⛩️', 'BACK ENTRANCE', 'travel_04_temple_walkway'],
  ['Positano views you can reach without a tour #amalfi', '🌊', 'NO TOUR NEEDED', 'travel_22_amalfi_cliff'],
  ['Kyoto side streets in the time it takes to drink a coffee #kyoto', '🍵', 'SIDE STREETS', 'travel_12_kyoto_evening'],
  ['', '🎬', 'BTS', 'other_02_coffee'],
  ['Kyoto at dusk, when the lanterns come on 🏮 #kyoto', '🏮', 'KYOTO AT DUSK', 'travel_25_kyoto_dusk'],
];

const HUES = [12, 28, 40, 200, 340, 160, 260, 8, 190, 50, 300, 120];

function trafficMix(viral) {
  const fyp = viral ? rand(0.93, 0.97) : rand(0.78, 0.92);
  const rest = 1 - fyp;
  const parts = [rand(2, 5), rand(1, 4), rand(0.5, 2), rand(0.3, 1.5), rand(0.1, 0.8), rand(0.1, 0.6)];
  const s = parts.reduce((a, b) => a + b, 0);
  const keys = ['Personal profile', 'Following', 'Search', 'Direct messages', 'Sound', 'Other'];
  const out = { 'For You': fyp };
  keys.forEach((k, i) => (out[k] = (parts[i] / s) * rest));
  return out;
}

function retentionCurve(duration, strength) {
  // 每秒一个点：0 秒 100%，前 2 秒骤降，之后缓降（v1pC 0:34「0:02 · 26%」形态）
  const pts = [];
  for (let s = 0; s <= duration; s++) {
    const early = Math.exp(-s / (0.9 + strength * 1.6));
    const tail = (0.18 + strength * 0.3) * Math.exp(-s / (duration * (0.9 + strength)));
    pts.push(Math.max(0.01, Math.min(1, s === 0 ? 1 : early * (1 - tail) + tail)));
  }
  return pts;
}

const COMMENTERS = [
  ['jasmyntravels', 820], ['map.nerd', 1200], ['dadwhowanders', 64000], ['elle.explores', 3400],
  ['the_slow_route', 145000], ['sam_packs_', 210], ['carryonkatie', 18000], ['window.seat', 950],
  ['brokestudenttrips', 233000], ['auntie.lin', 41], ['marco.viaggia', 7200], ['sunsetqueen', 12500],
  ['lazytraveler.co', 310000], ['railpass_rachel', 2600], ['peter.plans', 88], ['jetlag_mama', 54000],
];
const COMMENT_TEXTS = [
  'Did this route last week and it was perfect 😭', 'What camera do you shoot on?',
  'Can I do this without renting a car?', 'The light at 0:04 🔥🔥', 'Saving this for our trip in May',
  'How many days would you stay?', 'Okay this is genius', 'Went there — add the sunset viewpoint, 10/10',
  'Where is your backpack from??', 'Need a budget version pls 🙏', 'This is exactly how I remember it',
  'I always get lost at the station, any tips?', 'Itinerary in bio?', 'You make it look so easy 😩',
  'Could I do this with kids?', 'The way you edit is so satisfying',
];
const REPLY_TEXTS = [
  'Yes! Trains run every 20 minutes, no car needed 💚', 'Three days is plenty, four if you hike!',
  'Go early, before 8am it is almost empty', 'Follow the signs for the east exit 🙌', 'Budget version coming this week!',
];

function makeComments(post, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const [h, fc] = pick(COMMENTERS);
    const hoursAfter = rand(0.2, Math.max(1, (NOW - post.publishedAt) / 3600000));
    const time = new Date(post.publishedAt.getTime() + hoursAfter * 3600000);
    const replied = R() < 0.35;
    list.push({
      id: `${post.id}-c${i}`,
      postId: post.id,
      user: { handle: h, followerCount: fc, isFollower: R() < 0.42, hue: randi(0, 359) },
      text: pick(COMMENT_TEXTS),
      time,
      likes: Math.floor(lognorm(6, 1.3)),
      likedByCreator: R() < 0.2,
      disliked: false,
      replies: replied ? [{ id: `${post.id}-c${i}-r0`, byCreator: true, text: pick(REPLY_TEXTS), time: new Date(time.getTime() + rand(1, 30) * 3600000) }] : [],
      otherReplies: R() < 0.25 ? randi(1, 6) : 0,
    });
  }
  return list.sort((a, b) => b.time - a.time);
}

function buildPosts() {
  const posts = [];
  let d = 418; // 天数前
  const n = TITLES.length;
  for (let i = 0; i < n; i++) {
    const daysAgo = Math.max(1, Math.round(d));
    d -= (418 / n) * rand(0.6, 1.4);
    const pub = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo, randi(8, 21), randi(0, 59));
    posts.push({ idx: i, publishedAt: pub });
  }
  posts.sort((a, b) => a.publishedAt - b.publishedAt);
  return posts.map((p, k) => {
    const [title, emoji, coverText, cover] = TITLES[k];
    const viral = k === 31 ? 2 : k === 17 || k === 38 || k === 40 ? 1 : 0; // 4 条爆款（V4：28 天环比回到正常幅度）
    const lifetime = viral === 2 ? 386000 : viral === 1 ? rand(88000, 132000) : Math.max(180, lognorm(4200, 0.85));
    const duration = R() < 0.3 ? randi(61, 94) : randi(9, 48);
    const strength = rand(0.15, 0.7) + (viral ? 0.25 : 0);
    const retention = retentionCurve(duration, strength);
    const avgPct = retention.reduce((a, b) => a + b, 0) / retention.length;
    const pubIdx = dayIndexOf(p.publishedAt);
    const tau = viral ? rand(3, 6) : rand(1.2, 3.5);
    // 日播放分布
    const daily = new Float64Array(N_DAYS);
    let w = 0; const ws = [];
    for (let i = pubIdx; i < N_DAYS; i++) {
      const age = i - pubIdx;
      const v = Math.exp(-age / tau) + 0.004 * Math.exp(-age / 120);
      ws.push(v); w += v;
    }
    // 生命周期总量按「如果完整播完」算，近期作品只拿到已过去的部分
    const fullW = (() => { let s = 0; for (let a = 0; a < 400; a++) s += Math.exp(-a / tau) + 0.004 * Math.exp(-a / 120); return s; })();
    ws.forEach((v, j) => (daily[pubIdx + j] = Math.round((lifetime * v) / fullW * rand(0.82, 1.18))));
    const views = daily.reduce((a, b) => a + b, 0);
    const likeRate = rand(0.035, 0.11), commentRate = rand(0.0012, 0.004), shareRate = rand(0.002, 0.009), saveRate = rand(0.004, 0.02);
    const hue = HUES[k % HUES.length];
    const privacy = k === n - 3 ? 'only_you' : k === 12 ? 'friends' : 'everyone';
    const post = {
      id: `p${String(k + 1).padStart(2, '0')}`,
      title, caption: title, emoji, coverText, cover, hue,
      publishedAt: p.publishedAt, pubIdx,
      duration, privacy, viral,
      daily, views,
      likes: Math.round(views * likeRate), comments: Math.round(views * commentRate),
      shares: Math.round(views * shareRate), saves: Math.round(views * saveRate),
      likeRate, commentRate, shareRate, saveRate,
      retention, avgWatch: +(avgPct * duration).toFixed(1), avgPct,
      watchedFull: retention[retention.length - 1],
      newFollowers: Math.round(views * rand(0.002, 0.006)),
      newViewerRate: rand(0.86, 0.96),
      followerViewerRate: rand(0.04, 0.14),
      traffic: trafficMix(viral),
      gender: (() => { const f = rand(0.55, 0.72); const o = rand(0.01, 0.03); return { Female: f, Male: 1 - f - o, Other: o }; })(),
      topWords: viral ? ['itinerary', 'kyoto', 'sunset', 'budget', 'crowds'] : views > 3000 ? ['itinerary', 'love', 'easy'] : [],
      searchQueries: views > 20000 ? [['kyoto itinerary 3 days', 0.31], ['tokyo metro guide', 0.22], ['weekend trip ideas', 0.14]] : [],
    };
    // 前 48 小时的逐小时播放（新作品的 0h–44h 刻度，18Y 0:21）
    const first2 = (daily[pubIdx] || 0) + (daily[pubIdx + 1] || 0);
    const hourly = []; let hs = 0;
    for (let h = 0; h < 48; h++) { const v = Math.exp(-h / 9) * (0.6 + R() * 0.8); hourly.push(v); hs += v; }
    post.hourly = hourly.map((v) => Math.round((v / hs) * first2));
    post.commentList = makeComments(post, Math.min(14, Math.max(1, Math.round(post.comments / 6))));
    post.commentCount = post.comments;
    return post;
  });
}

export const POSTS = buildPosts();
export const POST_BY_ID = Object.fromEntries(POSTS.map((p) => [p.id, p]));

// ---- 账号日序列（由作品求和） ---------------------------------------
function buildDaily() {
  const views = new Float64Array(N_DAYS), likes = new Float64Array(N_DAYS), comments = new Float64Array(N_DAYS),
    shares = new Float64Array(N_DAYS), profile = new Float64Array(N_DAYS), rewards = new Float64Array(N_DAYS),
    viewers = new Float64Array(N_DAYS), newViewers = new Float64Array(N_DAYS), followersNet = new Float64Array(N_DAYS),
    followersTotal = new Float64Array(N_DAYS);
  for (const p of POSTS) {
    for (let i = p.pubIdx; i < N_DAYS; i++) {
      const v = p.daily[i]; if (!v) continue;
      views[i] += v; likes[i] += v * p.likeRate; comments[i] += v * p.commentRate; shares[i] += v * p.shareRate;
      if (p.duration >= 60) rewards[i] += v * 0.0009; // Creator Rewards 仅 ≥1 分钟作品（估）
    }
  }
  let total = ACCOUNT.followersStart;
  const R2 = rng(77);
  for (let i = 0; i < N_DAYS; i++) {
    views[i] += Math.round(60 + R2() * 90); // 旧作品长尾
    profile[i] = Math.round(views[i] * (0.006 + R2() * 0.004));
    viewers[i] = Math.round(views[i] * 0.8);
    newViewers[i] = Math.round(viewers[i] * (0.88 + R2() * 0.06));
    likes[i] = Math.round(likes[i]); comments[i] = Math.round(comments[i]); shares[i] = Math.round(shares[i]);
    rewards[i] += 0.14 + 0.06 * Math.sin(i * 1.7); // LIVE Gifts 等小额来源（周报里的收益来源拆分）
    rewards[i] = Math.round(rewards[i] * 100) / 100;
    const net = Math.round(views[i] * 0.0031 - (2 + R2() * 4));
    followersNet[i] = net; total += net; followersTotal[i] = total;
  }
  return { views, likes, comments, shares, profile, rewards, viewers, newViewers, followersNet, followersTotal };
}
export const DAILY = buildDaily();

// ---- 受众画像（Viewer / Follower insights） ---------------------------
export const VIEWER_INSIGHTS = {
  Gender: [['Female', 0.641], ['Male', 0.338], ['Other', 0.021]],
  Age: [['18-24', 0.312], ['25-34', 0.384], ['35-44', 0.181], ['45-54', 0.082], ['55+', 0.041]],
  Locations: [['United States', 0.582], ['United Kingdom', 0.091], ['Canada', 0.064], ['Australia', 0.04], ['Philippines', 0.031], ['Other', 0.192]],
};
export const FOLLOWER_INSIGHTS = {
  Gender: [['Female', 0.662], ['Male', 0.318], ['Other', 0.02]],
  Age: [['18-24', 0.274], ['25-34', 0.402], ['35-44', 0.196], ['45-54', 0.087], ['55+', 0.041]],
  Locations: [['United States', 0.611], ['United Kingdom', 0.084], ['Canada', 0.071], ['Australia', 0.043], ['Germany', 0.022], ['Other', 0.169]],
};
// Most active times：每天 24 小时（o1g 1:17，「In the last 7 days, your viewers were most active on…」）
export function activeHours(dayOffset) {
  const r = rng(500 + dayOffset);
  return Array.from({ length: 24 }, (_, h) => {
    const base = Math.exp(-((h - 20) ** 2) / 18) * 900 + Math.exp(-((h - 12.5) ** 2) / 8) * 420 + 60;
    return Math.round(base * (0.8 + r() * 0.4) * (1 + 0.08 * dayOffset));
  });
}
export const ACTIVE_DAYS = [0.82, 0.74, 0.9, 1, 0.88, 0.79, 0.95].map((v) => Math.round(v * 6200));

export const ALSO_WATCHED_CREATORS = [
  { name: 'Rail & Roam', followers: '2.1M', hue: 20 }, { name: 'tinysuitcase', followers: '842K', hue: 160 },
  { name: 'Danny Offgrid', followers: '5.4M', hue: 260 }, { name: 'shoulderseason', followers: '96K', hue: 40 },
  { name: 'slow.routes', followers: '310K', hue: 200 },
];
export const ALSO_VIEWED_POSTS = [
  { title: 'The 2-day Algarve route everyone is saving', views: '2.4M', by: 'Rail & Roam', hue: 8, emoji: '🌊', cover: 'travel_17_algarve_cliffs' },
  { title: 'Hostel room upgrades ranked', views: '980K', by: 'tinysuitcase', hue: 190, emoji: '🛏️', cover: 'other_05_lifestyle' },
  { title: 'The mountain trail secret (no permit needed)', views: '5.1M', by: 'Danny Offgrid', hue: 30, emoji: '🔥', cover: 'travel_08_mountain_hiking' },
];

// ---- Inspiration 视频流（他人作品，H1：Insights 看他人作品聚合数据） --------
const INSPO = [
  ['coastlinecarl', 'See 5 Bali beaches in one day with this one loop 🌴 Start at the cliffs before 8, keep the scooter on the coast road and you never sit in traffic. The map pin list is in the comments! #bali #traveltips #beaches #traveltok', '🌴', 'original sound - coastlinecarl', 4.8e6, 'travel_02_bali_cliffs'],
  ['the.trail.notes', 'Every layer you need for a week of hiking #hiking #packing', '🥾', 'original sound - the.trail.notes', 1.27e6, 'travel_08_mountain_hiking'],
  ['grandmasontour', 'My 92-year-old grandma rates viral viewpoints 😂 Today: the cliff walk, the glass bridge and the “secret” beach. She was NOT impressed by the bridge. Which one should she try next? #grandma #viral #traveltest #review', '👵', 'Coast drive - Lofi Travel', 12.6e6, 'travel_15_coastal_cliff'],
  ['budgetroutes', 'A week in Portugal for $250, full receipts 🧾 Every bed is under $30, trains only, and the last day is free beaches in the Algarve. Prices from my trip in October. #budget #portugal #budgettravel', '🧾', 'original sound - budgetroutes', 860e3, 'travel_17_algarve_cliffs'],
  ['city.loops', 'Walking every avenue in Manhattan, day 47 #newyork', '🗽', 'original sound - city.loops', 2.3e6, 'travel_21_new_york_street'],
  ['slowmornings', 'Old-town squares that are actually empty at 7am #europe', '☕️', 'Morning - Café Sounds', 3.9e6, 'travel_23_european_street'],
];
export const INSPIRATION = INSPO.map(([creator, caption, emoji, sound, views, cover], i) => {
  const r = rng(900 + i);
  const trend = Array.from({ length: 14 }, (_, d) => Math.round((views / 9) * Math.exp(-((d - 3) ** 2) / 12) * (0.8 + r() * 0.4)));
  return {
    id: `insp${i}`, creator, caption, emoji, sound, views, cover,
    hue: (i * 57 + 10) % 360,
    likes: Math.round(views * (0.06 + r() * 0.05)), comments: Math.round(views * (0.0015 + r() * 0.003)),
    shares: Math.round(views * (0.004 + r() * 0.01)), saves: Math.round(views * (0.008 + r() * 0.02)),
    postedDaysAgo: randi(2, 40), trend,
    topWords: ['itinerary', 'where', 'need', 'budget', 'wow'].slice(0, 3 + (i % 3)),
    creatorStats: { followers: Math.round(views / (3 + r() * 6)), totalLikes: Math.round(views * 1.8), posts: randi(60, 900), avgViews: Math.round(views / (4 + r() * 6)) },
  };
});

// ---- 素材库（Upload 选择器） ------------------------------------------
export const MEDIA = Array.from({ length: 21 }, (_, i) => {
  const isVideo = i % 3 !== 1;
  return { id: `m${i}`, type: isVideo ? 'video' : 'photo', duration: isVideo ? randi(4, 58) : 0, hue: (i * 37 + 12) % 360, emoji: pick(['🏔️', '🌊', '🏮', '⛩️', '🚇', '☕️', '🥾', '🌴', '📷']) };
});

// ---- Create › Drafts 预置草稿（2026-11-26 新增：两条视频草稿，命名规则同存草稿 = 日期 yyyymmdd） ----
// 大小与时长按 Composer 存草稿的同一公式（每段 38.4M + 12.1M；时长为各段相加）
const draftOf = (id, daysAgo, desc, clips) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo);
  const name = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const media = clips.map(([dur, cover, hue, emoji], i) => ({ id: `${id}-m${i}`, type: 'video', duration: dur, cover, hue, emoji }));
  const total = media.reduce((a, m) => a + m.duration, 0);
  return { id, seed: true, name, desc, privacy: 'everyone', media, size: `${(media.length * 38.4 + 12.1).toFixed(1)}M`, kind: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` };
};
export const SEED_DRAFTS = [
  draftOf('d-seed-1', 1, 'Kyoto at dusk, part 2: the full itinerary 🏮 #kyoto', [[9, 'travel_12_kyoto_evening', 18, '🏮'], [14, 'travel_25_kyoto_dusk', 28, '🏮'], [11, 'travel_04_temple_walkway', 40, '⛩️']]),
  draftOf('d-seed-2', 4, 'Amalfi on a budget: every cost listed 🍋 #amalfi', [[21, 'travel_07_italy_coast_boats', 200, '⛵️'], [17, 'travel_13_amalfi_town', 50, '🍋']]),
];

// ---- Inbox（2026 iOS：All / Posts / Account updates，QKE 0:52） ----------
const topPost = [...POSTS].sort((a, b) => b.daily[PERIOD_END] - a.daily[PERIOD_END])[0];
export const REMOVED_POST = {
  title: 'Trying every lounge at the airport (with the lounge pass trick I use) — full review + how to get in for free',
  emoji: '✈️', hue: 210,
};
export const INBOX_SEED = [
  // V4：美国 2026-11-22 录屏（usrec 0:00 / 1:19）里最新的两条是「新设备登录」账号更新
  { id: 'n0', type: 'account', tag: 'Account updates', title: 'Your account was logged in from a new device', body: 'Someone logged in at 11/22 23:00 EST from California on an iPhone 16 Pro. If this wasn’t you, secure your account now.', time: '1m', homeTime: 'Just now', detail: 'policy', unread: true },
  { id: 'n00', type: 'account', tag: 'Account updates', title: 'Your account was logged in from a new device', body: 'Someone logged in at 11/22 16:41 EST from California on an iPhone 16 Pro. If this wasn’t you, secure your account now.', time: '6h', homeTime: '6h ago', detail: 'policy', unread: true },
  { id: 'n01', type: 'account', tag: 'Account updates', title: '“Suggest your account to people who open or send you links” setting update', body: 'Your TikTok profile is currently suggested to people who open links you share or send you links. We’ll remove this privacy setting in 30 days and continue to follow your preferences. We’ll suggest your account based on your other “Suggest your account to others” settings, which you can review at any time in Settings and privacy.', time: '1d', detail: 'policy', unread: false, menu: true },
  { id: 'n02', type: 'account', tag: 'Account updates', title: 'Your account was logged in from a new device', body: 'Someone logged in at 11/21 22:08 EST from California on an iPhone 16 Pro. If this wasn’t you, secure your account now.', time: '1d', detail: 'policy', unread: false },
  { id: 'n1', type: 'posts', tag: 'Posts · Updates', title: 'You’re outperforming 90% of creators with similar follower counts', body: `With ${topPost.daily[PERIOD_END].toLocaleString('en-US')} views and ${Math.round(topPost.daily[PERIOD_END] * topPost.likeRate)} likes, this video ranks among top performers. Dive into analytics to see what made it stand out.`, time: '6d', postId: topPost.id, unread: true },
  { id: 'n2', type: 'account', tag: 'Account updates', title: 'Appeal not approved', body: 'We reviewed your appeal and found that your video violates our Community Guidelines. Your video will not be restored.', time: '6d', detail: 'appeal', unread: true },
  { id: 'n3', type: 'account', tag: 'Account updates', title: 'Updates to our Branded Content Policy', body: 'From 31 August, some Branded Content from approved government entities will be allowed. In some EMEA markets, Branded Content from approved brands may…', time: '7 Aug', detail: 'policy', unread: false },
  { id: 'n4', type: 'posts', tag: 'Posts · Updates', title: 'Your post is getting more views than usual', body: 'Your latest video is getting traction from For You. Check how viewers found it.', time: '12 Nov', postId: POSTS[POSTS.length - 2].id, unread: false },
  { id: 'n5', type: 'account', tag: 'Account updates', title: 'Your scheduled posts are now visible in Manage', body: 'Scheduled posts appear at the top of your Posts list with a Scheduled label until they go live.', time: '3 Nov', detail: 'policy', unread: false },
];

export const SETTINGS_GROUPS = [
  ['Account', ['Favourites', 'Likes', 'Account', 'Privacy', 'Post settings', 'Security & permissions', 'Edit profile']],
  ['General', ['Notifications', 'Announcements', 'Activity centre', 'App language', 'Content preferences', 'Display']],
  ['Support & about', ['Report a problem', 'Support', 'Terms and policies']],
  ['Login', ['Switch account', 'Log out']],
];
