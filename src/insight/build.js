// 2026-11-26 数据对齐：AI 模块里的每个数字都从 seed.js / agg.js 现算，和页面下方的 KPI、榜单、作品详情用同一份数据。
// 规则来源（飞书）：
// - 《AI Insights 信息架构与数据证据设计》§2.2 账号卡只和自己的前 7 天比；§2.4 Details；§5 和别人比（你的同类作品中位数）
// - 《AI insight 与 AI 内容的 Prompt 设计指南》〇.3.6 评分公式（百分位、同类作品 = 同时长档 + 同发布后窗口、至少 5 条、典型作品 = 50）
// - 《布局与 UI 细节优化方案》第 4 节：评分变化写 pts，指标变化写 % 并带前后值，分两行；Engagement 统一按 Likes −38.2%
// 2026-11-26 已确认：A、B 的分数也按〇.3.6 公式现算（本周在自己过去 12 周里的百分位），不再用画板演示分。
import { DAILY, POSTS, PERIOD_END, INSPIRATION, dayDate } from '../data/seed.js';
import { fmt, fmtStat, monDay, secToClock } from '../data/agg.js';
import { moduleA as A0 } from './demo/moduleA.js';
import { moduleB as B0 } from './demo/moduleB.js';
import { moduleC as C0 } from './demo/moduleC.js';
import E0 from './demo/moduleE.js';
import { withAI, curatedWithAI, summaryWithAI } from './ai.js'; // 2026-11-26：AI 结论句，见文件末尾

