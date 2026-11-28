// 聚合函数：所有页面都从这里取数，保证 KPI / 图表 / 列表 / 详情一致
import { DAILY, POSTS, PERIOD_END, N_DAYS, dayDate, NOW, VIEWERS_LAG } from './seed.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---- 格式化（规则取自录屏：<10K 千分位；10K–100K 一位小数；≥100K 取整） ----
export function fmt(n) {
  if (n == null || Number.isNaN(n)) return '–';
  const a = Math.abs(n), s = n < 0 ? '-' : '';
  // V4 · 美国 2026-11-22 录屏：≥1,000 一律一位小数的 K / M，「.0」保留（225.5M、98.0M、2.8K、247.2K）
  if (a >= 1e9) return s + (a / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return s + (a / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return s + (a / 1e3).toFixed(1) + 'K';
  return s + Math.round(a).toLocaleString('en-US');
}
// Analytics 数据面板（KPI、变化值、坐标轴）：<10,000 写完整数字带千分位；1 万–10 万一位小数且去掉「.0」；≥10 万取整
// 证据：n_a731E9Wt8（Android 2025-08，有数据）1,454 / 8,238 / 19.9K / 10K / 47K / 163K / 804K / +98K；QKE（iPhone 2026-08）15.9K
export function fmtStat(n) {
  if (n == null || Number.isNaN(n)) return '–';
  const a = Math.abs(n), s = n < 0 ? '-' : '';
  const strip = (x) => x.replace(/\.0$/, '');
  if (a < 1e4) return s + Math.round(a).toLocaleString('en-US');
  if (a < 1e5) return s + strip((a / 1e3).toFixed(1)) + 'K';
  if (a < 1e6) return s + Math.round(a / 1e3) + 'K';
  if (a < 1e9) return s + strip((a / 1e6).toFixed(1)) + 'M';
  return s + strip((a / 1e9).toFixed(1)) + 'B';
}
// Video analysis header counts (n_a731E9Wt8 1:54: 22K / 1,672 / 45): full number under 10K, whole K under 1M.
// Shared so the post radar's Reach label reads exactly like the header above it (7,275 / 92K).
export const fmtCount = (v) => (v < 1e4 ? Math.round(v).toLocaleString('en-US') : v < 1e6 ? `${Math.floor(v / 1e3)}K` : fmt(v));
export const fmtFull = (n) => Math.round(n).toLocaleString('en-US');
export const fmtMoney = (n) => '$' + n.toFixed(2);
export const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
export const mdy = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
export const monDay = (d) => `${MON[d.getMonth()]} ${d.getDate()}`;
export const monDayYear = (d) => `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
export function time12(d) {
  let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m} ${ap}`;
}
// Manage 列表时间：「8/13 3:40 PM」（QKE_0117）；今天只显示时间（o1g_0248「11:29 AM」）
export function listTime(d) {
  const today = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  if (d >= today && d < new Date(today.getTime() + 86400000)) return time12(d);
  // 「Yesterday h:mm」只出现在旧版美国宣传图（appstore_manage）；美国 2026-11-22 录屏里昨天的作品仍显示「11/21 9:04 PM」（usrec 1:21）
  if (typeof window !== 'undefined' && window.__appMarket === 'store' && d >= new Date(today.getTime() - 86400000) && d < today) return `Yesterday ${time12(d)}`;
  if (d.getFullYear() !== NOW.getFullYear()) return `${mdy(d)}/${String(d.getFullYear()).slice(2)} ${time12(d)}`;
  return `${mdy(d)} ${time12(d)}`;
}
export function ago(d) {
  const diff = (NOW - d) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.round(diff / 86400)}d ago`;
  if (diff < 30 * 86400) return `${Math.round(diff / (7 * 86400))}w ago`;
  return `Posted on ${monDay(d)}`;
}
export const secToClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export function playTime(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return `${h}h:${m}m:${s}s`;
}

// ---- 区间 -------------------------------------------------------------
export const RANGE_PRESETS = [
  { key: '7', label: '7 days', days: 7 },
  { key: '28', label: '28 days', days: 28 },
  { key: '60', label: '60 days', days: 60 },
  { key: '365', label: '365 days', days: 365 },
];
export function rangeIdx(range, lag = 0) {
  if (range.key === 'custom') return { s: range.s - lag, e: range.e - lag };
  const days = RANGE_PRESETS.find((r) => r.key === range.key).days;
  return { s: PERIOD_END - lag - days + 1, e: PERIOD_END - lag };
}
export function rangeLabel(range, lag = 0) {
  const { s, e } = rangeIdx(range, lag);
  const a = dayDate(s), b = dayDate(e);
  if (a.getFullYear() !== b.getFullYear()) return `${monDayYear(a)} – ${monDayYear(b)}`;
  return `${monDay(a)} – ${monDay(b)}`;
}
export const rangeDays = (range) => { const { s, e } = rangeIdx(range); return e - s + 1; };

const sum = (arr, s, e) => { let t = 0; for (let i = Math.max(0, s); i <= Math.min(N_DAYS - 1, e); i++) t += arr[i]; return t; };

function withDelta(arr, s, e) {
  const len = e - s + 1;
  const cur = sum(arr, s, e), prev = sum(arr, s - len, s - 1);
  return { value: cur, delta: cur - prev, deltaPct: prev ? (cur - prev) / Math.abs(prev) : null };
}

// Overview 6 张 KPI（QKE_0042 顺序）
export function overviewKpis(range, market) {
  const { s, e } = rangeIdx(range);
  if (market === 'store') {
    // V4 美国版（appstore_analytics）：第 6 张卡是 Unique viewers
    const len = e - s + 1, dd = 1 - 0.055 * Math.log(len);
    const u = sum(DAILY.viewers, s, e) * dd, up = sum(DAILY.viewers, s - len, s - 1) * dd;
    return [
      { key: 'views', label: 'Post views', ...withDelta(DAILY.views, s, e) },
      { key: 'profile', label: 'Profile views', ...withDelta(DAILY.profile, s, e) },
      { key: 'likes', label: 'Likes', ...withDelta(DAILY.likes, s, e) },
      { key: 'comments', label: 'Comments', ...withDelta(DAILY.comments, s, e) },
      { key: 'shares', label: 'Shares', ...withDelta(DAILY.shares, s, e) },
      { key: 'viewers', label: 'Unique viewers', value: u, delta: u - up, deltaPct: up ? (u - up) / up : null },
    ];
  }
  return [
    { key: 'views', label: 'Post views', ...withDelta(DAILY.views, s, e) },
    { key: 'profile', label: 'Profile views', ...withDelta(DAILY.profile, s, e) },
    { key: 'likes', label: 'Likes', ...withDelta(DAILY.likes, s, e) },
    { key: 'comments', label: 'Comments', ...withDelta(DAILY.comments, s, e) },
    { key: 'shares', label: 'Shares', ...withDelta(DAILY.shares, s, e) },
    { key: 'rewards', label: 'Est. rewards', money: true, ...withDelta(DAILY.rewards, s, e) },
  ];
}
// Viewers：Total viewers / New viewers（o1g_0104）
export function viewerKpis(range) {
  const { s, e } = rangeIdx(range, VIEWERS_LAG);
  const len = e - s + 1;
  const dedupe = (n) => 1 - 0.055 * Math.log(n); // 去重：区间越长重复观众越多（估）
  const t = sum(DAILY.viewers, s, e) * dedupe(len), tp = sum(DAILY.viewers, s - len, s - 1) * dedupe(len);
  const nv = sum(DAILY.newViewers, s, e) * dedupe(len), nvp = sum(DAILY.newViewers, s - len, s - 1) * dedupe(len);
  return [
    { key: 'viewers', label: 'Total viewers', value: t, delta: t - tp, deltaPct: tp ? (t - tp) / tp : null },
    { key: 'newViewers', label: 'New viewers', value: nv, delta: nv - nvp, deltaPct: nvp ? (nv - nvp) / nvp : null },
  ];
}
// Followers：Total（All time）/ Net（o1g_0056）
export function followerKpis(range) {
  const { s, e } = rangeIdx(range);
  return [
    { key: 'followersTotal', label: 'Total followers', value: DAILY.followersTotal[e], sub: 'All time' },
    { key: 'followersNet', label: 'Net followers', ...withDelta(DAILY.followersNet, s, e) },
  ];
}

const SERIES_SRC = {
  views: DAILY.views, profile: DAILY.profile, likes: DAILY.likes, comments: DAILY.comments, shares: DAILY.shares,
  rewards: DAILY.rewards, viewers: DAILY.viewers, newViewers: DAILY.newViewers, followersNet: DAILY.followersNet,
  followersTotal: DAILY.followersTotal,
};
export function series(metric, range) {
  const { s, e } = rangeIdx(range, metric === 'viewers' || metric === 'newViewers' ? VIEWERS_LAG : 0);
  const src = SERIES_SRC[metric];
  const out = [];
  for (let i = s; i <= e; i++) out.push({ i, date: dayDate(i), value: src[i] });
  return out;
}

// 账号级 Traffic source：按作品在区间内的播放加权
export function trafficSources(range) {
  const { s, e } = rangeIdx(range);
  const acc = {}; let tot = 0;
  for (const p of POSTS) {
    const v = sum(p.daily, s, e); if (!v) continue;
    tot += v; for (const [k, w] of Object.entries(p.traffic)) acc[k] = (acc[k] || 0) + v * w;
  }
  return Object.entries(acc).map(([k, v]) => [k, v / tot]).sort((a, b) => b[1] - a[1]);
}

// Content Tab：Your top posts（o1g_0622 / 0658）
export const TOP_METRICS = [
  { key: 'views', label: 'Most views', unit: 'views' },
  { key: 'newViewers', label: 'Most new viewers', unit: 'new viewers' },
  { key: 'likes', label: 'Most likes', unit: 'likes' },
  { key: 'newFollowers', label: 'Most new followers', unit: 'new followers' },
];
export function postMetricInRange(p, metric, s, e) {
  const v = sum(p.daily, s, e);
  if (metric === 'views') return v;
  if (metric === 'likes') return v * p.likeRate;
  if (metric === 'newViewers') return v * 0.8 * p.newViewerRate;
  if (metric === 'newFollowers') return v * (p.newFollowers / Math.max(1, p.views));
  return v;
}
export function topPosts(metric, range, n = 10) {
  const { s, e } = rangeIdx(range);
  return POSTS.map((p) => ({ post: p, value: postMetricInRange(p, metric, s, e) }))
    .filter((x) => x.value >= 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// 作品级
export function postViewerStats(p) {
  const total = Math.round(p.views * 0.81);
  return {
    total,
    newPct: p.newViewerRate,
    followerPct: p.followerViewerRate,
  };
}
export function postKeyMetrics(p) {
  return [
    { key: 'views', label: 'Video views', text: String(Math.round(p.views)) },
    { key: 'playtime', label: 'Total play time', text: playTime(p.views * p.avgWatch) },
    { key: 'avg', label: 'Average watch time', text: `${p.avgWatch}s` },
    { key: 'full', label: 'Watched full video', text: pct(p.watchedFull, 2).replace(/0%$/, '%') },
    { key: 'newf', label: 'New followers', text: fmtFull(p.newFollowers) },
  ];
}