// ---------- 通用 ----------
const sum = (arr, s, e) => { let t = 0; for (let i = Math.max(0, s); i <= Math.min(arr.length - 1, e); i++) t += arr[i] || 0; return t; };
const median = (xs) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const percentile = (x, hist) => { let below = 0, tied = 0; for (const h of hist) { if (h < x) below++; else if (h === x) tied++; } return ((below + 0.5 * tied) / hist.length) * 100; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const durationBucket = (sec) => (sec < 30 ? '<30s' : sec < 60 ? '30–60s' : '≥60s');
const BUCKET_WORDS = { '<30s': 'under 30 seconds', '30–60s': 'of 30–60 seconds', '≥60s': 'of 60 seconds or more' };
const MINUS = '−';
const signPct = (cur, prev) => { if (!prev) return ''; const p = ((cur - prev) / Math.abs(prev)) * 100; return `${p >= 0 ? '+' : MINUS}${Math.abs(p).toFixed(1)}%`; };
const signPts = (d) => `${d >= 0 ? '+' : MINUS}${Math.abs(d)} ${Math.abs(d) === 1 ? 'pt' : 'pts'}`;
const arrowPct = (cur, prev) => { if (!prev) return ''; const p = ((cur - prev) / Math.abs(prev)) * 100; return `${p >= 0 ? '↑' : '↓'} ${Math.abs(p).toFixed(1)}%`; };
const money = (n) => '$' + n.toFixed(2);
export const postTitle = (p) => (p.title || '').trim() || 'Untitled post';
const shortTitle = (p) => postTitle(p).replace(/[#\p{Extended_Pictographic}].*$/u, '').replace(/[,—–-]\s*$/, '').trim() || 'Untitled post';
// 「Kyoto at dusk, when the lanterns come on」→「Kyoto at dusk」：对话里提到作品时用的短名
const nameOf = (p) => { const t = shortTitle(p); const m = t.split(/[,:]/)[0].trim(); return m.length >= 8 ? m : t; };
const ageOf = (p) => PERIOD_END - p.pubIdx + 1;
const viewsAtAge = (p, age) => sum(p.daily, p.pubIdx, p.pubIdx + age - 1);

// ---------- 账号周数据（A、B） ----------
const weekWin = (k) => { const e = PERIOD_END - 7 * k; return { s: e - 6, e }; };
const dedupe = (len) => 1 - 0.055 * Math.log(len); // 与 agg.js viewerKpis 同一去重系数
function weekTotals(k) {
  const { s, e } = weekWin(k);
  const g = (a) => sum(a, s, e);
  return { views: g(DAILY.views), likes: g(DAILY.likes), comments: g(DAILY.comments), shares: g(DAILY.shares), profile: g(DAILY.profile),
    rewards: Math.round(g(DAILY.rewards) * 100) / 100, newViewers: g(DAILY.newViewers) * dedupe(7), net: g(DAILY.followersNet) };
}
// 作品在本周窗口内的各项（与 Content 页 Top posts 同一算法）
const POST_METRIC = {
  views: (p, v) => v, likes: (p, v) => v * p.likeRate, comments: (p, v) => v * p.commentRate, shares: (p, v) => v * p.shareRate,
  newViewers: (p, v) => v * 0.8 * p.newViewerRate, newFollowers: (p, v) => v * (p.newFollowers / Math.max(1, p.views)),
};
function contributors(metric, total) {
  const { s, e } = weekWin(0);
  const list = POSTS.map((p) => ({ p, v: POST_METRIC[metric](p, sum(p.daily, s, e)) })).filter((x) => x.v >= 0.5).sort((a, b) => b.v - a.v).slice(0, 3);
  const share = (v) => v / total;
  const rows = list.map(({ p, v }) => ({ postId: p.id, title: postTitle(p), val: fmt(Math.round(v)), w: `${Math.round(share(v) * 100)}%`, meta: `${Math.round(share(v) * 100)}% of the total` }));
  const top1 = list[0] ? share(list[0].v) : 0, top3 = list.reduce((a, x) => a + x.v, 0) / total;
  return { rows, top1, top3 };
}
// 飞书 2.4：某一条 ≥ 50% 写 One post brought half…；前三条 ≥ 70% 写 Three posts brought n%…；其他不写
function captionFor(unit, c) {
  if (Math.round(c.top1 * 100) >= 50) return `One post brought ${c.top1 >= 0.55 ? 'over half' : 'half'} of your ${unit}.`;
  if (c.top3 >= 0.7) return `Three posts brought ${Math.round(c.top3 * 100)}% of your ${unit}.`;
  return '';
}
const BAR_LABEL = (k) => (k === 0 ? 'This week' : monDay(dayDate(weekWin(k).e)));
function details({ head, unit, sub = '', key, color, f = fmt, rowsMetric, rowsUnit, rowsTitle }) {
  const vals = [5, 4, 3, 2, 1, 0].map((k) => weekTotals(k)[key]);
  const max = Math.max(...vals);
  const c = rowsMetric ? contributors(rowsMetric, weekTotals(0)[key === 'net' ? 'net' : key]) : null;
  return {
    head, unit, sub, range: `${monDay(dayDate(weekWin(0).s))} – ${monDay(dayDate(weekWin(0).e))}`,
    chg: `${arrowPct(vals[5], vals[4])} vs previous 7 days`,
    bars: vals.map((v, i) => ({ h: `${Math.max(3, Math.round((v / max) * 52))}px`, v: f(v), d: BAR_LABEL(5 - i), col: i === 5 ? color : i === 4 ? '#c4c5ca' : '#e6e6ea' })),
    hasRows: !!c, rowsTitle: c ? rowsTitle : '', caption: c ? captionFor(rowsUnit, c) : '', rows: c ? c.rows : [],
  };
}

// 点选某一区后的说明：第一行分数，下面每个指标一行，带前后值（飞书《布局与 UI 细节优化方案》第 4 节）
const scoreLine = (a) => `score: ${a.prev} → ${a.you} (${signPts(a.you - a.prev)})`;
const metricLine = (label, prev, cur, f = fmtStat) => `${label}: ${f(prev)} → ${f(cur)} (${signPct(cur, prev)})`;
// 按每次播放打分的维度：说明行写打分用的比率（每千次播放），括号里是本周数量，和下方 Key metrics 对得上
const per1k = (w, k) => (w.views ? (w[k] / w.views) * 1000 : 0);
const rateLine = (label, unit, k, prev, cur) => `${label} per 1K views: ${per1k(prev, k).toFixed(1)} → ${per1k(cur, k).toFixed(1)} (${fmtStat(cur[k])} ${unit})`;
const lineFor = ([label, k, f, unit], prev, cur) => (unit ? rateLine(label, unit, k, prev, cur) : metricLine(label, prev[k], cur[k], f || fmtStat));

// ---------- 账号卡评分（Prompt 指南〇.3.6） ----------
// 分数 = 本周在「自己过去 12 个不重叠的 7 天」里的百分位（0–100）；前 7 天、14 天前的分数用各自之前的 12 周算，所以可以直接比。
// 比率先按 K = 100 次播放向自己的常态收缩；一个维度有多个指标时取百分位的平均。B 每项 = round(百分位 × 0.3)。
const HISTORY_WEEKS = 12, MIN_WEEKS = 4, K_VIEWS = 100;
const shrunk = (count, views, prior) => (count + prior * K_VIEWS) / (views + K_VIEWS);
export const A_DEFS = [
  { name: 'Views', metrics: [{ key: 'views' }] },
  { name: 'Engagement', metrics: [{ rate: 'likes' }, { rate: 'comments' }] },
  { name: 'Shares', metrics: [{ rate: 'shares' }] },
  { name: 'Visits', metrics: [{ rate: 'profile' }] },
  { name: 'Rewards', metrics: [{ key: 'rewards' }] },
];
export const B_DEFS = [
  { name: 'Views', metrics: [{ key: 'views' }, { key: 'newViewers' }] },
  { name: 'Engagement', metrics: [{ rate: 'likes' }] },
  { name: 'Followers', metrics: [{ key: 'net' }] },
];
function scoreWeek(k, defs) {
  const cur = weekTotals(k);
  const hist = Array.from({ length: HISTORY_WEEKS }, (_, j) => weekTotals(k + j + 1)).filter((w) => w.views > 0);
  if (hist.length < MIN_WEEKS) return defs.map(() => null); // E15：历史不足 4 周不出分
  const prior = (num) => hist.reduce((t, h) => t + h[num], 0) / Math.max(1, hist.reduce((t, h) => t + h.views, 0));
  const val = (w, m) => (m.rate ? shrunk(w[m.rate], w.views, prior(m.rate)) : w[m.key]);
  return defs.map((d) => mean(d.metrics.map((m) => percentile(val(cur, m), hist.map((h) => val(h, m))))));
}
export function accountScores(defs, scale = 100) {
  const conv = (x) => (x == null ? null : Math.round((x * scale) / 100));
  const [now, p1, p2] = [0, 1, 2].map((k) => scoreWeek(k, defs).map(conv));
  return Object.fromEntries(defs.map((d, i) => [d.name, { you: now[i], prev: p1[i], prev2: p2[i] }]));
}

// 结论句（模板，规则同 ACCOUNT_CARD_INSIGHT_SYSTEM）：点名最强与最弱；Rewards 是收入不是内容质量，不参与点名
const A_NOUN = { Views: 'Reach', Engagement: 'Engagement', Shares: 'Sharing', Visits: 'Profile visits' };
const A_REST = {
  Views: ' Open on the place and the payoff in the first second.',
  Engagement: ' Ask viewers one question they can answer in a word.',
  Shares: ' Test a format viewers would want to pass on.',
  Visits: ' End with a reason to check your other posts.',
};
function accountKeyA(areas) {
  const content = areas.filter((a) => a.name !== 'Rewards');
  const hi = content.reduce((a, b) => (b.you > a.you ? b : a)), lo = content.reduce((a, b) => (b.you < a.you ? b : a));
  if (areas.every((a) => Math.abs(a.you - a.prev) < 5)) return { key: 'Your areas held steady against the previous 7 days.', rest: A_REST[lo.name], lo };
  const verb = A_NOUN[hi.name].endsWith('s') ? 'are' : 'is';
  return { key: `${A_NOUN[hi.name]} ${verb} your strongest area, while ${A_NOUN[lo.name].toLowerCase()} trails.`, rest: A_REST[lo.name], lo };
}
const B_HI = { Views: 'Reach', Engagement: 'Engagement', Followers: 'Follower growth' };
const B_LO = { Views: 'reach', Engagement: 'engagement', Followers: 'new followers' };
const B_REST = {
  Views: ' Name the place in the first line of your caption.',
  Engagement: ' Give viewers a clear reason to react in your next post.',
  Followers: ' End by saying what the next post in the series is.',
};
function accountKeyB(areas) {
  const hi = areas.reduce((a, b) => (b.you > a.you ? b : a)), lo = areas.reduce((a, b) => (b.you < a.you ? b : a));
  if (areas.every((a) => Math.abs(a.you - a.prev) < 2)) return { key: 'Your three steps held steady against the previous 7 days.', rest: B_REST[lo.name] };
  if (hi.you <= 15) return { key: `All three steps are below a usual week, ${B_LO[lo.name]} most of all.`, rest: B_REST[lo.name] };
  return { key: `${B_HI[hi.name]} holds up best this week, while ${B_LO[lo.name]} trails.`, rest: B_REST[lo.name] };
}

// 选中某一维度后图下的一句话（Final 句式，2026-11-26 确认改回单句）：
// 「{维度} rose/fell x% from the previous 7 days, taking its score from p to n.」x 用该维度第一项指标的数量变化，和下方 Key metrics 的胶囊一致。
// 按每次播放打分的维度（Engagement / Shares / Visits），数量和分数方向相反时，句式不变，百分比换成每次播放的变化（2026-11-26 确认）：
// 「Visits rose 9.8% per view from the previous 7 days, taking its score from 67 to 100.」
const RATE_AREAS = new Set(['Engagement', 'Shares', 'Visits']);
function weekSentence(a, cur, prev, k) {
  const tail = `taking its score from ${a.prev} to ${a.you}.`;
  const say = (c, p, perView) => {
    const pct = Math.abs(((c - p) / p) * 100).toFixed(1);
    if (pct === '0.0') return `held steady against the previous 7 days, ${tail}`;
    return `${c > p ? 'rose' : 'fell'} ${pct}%${perView ? ' per view' : ''} from the previous 7 days, ${tail}`;
  };
  if (!prev[k]) return `is new this week, ${tail}`;
  const up = cur[k] > prev[k], sUp = a.you > a.prev;
  if (a.you !== a.prev && up !== sUp && RATE_AREAS.has(a.name) && per1k(prev, k)) return say(per1k(cur, k), per1k(prev, k), true);
  return say(cur[k], prev[k], false);
}

// ---------- 模块 A：Analytics › Overview ----------
// range 不是 7 天时返回 null：分数只按 7 天窗口定义（飞书 2.2 / 〇.3.6），卡片换成一句说明，不再显示 7 天样例
export function buildModuleA(range = { key: '7' }) {
  if (range?.key !== '7') return null;
  const cur = weekTotals(0), prev = weekTotals(1);
  const sc = accountScores(A_DEFS);
  if (Object.values(sc).some((x) => x.you == null || x.prev == null)) return null;
  const basis = Object.fromEntries(A0.areas.map((a) => [a.name, a.basis]));
  const area = (name, metrics, extra) => {
    const s = sc[name];
    const a = { name, you: s.you, prev: s.prev, prev2: s.prev2 ?? s.prev, basis: basis[name], ...extra };
    a.metrics = metrics.map(([label, k, f]) => ({ label, value: (f || fmtStat)(cur[k]), chg: arrowPct(cur[k], prev[k]), up: cur[k] >= prev[k] }));
    a.chg = a.metrics[0].chg; a.up = a.metrics[0].up;
    a.lines = [scoreLine(a), ...metrics.map((m) => lineFor(m, prev, cur))];
    a.note = a.lines.join(' · ');
    a.sentence = weekSentence(a, cur, prev, metrics[0][1]);
    return a;
  };
  const areas = [
    area('Views', [['Post views', 'views']], { dd: details({ head: fmtStat(cur.views), unit: 'post views', key: 'views', color: '#0d4a96', rowsMetric: 'views', rowsUnit: 'views', rowsTitle: 'Where views came from' }) }),
    // Engagement 的变化统一按 Likes 写（删掉合并口径的 −37.7%）
    area('Engagement', [['Likes', 'likes', null, 'likes'], ['Comments', 'comments', null, 'comments']], { dd: details({ head: fmtStat(cur.likes), unit: 'likes', sub: `${fmtStat(cur.comments)} comments`, key: 'likes', color: '#9cc8f6', rowsMetric: 'likes', rowsUnit: 'likes', rowsTitle: 'Where likes came from' }) }),
    area('Shares', [['Shares', 'shares', null, 'shares']], { dd: details({ head: fmtStat(cur.shares), unit: 'shares', key: 'shares', color: '#1e7ce8', rowsMetric: 'shares', rowsUnit: 'shares', rowsTitle: 'Where shares came from' }) }),
    area('Visits', [['Profile views', 'profile', null, 'profile views']], { dd: details({ head: fmtStat(cur.profile), unit: 'profile views', key: 'profile', color: '#5a9ff0' }) }),
    area('Rewards', [['Est. rewards', 'rewards', money]], { dd: details({ head: money(cur.rewards), unit: 'estimated rewards', key: 'rewards', color: '#1765c4', f: money }) }),
  ];
  const total = Math.round(mean(areas.map((a) => a.you))), prevTotal = Math.round(mean(areas.map((a) => a.prev))), prev2Total = Math.round(mean(areas.map((a) => a.prev2)));
  const { key, rest } = accountKeyA(areas);
  return {
    ...A0, total, prevTotal, prev2Total, areas, key, rest, askFor: 'A',
    info: [
      { icon: 'star', t: 'Overall score', lines: [`${total} out of 100, the average of the five areas`, `Previous 7 days: ${prevTotal} · 14 days ago: ${prev2Total}`] },
      { icon: 'insights', t: 'Compared with', lines: ['Your own last 12 weeks. Each week is ranked against the 12 weeks before it, so you can compare it with the previous 7 days.'] },
      { icon: 'info', t: 'Area scores', lines: ['100 means this was your best week of the 12, 0 your lowest. Likes, comments, shares and profile views count per view.'] },
    ],
    ui: { ...A0.ui, hint: 'Tap an area to compare it with the previous 7 days' }, cardTitle: 'Performance summary',
  };
}

// ---------- 模块 B：Analytics › Content ----------
export function buildModuleB(range = { key: '7' }) {
  if (range?.key !== '7') return null;
  const cur = weekTotals(0), prev = weekTotals(1);
  const sc = accountScores(B_DEFS, 30);
  if (Object.values(sc).some((x) => x.you == null || x.prev == null)) return null;
  const basis = Object.fromEntries(B0.areas.map((a) => [a.name, a.basis]));
  const { s, e } = weekWin(0);
  const newFollowers = Math.round(POSTS.reduce((t, p) => t + POST_METRIC.newFollowers(p, sum(p.daily, s, e)), 0));
  const area = (name, metrics, extra) => {
    const sco = sc[name];
    const a = { name, you: sco.you, prev: sco.prev, prev2: sco.prev2 ?? sco.prev, max: 30, basis: basis[name], ...extra };
    a.metrics = metrics.map(([label, k]) => ({ label, value: fmtStat(cur[k]), chg: arrowPct(cur[k], prev[k]), up: cur[k] >= prev[k] }));
    a.chg = a.metrics[0].chg; a.up = a.metrics[0].up;
    a.lines = [scoreLine(a), ...metrics.map((m) => lineFor(m, prev, cur))];
    a.note = a.lines.join(' · ');
    a.sentence = weekSentence(a, cur, prev, metrics[0][1]);
    return a;
  };
  const areas = [
    // New viewers 用和卡片同一个窗口（Nov 16 – Nov 22）；Viewers 页的 Key metrics 有 3 天延迟，是另一个窗口
    area('Views', [['Post views', 'views'], ['New viewers', 'newViewers']], { dd: details({ head: fmtStat(cur.views), unit: 'post views', sub: `${fmtStat(cur.newViewers)} new viewers`, key: 'views', color: '#0d4a96', rowsMetric: 'views', rowsUnit: 'views', rowsTitle: 'Where views came from' }) }),
    area('Engagement', [['Likes', 'likes', null, 'likes']], { dd: details({ head: fmtStat(cur.likes), unit: 'likes', key: 'likes', color: '#9cc8f6', rowsMetric: 'likes', rowsUnit: 'likes', rowsTitle: 'Where likes came from' }) }),
    area('Followers', [['Net followers', 'net']], { dd: { ...details({ head: fmtStat(cur.net), unit: 'net followers', sub: `${newFollowers} new followers, ${newFollowers - cur.net} unfollowed`, key: 'net', color: '#5a9ff0' }), ...(() => { const c = contributors('newFollowers', newFollowers); return { hasRows: true, rowsTitle: 'Where new followers came from', caption: captionFor('new followers', c), rows: c.rows }; })() } }),
  ];
  const sumOf = (k) => areas.reduce((t, a) => t + a[k], 0);
  const { key, rest } = accountKeyB(areas);
  return {
    ...B0, total: sumOf('you'), prevTotal: sumOf('prev'), prev2Total: sumOf('prev2'), areas, key, rest, askFor: 'B',
    info: [
      { icon: 'star', t: 'Overall score', lines: [`${sumOf('you')} out of 90, the three areas added up`, `Previous 7 days: ${sumOf('prev')} · 14 days ago: ${sumOf('prev2')}`] },
      { icon: 'insights', t: 'Compared with', lines: ['Your own last 12 weeks. Each week is ranked against the 12 weeks before it, so you can compare it with the previous 7 days.'] },
      { icon: 'info', t: 'Area scores', lines: ['Each area is out of 30: 30 means this was your best week of the 12, 0 your lowest. Engagement counts likes per view.'] },
    ],
    ui: { ...B0.ui, hint: 'Tap an area to compare it with the previous 7 days' }, cardTitle: 'Content summary',
  };
}

// ---------- 模块 E：我的作品 › Overview（这条 vs 你的同类作品） ----------
const E_WINDOW_MAX = 30; // 发布超过 30 天的作品，按发布后前 30 天比，避免同类作品不够 5 条
const rateOf = (p, k) => ({ likes: p.likeRate, comments: p.commentRate, shares: p.shareRate, saves: p.saveRate, follow: p.newFollowers / Math.max(1, p.views) }[k]);
export function comparablePosts(p, window, { sameBucket = true } = {}) {
  return POSTS.filter((q) => q !== p && q.privacy === 'everyone' && ageOf(q) >= window && (!sameBucket || durationBucket(q.duration) === durationBucket(p.duration)))
    .sort((a, b) => b.pubIdx - a.pubIdx).slice(0, 30);
}
function biggestDrop(ret) {
  let d = 0, at = 0;
  for (let i = 1; i < (ret?.length || 0); i++) { const x = ret[i - 1] - ret[i]; if (x > d) { d = x; at = i; } }
  return at;
}
export const dropMoment = (p) => secToClock(Math.max(1, biggestDrop(p.retention))).replace(/^0/, '');

const E_HI = { Reach: null, Retention: 'held viewers longer', Likes: 'got more likes per view', Shares: 'got more shares and saves', Follows: 'won more followers per view' };
const E_LO = { Reach: 'reached fewer viewers', Retention: 'fewer watched to the end', Likes: 'drew fewer likes per view', Shares: 'got fewer shares and saves', Follows: 'won fewer followers per view' };
const E_LO_ONLY = { Reach: 'This post reached fewer viewers than usual.', Retention: 'Fewer viewers watched this post to the end.', Likes: 'This post drew fewer likes per view than usual.', Shares: 'This post got fewer shares and saves than usual.', Follows: 'This post won fewer followers per view than usual.' };

export function buildModuleE(p) {
  if (!p || !p.daily || !p.retention) return null;
  const age = ageOf(p);
  if (age < 1) return null;
  const W = Math.min(age, E_WINDOW_MAX);
  const comp = comparablePosts(p, W);
  if (comp.length < 5) return null; // E16：同类作品不足 5 条，不出卡
  const v = viewsAtAge(p, W), vs = comp.map((q) => viewsAtAge(q, W));
  const H = (f) => comp.map(f);
  const pc = (x, hist) => percentile(x, hist);
  const r1 = (x) => (x * 1000).toFixed(1);
  const tv = median(vs);
  const wl = W < age ? `, first ${W} days` : '';
  const defs = [
    { name: 'Reach', parts: [[v, vs]], lines: [`Video views${wl}: ${fmt(v)} against ${fmt(tv)}`], metrics: [{ label: 'Video views', value: fmt(v) }] },
    { name: 'Retention', parts: [[p.avgPct, H((q) => q.avgPct)], [p.watchedFull, H((q) => q.watchedFull)]],
      lines: [`Watched full video: ${(p.watchedFull * 100).toFixed(1)}% against ${(median(H((q) => q.watchedFull)) * 100).toFixed(1)}%`, `Average watched: ${Math.round(p.avgPct * 100)}% against ${Math.round(median(H((q) => q.avgPct)) * 100)}%`],
      metrics: [{ label: 'Watched full video', value: `${(p.watchedFull * 100).toFixed(1)}%` }, { label: 'Average watch time', value: `${p.avgWatch}s` }] },
    // 2026-11-26 独立评审：点赞和评论合成一个分会掩盖差距（每千次点赞 −55%，合成分却是 43「持平」），Likes 只按每次播放的点赞打分，评论保留在说明行
    { name: 'Likes', parts: [[p.likeRate, H((q) => q.likeRate)]],
      lines: [`Likes per 1K views: ${r1(p.likeRate)} against ${r1(median(H((q) => q.likeRate)))}`, `Comments per 1K views: ${r1(p.commentRate)} against ${r1(median(H((q) => q.commentRate)))}`],
      metrics: [{ label: 'Likes', value: fmt(p.likes) }, { label: 'Comments', value: fmt(p.comments) }] },
    { name: 'Shares', parts: [[p.shareRate, H((q) => q.shareRate)], [p.saveRate, H((q) => q.saveRate)]],
      lines: [`Shares per 1K views: ${r1(p.shareRate)} against ${r1(median(H((q) => q.shareRate)))}`, `Favorites per 1K views: ${r1(p.saveRate)} against ${r1(median(H((q) => q.saveRate)))}`],
      metrics: [{ label: 'Shares', value: fmt(p.shares) }, { label: 'Favorites', value: fmt(p.saves) }] },
    { name: 'Follows', parts: [[rateOf(p, 'follow'), H((q) => rateOf(q, 'follow'))]],
      lines: [`New followers per 1K views: ${r1(rateOf(p, 'follow'))} against ${r1(median(H((q) => rateOf(q, 'follow'))))}`],
      metrics: [{ label: 'New followers', value: fmt(p.newFollowers) }] },
  ];
  // 一句话用该维度第一项和典型作品比；两项方向相反、分数跟着第二项走时，把第二项也写进去
  const E_PART = { Reach: ['views'], Retention: ['average watched', 'full watches'], Likes: ['likes per view', 'comments per view'], Shares: ['shares per view', 'favorites per view'], Follows: ['new followers per view'] };
  const typicalSentence = (d, you) => {
    const [[x, h]] = d.parts, t = median(h), pct = t ? ((x - t) / t) * 100 : 0, tail = `taking its score from 50 to ${you}.`;
    const r = t ? x / t : 1; // 高出 2 倍以上写成倍数（5506.5% 读不出来）
    const lead = Math.abs(pct) < 0.05 ? 'is in line with your typical post' : r >= 3 ? `is ${r >= 10 ? Math.round(r) : r.toFixed(1)}× your typical post` : `is ${Math.abs(pct).toFixed(1)}% ${pct > 0 ? 'above' : 'below'} your typical post`;
    const names = E_PART[d.name] || [];
    if (d.parts.length > 1 && you !== 50 && (pct > 0) !== (you > 50) && Math.abs(pct) >= 0.05) return `${lead} in ${names[0]}, but ${you > 50 ? 'higher' : 'lower'} in ${names[1]}, ${tail}`;
    return `${lead}, ${tail}`;
  };
  const areas = defs.map((d) => {
    const you = Math.round(mean(d.parts.map(([x, h]) => pc(x, h))));
    const a = { name: d.name, you, prev: 50, prev2: 50, metrics: d.metrics, basis: E0.areas.find((x) => x.name === d.name)?.basis };
    a.lines = [`score: ${you} against 50 for your typical post`, ...d.lines];
    a.note = a.lines.join(' · ');
    a.sentence = typicalSentence(d, you);
    return a;
  });
  const total = Math.round(mean(areas.map((a) => a.you)));
  // 结论句：和典型作品差得最多的两头（〇.8）；分数按 〇.3.6 分档，≥ 60 算高、≤ 40 算低
  const hi = areas.reduce((a, b) => (b.you > a.you ? b : a)), lo = areas.reduce((a, b) => (b.you < a.you ? b : a));
  const ratio = tv ? v / tv : 1;
  const hiPhrase = (a) => (a.name === 'Reach' ? (ratio >= 2.5 ? `reached ${Math.round(ratio)}× your usual viewers` : ratio >= 1.8 ? 'reached twice your usual viewers' : 'reached more viewers than usual') : E_HI[a.name]);
  let key;
  if (hi.you >= 60 && lo.you <= 40) key = `This post ${hiPhrase(hi)}, but ${E_LO[lo.name]}.`;
  else if (hi.you >= 60) key = `This post ${hiPhrase(hi)}${hi.name === 'Reach' ? '' : ' than usual'}.`;
  else if (lo.you <= 40) key = E_LO_ONLY[lo.name];
  else key = 'This post performed like your typical post.';
  const n = comp.length;
  return {
    ...E0, cardTitle: 'Post summary', total, prevTotal: 50, prev2Total: 50, areas, key, rest: ` Most viewers left at ${dropMoment(p)}.`,
    ui: {
      ...E0.ui,
      info: [
        { ic: 'insights', t: 'Compared with', lines: [`Your typical post: the middle of your ${n} public posts ${BUCKET_WORDS[durationBucket(p.duration)]}, each over its first ${W} day${W > 1 ? 's' : ''}.`] },
        { ic: 'info', t: 'Area scores', lines: ['Each area ranks this post among those posts, from 0 to 100. Your typical post scores 50.'] },
      ],
    },
  };
}

// ---------- 评论 AI 话题（原在 Subflows.jsx，搬到这里让模块 D 和 S1 卡引用同一份） ----------
const TOPIC_POOL = [
  ['Asking for the itinerary', 'itinerary'], ['Budget questions', 'budget'], ['Wanting a part 2', 'part 2'], ['Praise for the editing', 'edit'],
  ['Questions about crowds', 'crowds'], ['Tagging friends to go together', 'trip'],
];
export function commentTopics(seed, comments) {
  if (comments < 50) return null;
  const n = 3 + (seed % 3);
  return TOPIC_POOL.slice(seed % 2, seed % 2 + n).map(([t, k], i) => [t, k, Math.max(2, Math.round(comments * (0.32 - i * 0.06)))]);
}
// 他人作品 Analysis 弹层里 Comment topics 用的种子（US.jsx AnalysisSheet）
export const otherPostTopics = (item) => commentTopics(item.id.length + item.comments, item.comments);

// ---------- 模块 D：别人的作品 › Post（对方 vs 你的同类作品） ----------
// Final（Version 216）：每行一种蓝（色相不同），参照条用同一个蓝的 35% 浅色调
const D_COLORS = [['#0d4a96', '#aac0da'], ['#1e7ce8', '#b0d1f7'], ['#12a4d9', '#acdff2'], ['#5a9ff0', '#c5ddfa']];
// Comment topics 弹层里的话题名 → 结论句里的短说法
const TOPIC_SHORT = { itinerary: 'the itinerary', budget: 'the budget', 'part 2': 'a part 2', edit: 'the editing', crowds: 'crowds', trip: 'trips with friends' };
export function buildModuleD(item, { topics = null, words = [] } = {}) {
  if (!item) return null;
  const age = Math.max(1, item.postedDaysAgo);
  // INSPIRATION 没有时长字段，所以同类作品不分时长档（飞书 §5 的时长档要等对方时长接入）
  const comp = POSTS.filter((q) => q.privacy === 'everyone' && ageOf(q) >= age);
  const per1k = (n) => (n / item.views) * 1000;
  const mine = (f) => median(comp.map(f));
  const rows0 = [
    { key: 'views', label: 'Views', a: item.views, b: mine((q) => viewsAtAge(q, age)), f: fmt },
    { key: 'likes', label: 'Likes per 1K views', noun: 'likes', a: per1k(item.likes), b: mine((q) => q.likeRate * 1000), f: (x) => x.toFixed(1) },
    { key: 'comments', label: 'Comments per 1K views', noun: 'comments', a: per1k(item.comments), b: mine((q) => q.commentRate * 1000), f: (x) => x.toFixed(1) },
    { key: 'favorites', label: 'Favorites per 1K views', noun: 'favorites', a: per1k(item.saves), b: mine((q) => q.saveRate * 1000), f: (x) => x.toFixed(1) },
  ];
  const rows = rows0.map((r, i) => {
    const m = Math.max(r.a, r.b) || 1;
    return { label: r.label, val: r.f(r.a), yv: r.f(r.b), yours: `Yours ${r.f(r.b)}`, c: D_COLORS[i][0], yc: D_COLORS[i][1], w: `${((r.a / m) * 62).toFixed(1)}%`, yw: `${((r.b / m) * 62).toFixed(1)}%` };
  });
  // 播放量取决于账号大小，最大差距只在三个「每千次播放」里选
  const rated = rows0.slice(1).map((r) => ({ ...r, gap: Math.max(r.a / r.b, r.b / r.a) }));
  const g = rated.reduce((a, b) => (b.gap > a.gap ? b : a));
  let key;
  if (g.gap < 1.1) key = 'This post’s rates are close to your typical post.';
  else if (g.a > g.b) key = `This post gets ${g.gap.toFixed(1)}× your ${g.noun} per view.`;
  else key = `This post gets fewer ${g.noun} per view than your typical post.`;
  let rest = '';
  if (topics && topics.length >= 2) rest = ` Top comment topics: ${TOPIC_SHORT[topics[0][1]] || topics[0][0]} and ${TOPIC_SHORT[topics[1][1]] || topics[1][0]}.`;
  else if (words.length) rest = ` Top word in comments: “${words[0][0]}”.`;
  return {
    id: item.id, creator: item.creator, cardTitle: 'Compared with your posts', key, rest, rows, ratio: { noun: g.noun, gap: g.gap, ahead: g.a > g.b }, ask: askD(item, topics),
    info: [
      { t: 'This post', lines: [`Public data since it was posted, ${age} day${age > 1 ? 's' : ''} ago.`], i_play: true },
      { t: 'Your typical post', lines: [`The middle of your ${comp.length} public posts, each over its first ${age} day${age > 1 ? 's' : ''}.`], i_people: true },
    ],
  };
}

// ---------- 模块 C：Topic search ----------
const POP_PHRASE = (n) => (n >= 60 ? 'in demand right now' : n >= 40 ? 'steady interest' : 'a niche topic');
// 2026-11-26 独立评审：Relevance to you 衡量的是和创作者内容的贴合，不是观众，≥ 70 改为 fits your content
const REL_PHRASE = (n) => (n >= 70 ? 'fits your content' : n >= 50 ? 'close to what you post' : 'far from what you usually post');
// 2026-11-26 独立评审：36 分写成「few creators cover it」偏乐观，分档改为 ≤ 25 / ≤ 45 / < 70 / ≥ 70
const COMP_PHRASE = (n) => (n <= 25 ? 'few creators cover it' : n <= 45 ? 'room for new creators' : n < 70 ? 'some creators cover it' : 'crowded, so pick a clear angle');
export const TOPIC_PHRASES = { pop: POP_PHRASE, rel: REL_PHRASE, comp: COMP_PHRASE };
const DOC_TOPIC = 'live shop sale'; // 飞书画板的演示话题：62 / 78 / 36，子话题 43 / 32 / 21 / 4
export function buildModuleC(q, ins) {
  const isDoc = q.trim().toLowerCase() === DOC_TOPIC;
  const travel = /travel|trip|itinerar|pack|hik|kyoto|tokyo|flight|hotel|beach|city|budget|amalfi|lisbon|bali|milan|paris/i.test(q);
  const pop = isDoc ? 62 : ins.pop, comp = isDoc ? 36 : ins.comp, rel = isDoc ? 78 : ins.rel; // 与 V4.jsx aiInsight 同值
  let key, rest;
  if (isDoc) { key = C0.key; rest = C0.rest; }
  else {
    if (rel >= 70) key = comp <= 40 ? 'This topic fits your content and has room to explore.' : comp >= 70 ? 'This topic fits your content, but many creators cover it.' : 'This topic fits your content, and some creators cover it.';
    else if (rel >= 50) key = comp <= 40 ? 'This topic is close to what you post and has room.' : 'This topic is close to what you post, with competition.';
    else key = 'This topic is far from what you usually post.';
    rest = rel >= 50 ? ` Try it through your usual ${travel ? 'itinerary' : 'review'} format.` : ' Only try it if you can tie it to travel.';
  }
  const rows = C0.rows.map((r) => {
    const score = r.name === 'Popularity' ? pop : r.name === 'Competition' ? comp : rel;
    const phrase = r.name === 'Popularity' ? POP_PHRASE(score) : r.name === 'Competition' ? COMP_PHRASE(score) : REL_PHRASE(score);
    return { ...r, score, note: `is ${score}: ${phrase}.` };
  });
  return { ...C0, key, rest, rows };
}

// ---------- S1 Curated for me ----------
export const SIMILAR_POST_ID = 'insp3'; // budgetroutes：A week in Portugal for $250, full receipts
export function buildCurated(base, { similarTopics } = {}) {
  if (similarTopics === undefined) similarTopics = otherPostTopics(INSPIRATION.find((x) => x.id === SIMILAR_POST_ID));
  const kyoto = POSTS.find((p) => p.coverText === 'KYOTO AT DUSK');
  const pub = POSTS.filter((p) => p.privacy === 'everyone');
  const isKyoto = (p) => /kyoto/i.test(p.title);
  const kMed = median(pub.filter(isKyoto).map((p) => p.views)), rMed = median(pub.filter((p) => !isKyoto(p)).map((p) => p.views));
  const ferry = POSTS.find((p) => p.coverText === 'TAKE THE FERRY');
  const simItem = INSPIRATION.find((x) => x.id === SIMILAR_POST_ID);
  const sim = buildModuleD(simItem, { topics: similarTopics === undefined ? otherPostTopics(simItem) : similarTopics });
  const cards = base.cards.map((c) => {
    if (c.k === 'past') return { ...c, rows: [
      { ...c.rows[0], t: `${fmt(kyoto.views)} views since ${monDay(kyoto.publishedAt)}, best this week.` },
      { ...c.rows[1], t: `Top word in comments: “${kyoto.topWords[0]}”.` },
      { ...c.rows[2], t: `Kyoto posts ${fmt(kMed)} views, the rest ${fmt(rMed)}.` },
    ] };
    if (c.k === 'trend') {
      const C = buildModuleC(DOC_TOPIC, {});
      const [pp, rr, cc] = C.rows;
      return { ...c, rows: [
        { ...c.rows[0], b: `Popularity ${pp.score}: `, t: `${POP_PHRASE(pp.score)}.` },
        { ...c.rows[1], b: `Relevance to you ${rr.score}: `, t: `${REL_PHRASE(rr.score)}.` },
        { ...c.rows[2], b: `Competition ${cc.score}: `, t: `${COMP_PHRASE(cc.score)}.` },
      ] };
    }
    if (c.k === 'similar') {
      const k2 = similarTopics && similarTopics.length >= 2 ? [similarTopics[0][1], similarTopics[1][1]] : null;
      const t2 = !k2 ? c.rows[1].t : k2.join() === 'itinerary,budget' ? 'Its viewers ask for the itinerary and budget.' : `Top comment topics: ${TOPIC_SHORT[k2[0]]}, ${TOPIC_SHORT[k2[1]]}.`;
      return { ...c, rows: [
        { ...c.rows[0], t: `A budget post got ${sim.ratio.gap.toFixed(1)}× your ${sim.ratio.noun} per view.` },
        { ...c.rows[1], t: t2 },
        { ...c.rows[2], t: `Your “Amalfi by ferry” has ${fmt(ferry.views)} views.` },
      ] };
    }
    return c;
  });
  return { ...base, cards };
}

// ---------- Creator Assistant：作品表现回答（每条作品各自的数据） ----------
export function videoAnswer(p) {
  const title = nameOf(p);
  const age = ageOf(p);
  const hourly = age <= 2;
  // 曲线：发布 2 天内按小时（0h – 当前小时数），之后按发布后前 7 天
  const hoursOld = Math.max(1, Math.floor((new Date(2026, 10, 22, 16, 15) - p.publishedAt) / 3600000));
  const pts = hourly ? p.hourly.slice(0, Math.min(p.hourly.length, hoursOld + 1)) : Array.from({ length: Math.min(7, age) }, (_, i) => p.daily[p.pubIdx + i] || 0);
  const max = Math.max(...pts) || 1;
  const top = Math.ceil(max / 3 / (max > 3000 ? 100 : 10)) * (max > 3000 ? 100 : 10) * 3;
  const X0 = 48, X1 = 620, BASE = 897, TOP = 662, VB = 640;
  const x = (i) => X0 + ((X1 - X0) * i) / Math.max(1, pts.length - 1), y = (val) => BASE - ((BASE - TOP) * val) / top;
  const grid = [TOP, TOP + (BASE - TOP) / 3, TOP + (2 * (BASE - TOP)) / 3].map((g) => Math.round(g));
  const lab = (g) => Math.round(((g - VB) / 260) * 124 - 7.5);
  const pt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 1e4 ? 0 : 1)}K` : String(Math.round(n)));
  return {
    from: `From Video analysis · ${title}`,
    question: 'How’s my video performance?',
    headline: `Most viewers leave “${title}” at ${dropMoment(p)}.`,
    bullets: [
      `Viewers watched ${Math.round(p.avgPct * 100)}% of it on average.`,
      `${(p.watchedFull * 100).toFixed(1)}% watched to the end.`,
      'Show the payoff in the first second of your next post.',
    ],
    module: {
      type: 'videoMetrics', title: 'Key metrics', sub: age <= 7 ? 'Updated in real time.' : `Updated on ${monDay(dayDate(PERIOD_END - 1))}.`,
      tiles: [
        { label: 'Video views', value: String(Math.round(p.views)), on: true },
        { label: 'Total play time', value: (() => { const s = p.views * p.avgWatch; return `${Math.floor(s / 3600)}h:${Math.floor((s % 3600) / 60)}m:${Math.floor(s % 60)}s`; })() },
        { label: 'Average watch time', value: `${p.avgWatch}s` },
        { label: 'Watched full video', value: `${(p.watchedFull * 100).toFixed(2)}%` },
        { label: 'New followers', value: fmt(p.newFollowers) },
      ],
      chart: {
        viewBox: '48 640 572 260', grid, base: BASE, x: [X0, X1],
        yLabels: [[pt(top), lab(grid[0])], [pt((top * 2) / 3), lab(grid[1])], [pt(top / 3), lab(grid[2])]],
        xLabels: hourly ? ['0h', `${pts.length - 1}h`] : ['Day 1', `Day ${pts.length}`],
        points: pts.map((val, i) => `${Math.round(x(i))},${Math.round(y(val))}`).join(' '),
      },
    },
    chips: ['Help me write a stronger hook', 'Where else do viewers leave?'],
  };
}

// ---------- Creator Assistant：从 Overview（模块 A）进入时的回答 ----------
// 跟着卡片走：卡片说哪一项最弱，回答就从哪一项开始（〇.11：回答第一句不能和卡片的 key 矛盾）
const SUMMARY_Q = { Views: 'How can I reach more people?', Engagement: 'How can I get more people to react?', Shares: 'How can I get more shares?', Visits: 'How can I get more profile visits?' };
const SUMMARY_ACTIONS = {
  Views: ['Name the place in the first line of your caption.', 'Post while your viewers are most active.'],
  Engagement: ['Ask viewers one question they can answer in a word.', 'Pin a comment that asks where they would go next.'],
  Shares: ['Ask viewers to send it to the friend they would go with.', 'Pin a comment that asks who they would take.'],
  Visits: ['End with a reason to check your other posts.', 'Point to a playlist in your caption.'],
};
export function summaryAnswer() {
  const A = buildModuleA({ key: '7' });
  if (!A) return null;
  const cur = weekTotals(0), prev = weekTotals(1);
  const content = A.areas.filter((a) => a.name !== 'Rewards');
  const lo = content.reduce((a, b) => (b.you < a.you ? b : a)), hi = content.reduce((a, b) => (b.you > a.you ? b : a));
  const chg = (k) => signPct(cur[k], prev[k]);
  const fell = (k) => (cur[k] < prev[k] ? 'fell' : 'rose');
  const bullets = [];
  if (lo.name === 'Engagement') {
    bullets.push(`Likes ${fell('likes')} ${chg('likes').replace(/^[+−]/, '')} to ${fmtStat(cur.likes)}, while views ${fell('views')} ${chg('views').replace(/^[+−]/, '')}.`);
    bullets.push(`That is ${per1k(cur, 'likes').toFixed(1)} likes per 1K views, down from ${per1k(prev, 'likes').toFixed(1)}.`);
    const c = contributors('likes', cur.likes);
    if (c.rows[0]) bullets.push(`${nameOf(POSTS.find((p) => p.id === c.rows[0].postId))} got ${c.rows[0].val} of your ${fmtStat(cur.likes)} likes.`);
  } else {
    bullets.push(`${lo.name} score went from ${lo.prev} to ${lo.you} this week.`);
    bullets.push(lo.lines[1]);
  }
  if (hi.name !== lo.name) bullets.push(`${A_NOUN[hi.name]} ${A_NOUN[hi.name].endsWith('s') ? 'are' : 'is'} your strongest area at ${hi.you}.`);
  bullets.push(...SUMMARY_ACTIONS[lo.name]);
  return {
    from: 'From Performance summary',
    question: SUMMARY_Q[lo.name],
    headline: `${lo.name} is your lowest area this week, so start there.`,
    bullets,
    module: { type: 'performanceSummary', title: 'Performance summary' },
    chips: ['Why did my likes drop?', 'When should I post?'],
  };
}

// ---------- Creator Assistant 入口文案（2026-11-26） ----------
// 首页：5–10 条功能亮点式的问题轮播；模块卡：3–5 条和这张卡相关的问题，选中图上某一项时换成这一项的问题。
// 每条问题在对话页都有按数据生成的回答（screens/Subflows.jsx answer / kindFor）。
const pctAbs = (cur, prev) => `${Math.abs(((cur - prev) / prev) * 100).toFixed(1)}%`;
export const latestPost = () => POSTS.filter((p) => p.privacy === 'everyone').reduce((a, b) => (b.pubIdx > a.pubIdx ? b : a));
export const postName = (p) => nameOf(p);
export function homePrompts() {
  const cur = weekTotals(0), prev = weekTotals(1);
  return [
    'Check today’s performance',
    'Check your weekly performance',
    cur.likes < prev.likes ? 'Why did my likes drop this week?' : 'What got more people to like my posts?',
    'What should I post next?',
    `How’s “${nameOf(latestPost())}” doing?`,
    'When are my viewers most active?',
    'Where do my views come from?',
    'Am I on track for Creator Rewards?',
  ];
}
export function askA() {
  const cur = weekTotals(0), prev = weekTotals(1);
  return {
    // 未选中时仍轮播（2026-11-26 确认保留），第一条是页面级问题
    prompts: ['What should I work on first?', cur.likes < prev.likes ? 'Why did my likes drop this week?' : 'What got more people to like my posts?', 'Compare this week with last week', 'Which post did best this week?'],
    // 选中某一维度后停在这一条（评分图联动 2026-11-26）；Engagement 以第一项 Likes 为焦点
    byArea: {
      Views: 'Which posts drove views?',
      Engagement: cur.likes < prev.likes ? 'Why did my engagement drop?' : 'What lifted my engagement?',
      Shares: 'How can I get more shares?',
      Visits: 'How can I get more profile visits?',
      Rewards: 'How are my rewards worked out?',
    },
  };
}
export function askB() {
  const cur = weekTotals(0), prev = weekTotals(1);
  return {
    prompts: ['Which post brought the most views?', 'How can I get more people to react?', 'Which post brought the most new followers?'],
    byArea: {
      Views: 'Which posts drove views?',
      Engagement: cur.likes < prev.likes ? 'Why did my engagement drop?' : 'What lifted my engagement?',
      Followers: 'Which posts brought new followers?',
    },
  };
}
export function askE(p, E) {
  const drop = dropMoment(p);
  const sc = Object.fromEntries((E?.areas || []).map((a) => [a.name, a.you]));
  const mf = (n) => ((sc[n] ?? 50) >= 50 ? 'more' : 'fewer');
  return {
    prompts: [`Why do viewers leave at ${drop}?`, 'How does this compare with my typical post?', 'Where did this post’s views come from?'],
    byArea: {
      Reach: 'Where did this post’s views come from?',
      Retention: `Why do viewers leave at ${drop}?`,
      Likes: `Why did this get ${mf('Likes')} likes per view?`,
      Shares: `Why did this get ${mf('Shares')} shares and saves?`,
      Follows: `Why did this bring ${mf('Follows')} new followers?`,
    },
  };
}
export function askD(item, topics) {
  const t = topics && topics[0];
  return {
    prompts: ['What can I learn from this post?', t ? `Why do viewers ask about ${TOPIC_SHORT[t[1]] || t[0].toLowerCase()}?` : 'What do viewers say in the comments?', 'How could I try this in my next post?'],
  };
}

// ---------- 收益拆分（Rewards analytics 和 Assistant 共用，保证两边金额一致） ----------
// Creator Rewards 只算时长 ≥ 60 秒的作品（seed.js 同一系数 0.0009 / 播放），其余是 LIVE Gifts 等小额来源
export function rewardsSplit(days) {
  const s0 = PERIOD_END - days + 1;
  const total = Math.round(sum(DAILY.rewards, s0, PERIOD_END) * 100) / 100;
  const posts = POSTS.filter((p) => p.duration >= 60).map((p) => ({ post: p, value: sum(p.daily, s0, PERIOD_END) * 0.0009 })).sort((a, b) => b.value - a.value);
  const crp = Math.round(Math.min(total, posts.reduce((t, x) => t + x.value, 0)) * 100) / 100;
  return { total, crp, gifts: Math.round((total - crp) * 100) / 100, posts: posts.filter((x) => x.value >= 0.005) };
}

// ---------- S5 Viewers / Followers：一句话洞察（Final FIN-S5-Audience-Page · IMS5-Insight） ----------
// 数字和同页 Key metrics、Viewer insights、Most active times 用同一份数据；日期跟着 Key metrics 的下拉
import { VIEWERS_LAG, FOLLOWER_INSIGHTS, ACTIVE_DAYS, activeHours } from '../data/seed.js';
import { viewerKpis, followerKpis, rangeLabel, rangeDays, rangeIdx } from '../data/agg.js';
const WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const IN_N = ['', 'One in ten', 'Two in ten', 'Three in ten', 'Four in ten', 'Half', 'Six in ten', 'Seven in ten', 'Eight in ten', '9 in 10', 'Nearly all'];
const partOfDay = (h) => (h < 5 ? 'nights' : h < 12 ? 'mornings' : h < 17 ? 'afternoons' : h < 22 ? 'evenings' : 'nights');
// Most active times 的 Days 图从 7 天前排起（seed.js ACTIVE_DAYS 第 0 项 = 7 天前那天）
export function mostActive() {
  const di = ACTIVE_DAYS.indexOf(Math.max(...ACTIVE_DAYS));
  const day = WEEK_FULL[dayDate(PERIOD_END - 6 + di).getDay()];
  const off = 6 - di, hours = activeHours(off), peak = hours.indexOf(Math.max(...hours));
  return { day, peak, part: partOfDay(peak) };
}
export function buildAudience(tab, range = { key: '7' }) {
  const days = rangeDays(range);
  const span = range.key === 'custom' ? `${days} days` : `${days} days`;
  if (tab === 'viewers') {
    const [tv, nv] = viewerKpis(range);
    const share = nv.value / tv.value, tenths = Math.round(share * 10);
    const lead = tenths >= 10 ? 'Nearly all' : tenths === 9 ? '9 in 10' : IN_N[tenths];
    const ma = mostActive();
    return {
      cardTitle: 'Viewer summary',
      key: `${lead} of your viewers were new to you.`,
      rest: ` They were most active on ${ma.day} ${ma.part}.`,
      info: [
        { ic: 'people', t: 'New viewers', lines: [`${Math.round(nv.value).toLocaleString('en-US')} of ${Math.round(tv.value).toLocaleString('en-US')} viewers were new.`, `${rangeLabel(range, VIEWERS_LAG)}.`] },
        { ic: 'clock', t: 'Most active times', lines: [`${ma.day} had the most activity.`, `${rangeLabel({ key: '7' })}.`] },
      ],
    };
  }
  const [, net] = followerKpis(range);
  const prev = net.value - net.delta, diff = net.value - prev;
  const f = Object.fromEntries(FOLLOWER_INSIGHTS.Gender);
  const women = f.Female;
  const womenLine = women >= 0.6 && women < 0.7 ? 'Two in three of your followers are women.' : `${Math.round(women * 100)}% of your followers are women.`;
  const { s, e } = rangeIdx(range), len = e - s + 1;
  const prevLabel = `${monDay(dayDate(s - len))} – ${monDay(dayDate(s - 1))}`;
  return {
    cardTitle: 'Follower summary',
    key: `${net.value >= 0 ? `Your followers grew by ${net.value}` : `You lost ${-net.value} followers`} in the last ${span}, ${diff === 0 ? `the same as the ${span} before` : `${Math.abs(diff)} ${diff < 0 ? 'fewer' : 'more'} than the ${span} before`}.`,
    rest: ` ${womenLine}`,
    info: [
      { ic: 'follow', t: 'Net followers', lines: ['Followers gained minus followers lost.', `${rangeLabel(range)}: ${net.value}.`, `${prevLabel}: ${prev}.`] },
      { ic: 'pie', t: 'Follower gender', lines: [`Female ${Math.round(f.Female * 100)}%, male ${Math.round(f.Male * 100)}%, other ${Math.round(f.Other * 100)}%.`] },
    ],
  };
}

// ---------- AI 结论句（2026-11-26，prompt_pack）----------
// 上面各模块照常用模板算出 key / rest；这里在最后一步换成 AI 生成的句子（./ai/insights.en-US.js），
// 只在快照对应的同一对象上替换，其他情况保留模板。用包装而不改各模块函数体，避免和别的改动冲突。
{
  const A = buildModuleA, Bm = buildModuleB, C = buildModuleC, D = buildModuleD, E = buildModuleE, Cu = buildCurated, Sa = summaryAnswer;
  buildModuleA = (range) => withAI('performance_summary', A(range));
  buildModuleB = (range) => withAI('content_summary', Bm(range));
  buildModuleC = (q, ins) => withAI('topic_search', C(q, ins), String(q || '').trim().toLowerCase());
  // D 的 AI 句是按评论话题写的，所以只在显示评论话题时使用
  buildModuleD = (item, opts = {}) => withAI('other_post', D(item, opts), item && opts.topics && opts.topics.length >= 2 ? `other:${item.id}` : null);
  buildModuleE = (p) => withAI('post_overview', E(p), p ? `post:${p.id}` : null);
  buildCurated = (base, opts) => { const r = Cu(base, opts); return { ...r, cards: r.cards.map(curatedWithAI) }; };
  summaryAnswer = () => summaryWithAI(Sa());
}
