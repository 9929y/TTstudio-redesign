// 2026-11-26 数据对齐：AI 模块里的每个数字都从 seed.js / agg.js 现算，和页面下方的 KPI、榜单、作品详情用同一份数据。
// 规则来源（飞书）：
// - 《AI Insights 信息架构与数据证据设计》§2.2 账号卡只和自己的前 7 天比；§2.4 Details；§5 和别人比（你的同类作品中位数）
// - 《AI insight 与 AI 内容的 Prompt 设计指南》〇.3.6 评分公式（百分位、同类作品 = 同时长档 + 同发布后窗口、至少 5 条、典型作品 = 50）
// - 《布局与 UI 细节优化方案》第 4 节：评分变化写 pts，指标变化写 % 并带前后值，分两行；Engagement 统一按 Likes −38.2%
// 2026-11-26 Yanice 确认：A、B 的分数也按〇.3.6 公式现算（本周在自己过去 12 周里的百分位），不再用画板演示分。
// 2026-11-27 Yanice 改：A、B、E 三张卡都改成和同类创作者比（同类别 + 同粉丝量级 + 同地区，见 data/peers.js），
// 不再和自己的前 7 天 / 自己的作品比；典型同类 = 50，虚线画的就是这个 50。上面「§2.2 只和自己的前 7 天比」作废。
import { DAILY, POSTS, PERIOD_END, INSPIRATION, dayDate, rng, NOW } from '../data/seed.js';
import { COHORT, PEER_WEEKS, PEER_POSTS, peerViewsAtAge } from '../data/peers.js';
import { TOPICS } from '../data/trending.js';
import { fmt, fmtStat, monDay, monDayYear, secToClock } from '../data/agg.js';
import { moduleA as A0 } from './demo/moduleA.js';
import { moduleB as B0 } from './demo/moduleB.js';
import { moduleC as C0 } from './demo/moduleC.js';
import E0 from './demo/moduleE.js';
import { withAI, curatedWithAI, summaryWithAI } from './ai.js'; // 2026-11-26：AI 结论句，见文件末尾
import { setProvenance } from './provenance.js'; // 2026-11-28：洞察块下方「Based on data from …」+ Helpful / Not helpful

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
// 2026-11-28 summaries name posts in running text, so long titles are cut before a joining word:
// "Positano views you can reach without a tour" -> "Positano views", "Sunrise at the lake after a 4am start" -> "Sunrise at the lake".
const shortName = (p) => {
  if (!(p.title || '').trim()) return 'your untitled post';
  const t = nameOf(p);
  if (t.length <= 24) return t;
  const m = t.match(/^(.{8,}?)\s(?:you|that|when|after|before|without|so|for)\s/i);
  return m ? m[1] : t;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const NUM_WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const numWord = (n) => NUM_WORD[n] || String(n);
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
    // 2026-11-27：比较对象改成同类创作者，这一行写典型同类创作者的同一个数；柱图只看自己 6 周的走势，不再单独标出前 7 天
    chg: `Typical similar creator: ${f(peerMedian(key))}`,
    bars: vals.map((v, i) => ({ h: `${Math.max(3, Math.round((v / max) * 52))}px`, v: f(v), d: BAR_LABEL(5 - i), col: i === 5 ? color : '#e6e6ea' })),
    hasRows: !!c, rowsTitle: c ? rowsTitle : '', caption: c ? captionFor(rowsUnit, c) : '', rows: c ? c.rows : [],
  };
}

// 点选某一区后的说明：第一行分数，下面每个指标一行，写你的数和典型同类创作者的数
const PEER_WHO = 'a typical similar creator';
const per1k = (w, k) => (w.views ? (w[k] / w.views) * 1000 : 0);
// Engagement = 点赞 + 评论占播放的比例（雷达和 Content 说明句同一口径）
const engagementOf = (w) => (w.likes + w.comments) / Math.max(1, w.views);
// 典型同类创作者 = 同类创作者同一个 7 天的中位数；比率取每人比率的中位数
export const peerMedian = (k) => median(PEER_WEEKS.map((w) => w[k]));
const peerMedian1k = (k) => median(PEER_WEEKS.map((w) => per1k(w, k)));
const scoreLine = (a, typ = 50) => `score: ${a.you} against ${typ} for ${PEER_WHO}`;
// 按每次播放打分的维度写每千次播放的比率，括号里是你这 7 天的数量，和下方 Key metrics 对得上
const lineFor = ([label, k, f, unit], cur) => (unit
  ? `${label} per 1K views: ${per1k(cur, k).toFixed(1)} against ${peerMedian1k(k).toFixed(1)} (${fmtStat(cur[k])} ${unit})`
  : `${label}: ${(f || fmtStat)(cur[k])} against ${(f || fmtStat)(peerMedian(k))}`);

// ---------- 账号卡评分（Prompt 指南〇.3.6，比较对象 2026-11-27 改为同类创作者） ----------
// 分数 = 你这 7 天在同类创作者同一个 7 天里的百分位（0–100），典型同类创作者 = 50。
// 比率先按 K = 100 次播放向同类创作者的整体水平收缩；一个维度有多个指标时取百分位的平均。B 每项 = round(百分位 × 0.3)。
const K_VIEWS = 100;
const shrunk = (count, views, prior) => (count + prior * K_VIEWS) / (views + K_VIEWS);
export const A_DEFS = [
  { name: 'Views', metrics: [{ key: 'views' }] },
  { name: 'Engagement', metrics: [{ rate: 'likes' }, { rate: 'comments' }] },
  { name: 'Shares', metrics: [{ key: 'shares' }] }, // 2026-11-28：和雷达同一口径——7 天分享次数在同类里的排位（原来按每次播放的分享率，分数 25、雷达 45%，对不上）
  { name: 'Visits', metrics: [{ key: 'profile' }] }, // 2026-11-27 Yanice：按主页访问次数打分，和下方 Profile views 卡同一个数（原来按每次播放打分，分数涨、卡片跌，对不上）
  { name: 'Rewards', metrics: [{ key: 'rewards' }] },
];
export const B_DEFS = [
  { name: 'Views', metrics: [{ key: 'views' }, { key: 'newViewers' }] },
  { name: 'Engagement', metrics: [{ rate: 'likes' }, { rate: 'comments' }] }, // 2026-11-27 夜：和 Overview 的 Engagement 同一口径（点赞 + 评论）；只算点赞时本周是 12 周最低，显示 0 分
  { name: 'Followers', metrics: [{ key: 'net' }] },
];
const peerPrior = (num) => PEER_WEEKS.reduce((t, h) => t + h[num], 0) / Math.max(1, PEER_WEEKS.reduce((t, h) => t + h.views, 0));
const peerVal = (w, m) => (m.rate ? shrunk(w[m.rate], w.views, peerPrior(m.rate)) : w[m.key]);
// you = 你在同类里的分数；prev / prev2 = 典型同类创作者（50，B 按 30 分制是 15），图上的虚线和中央胶囊都和它比
export function accountScores(defs, scale = 100) {
  const cur = weekTotals(0);
  if (!cur.views) return Object.fromEntries(defs.map((d) => [d.name, { you: null, prev: null, prev2: null }]));
  const conv = (x) => Math.round((x * scale) / 100);
  return Object.fromEntries(defs.map((d) => {
    const pct = mean(d.metrics.map((m) => percentile(peerVal(cur, m), PEER_WEEKS.map((h) => peerVal(h, m)))));
    return [d.name, { you: conv(pct), prev: conv(50), prev2: conv(50) }];
  }));
}
// 选中某一区后图下的一句话：「{维度} is 22.1% above a typical similar creator, scoring 61.」
// 按每次播放打分的维度写比率（「… in likes per view」）；一个维度两项方向相反、分数跟着第二项走时，把第二项也写进去（同模块 E）
const PEER_RATE_WORD = { likes: 'likes', comments: 'comments', shares: 'shares' };
// plain (Content summary note, 2026-11-28 QA minor 7): whole percentages and no "scoring N" (the bar already shows the
// score), so the note stays short and never leaves "17." alone on a line.
function peerSentence(a, cur, metrics, scale = 100, { plain = false } = {}) {
  const typ = Math.round(scale / 2);
  const parts = metrics.map(([label, k, , unit]) => (unit ? [per1k(cur, k), peerMedian1k(k), `${PEER_RATE_WORD[k] || k} per view`, true] : [cur[k], peerMedian(k), label.toLowerCase(), false]));
  const gap = ([x, t]) => (t ? ((x - t) / t) * 100 : 0);
  const lead = ([x, t]) => {
    const pct = gap([x, t]), r = t ? x / t : 1;
    if (Math.abs(pct) < (plain ? 0.5 : 0.05)) return `is in line with ${PEER_WHO}`;
    if (r >= 3) return `is ${r >= 10 ? Math.round(r) : r.toFixed(1)}× ${PEER_WHO}`;
    return `is ${plain ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(1)}% ${pct > 0 ? 'above' : 'below'} ${PEER_WHO}`;
  };
  const tail = plain ? '' : `scoring ${a.you}.`;
  const end = (s) => (plain ? `${s.replace(/,\s*$/, '')}.` : s);
  // 2026-11-28：Engagement 和分数同一口径——点赞 + 评论一起比（按同样多的播放），不写 per view / rate
  if (a.name === 'Engagement') return end(`${lead([engagementOf(cur), median(PEER_WEEKS.map(engagementOf))])} in likes and comments, ${tail}`);
  const [p0, p1] = parts;
  const in0 = p0[3] ? ` in ${p0[2]}` : '';
  if (p1 && a.you !== typ && (gap(p0) > 0) !== (a.you > typ) && Math.abs(gap(p0)) >= 0.05) {
    return end(`${lead(p0)}${in0}, but ${a.you > typ ? 'higher' : 'lower'} in ${p1[2]}, ${tail}`);
  }
  return end(`${lead(p0)}${in0}, ${tail}`);
}

// 结论句（模板，规则同 ACCOUNT_CARD_INSIGHT_SYSTEM）：点名最强与最弱；Rewards 是收入不是内容质量，不参与点名
const A_NOUN = { Views: 'Reach', Engagement: 'Engagement', Shares: 'Sharing', Visits: 'Profile visits' };
const A_REST = {
  Views: ' Open on the place and the payoff in the first second.',
  Engagement: ' Ask viewers one question they can answer in a word.',
  Shares: ' Test a format viewers would want to pass on.',
  Visits: ' End with a reason to check your other posts.',
};
// 2026-11-27 晚：洞察块 = 结论句 + 2 个要点（最弱一项和同类创作者的差距 + 下一步建议），rest 留空，不放链接
// 2026-11-27 Yanice 改为和同类创作者比：要点写「你 x，典型同类创作者 y」，不再写这 7 天涨跌
const peerFact = (lo, m) => {
  if (!m) return '';
  const [label, k, f, unit] = m, cur = weekTotals(0);
  if (unit) return `You got ${per1k(cur, k).toFixed(1)} ${PEER_RATE_WORD[k] || k} per 1K views, against ${peerMedian1k(k).toFixed(1)} for ${PEER_WHO}.`;
  return `${label}: ${(f || fmtStat)(cur[k])}, against ${(f || fmtStat)(peerMedian(k))} for ${PEER_WHO}.`;
};
function accountKeyA(areas) {
  const content = areas.filter((a) => a.name !== 'Rewards');
  const hi = content.reduce((a, b) => (b.you > a.you ? b : a)), lo = content.reduce((a, b) => (b.you < a.you ? b : a));
  const bullets = [peerFact(lo, lo.def?.[0]), A_REST[lo.name].trim()].filter(Boolean);
  if (areas.every((a) => Math.abs(a.you - 50) < 8)) return { key: 'You are close to a typical similar creator in every area.', rest: '', bullets, lo };
  if (hi.you < 50) return { key: `Every area is below a typical similar creator, ${A_NOUN[lo.name].toLowerCase()} most of all.`, rest: '', bullets, lo };
  const verb = A_NOUN[hi.name].endsWith('s') ? 'are' : 'is';
  return { key: `Against similar creators, ${A_NOUN[hi.name].toLowerCase()} ${verb} your strongest area, while ${A_NOUN[lo.name].toLowerCase()} trails.`, rest: '', bullets, lo };
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
  const bullets = [peerFact(lo, lo.def?.[0]), B_REST[lo.name].trim()].filter(Boolean);
  if (areas.every((a) => Math.abs(a.you - 15) < 3)) return { key: 'You are close to a typical similar creator at every step.', rest: '', bullets };
  if (hi.you < 15) return { key: `All three steps are below a typical similar creator, ${B_LO[lo.name]} most of all.`, rest: '', bullets };
  return { key: `Against similar creators, ${B_HI[hi.name].toLowerCase()} holds up best, while ${B_LO[lo.name]} trails.`, rest: '', bullets };
}

// 卡片 ⓘ 的「Compared with」一句（A、B 共用）
const PEER_INFO = `${COHORT.phrase[0].toUpperCase()}${COHORT.phrase.slice(1)}, over the same 7 days. Similar creators post the same kind of content, have about as many followers and are in the same region as you.`;
const PEER_UI = { legend: 'Typical similar creator', hint: 'Tap an area to compare it with similar creators' };

// ---------- 模块 A：Analytics › Overview ----------
// range 不是 7 天时返回 null：分数只按 7 天窗口定义（〇.3.6），卡片换成一句说明，不再显示 7 天样例
export function buildModuleA(range = { key: '7' }) {
  if (range?.key !== '7') return null;
  const cur = weekTotals(0);
  const sc = accountScores(A_DEFS);
  if (Object.values(sc).some((x) => x.you == null)) return null;
  const basis = Object.fromEntries(A0.areas.map((a) => [a.name, a.basis]));
  const area = (name, metrics, extra) => {
    const s = sc[name];
    const a = { name, you: s.you, prev: s.prev, prev2: s.prev2, basis: basis[name], def: metrics, ...extra };
    a.metrics = metrics.map(([label, k, f]) => ({ label, value: (f || fmtStat)(cur[k]), peer: (f || fmtStat)(peerMedian(k)) }));
    a.lines = [scoreLine(a), ...metrics.map((m) => lineFor(m, cur))];
    a.note = a.lines.join(' · ');
    a.sentence = peerSentence(a, cur, metrics);
    return a;
  };
  const areas = [
    area('Views', [['Post views', 'views']], { dd: details({ head: fmtStat(cur.views), unit: 'post views', key: 'views', color: '#0d4a96', rowsMetric: 'views', rowsUnit: 'views', rowsTitle: 'Where views came from' }) }),
    area('Engagement', [['Likes', 'likes', null, 'likes'], ['Comments', 'comments', null, 'comments']], { dd: details({ head: fmtStat(cur.likes), unit: 'likes', sub: `${fmtStat(cur.comments)} comments`, key: 'likes', color: '#9cc8f6', rowsMetric: 'likes', rowsUnit: 'likes', rowsTitle: 'Where likes came from' }) }),
    area('Shares', [['Shares', 'shares']], { dd: details({ head: fmtStat(cur.shares), unit: 'shares', key: 'shares', color: '#1e7ce8', rowsMetric: 'shares', rowsUnit: 'shares', rowsTitle: 'Where shares came from' }) }),
    area('Visits', [['Profile views', 'profile']], { dd: details({ head: fmtStat(cur.profile), unit: 'profile views', key: 'profile', color: '#5a9ff0' }) }),
    area('Rewards', [['Est. rewards', 'rewards', money]], { dd: details({ head: money(cur.rewards), unit: 'estimated rewards', key: 'rewards', color: '#1765c4', f: money }) }),
  ];
  const total = Math.round(mean(areas.map((a) => a.you)));
  const { key, rest, bullets } = accountKeyA(areas);
  return {
    ...A0, total, prevTotal: 50, prev2Total: 50, areas, key, rest, bullets, next: null, askFor: 'A',
    info: [
      { icon: 'star', t: 'Overall score', lines: [`${total} out of 100, the average of the five areas`, 'A typical similar creator scores 50.'] },
      { icon: 'insights', t: 'Compared with', lines: [PEER_INFO] },
      { icon: 'info', t: 'Area scores', lines: ['Each area ranks you among those creators, from 0 to 100. Engagement compares likes and comments for the same number of views; the other areas compare totals.'] },
    ],
    ui: { ...A0.ui, ...PEER_UI }, cardTitle: 'Performance summary',
  };
}

// ---------- 模块 B：Analytics › Content ----------
export function buildModuleB(range = { key: '7' }) {
  if (range?.key !== '7') return null;
  const cur = weekTotals(0);
  const sc = accountScores(B_DEFS, 30);
  if (Object.values(sc).some((x) => x.you == null)) return null;
  const basis = Object.fromEntries(B0.areas.map((a) => [a.name, a.basis]));
  const { s, e } = weekWin(0);
  const newFollowers = Math.round(POSTS.reduce((t, p) => t + POST_METRIC.newFollowers(p, sum(p.daily, s, e)), 0));
  const area = (name, metrics, extra) => {
    const sco = sc[name];
    const a = { name, you: sco.you, prev: sco.prev, prev2: sco.prev2, max: 30, basis: basis[name], def: metrics, ...extra };
    a.metrics = metrics.map(([label, k]) => ({ label, value: fmtStat(cur[k]), peer: fmtStat(peerMedian(k)) }));
    a.lines = [scoreLine(a, 15), ...metrics.map((m) => lineFor(m, cur))];
    a.note = a.lines.join(' · ');
    a.sentence = peerSentence(a, cur, metrics, 30, { plain: true });
    return a;
  };
  const areas = [
    // New viewers 用和卡片同一个窗口（Nov 16 – Nov 22）；Viewers 页的 Key metrics 有 3 天延迟，是另一个窗口
    area('Views', [['Post views', 'views'], ['New viewers', 'newViewers']], { dd: details({ head: fmtStat(cur.views), unit: 'post views', sub: `${fmtStat(cur.newViewers)} new viewers`, key: 'views', color: '#0d4a96', rowsMetric: 'views', rowsUnit: 'views', rowsTitle: 'Where views came from' }) }),
    area('Engagement', [['Likes', 'likes', null, 'likes'], ['Comments', 'comments', null, 'comments']], { dd: details({ head: fmtStat(cur.likes), unit: 'likes', key: 'likes', color: '#9cc8f6', rowsMetric: 'likes', rowsUnit: 'likes', rowsTitle: 'Where likes came from' }) }),
    area('Followers', [['Net followers', 'net']], { dd: { ...details({ head: fmtStat(cur.net), unit: 'net followers', sub: `${newFollowers} new followers, ${newFollowers - cur.net} unfollowed`, key: 'net', color: '#5a9ff0' }), ...(() => { const c = contributors('newFollowers', newFollowers); return { hasRows: true, rowsTitle: 'Where new followers came from', caption: captionFor('new followers', c), rows: c.rows }; })() } }),
  ];
  const sumOf = (k) => areas.reduce((t, a) => t + a[k], 0);
  const { key, rest, bullets } = accountKeyB(areas);
  return {
    ...B0, total: sumOf('you'), prevTotal: sumOf('prev'), prev2Total: sumOf('prev2'), areas, key, rest, bullets, next: null, askFor: 'B',
    info: [
      { icon: 'star', t: 'Overall score', lines: [`${sumOf('you')} out of 90, the three areas added up`, `A typical similar creator scores ${sumOf('prev')}.`] },
      { icon: 'insights', t: 'Compared with', lines: [PEER_INFO] },
      { icon: 'info', t: 'Area scores', lines: ['Each area is out of 30 and ranks you among those creators. A typical one scores 15. Engagement compares likes and comments for the same number of views.'] },
    ],
    ui: { ...B0.ui, ...PEER_UI }, cardTitle: 'Content summary',
  };
}

// ---------- 模块 E：我的作品 › Overview（这条 vs 同类创作者的同类作品） ----------
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

// 2026-11-27 晚：不说 per view / rate，改成创作者听得懂的说法（「viewers liked it less often」）
// 2026-11-27 Yanice 改：比较对象从「你的同类作品」换成「同类创作者的同类作品」
const PEER_POST = 'a typical post by similar creators';
// 2026-11-28 copy pass (Yanice: the summary picks the most important signal and says why it is good or bad and what to
// do; no "1 in 4", no "78×", the numbers are on the radar). Paragraph = finding against similar videos + one lesson;
// bullets = the first-second fact + a next step, one line each.
const E_HI = { Reach: 'reached more viewers', Retention: 'held viewers longer', Likes: 'got liked more often', Shares: 'got shared more often', Follows: 'got more viewers to follow you' };
const E_LO = { Reach: 'it reached fewer viewers', Retention: 'fewer watched to the end', Likes: 'viewers liked it less often', Shares: 'fewer shared it', Follows: 'fewer viewers followed you' };
// "similar videos" (matches the radar legend), not "similar creators’ posts" (QA M6)
const E_LO_ONLY = {
  Reach: 'This post reached fewer viewers than similar videos.',
  Retention: 'Fewer viewers watched this post to the end than similar videos.',
  Likes: 'Viewers liked this post less often than similar videos.',
  Shares: 'Viewers shared this post less often than similar videos.',
  Follows: 'Fewer viewers followed you from this post than from similar videos.',
};
// The lesson: what to change when an area trails similar videos, what to repeat when it leads
const E_LO_LESSON = {
  Reach: 'Use searchable words in your caption.',
  Retention: 'Show the best moment sooner.',
  Likes: 'Give viewers a payoff worth a like.',
  Shares: 'Add a tip or cost people want to send.',
  Follows: 'Say what’s coming next at the end.',
};
const E_HI_LESSON = {
  Reach: 'Reuse its topic and format next.',
  Retention: 'Keep this length and pace next time.',
  Likes: 'Make a follow-up on the same topic.',
  Shares: 'Make more posts people want to pass on.',
  Follows: 'Make it a series so they stay.',
};
// Same thresholds as the radar status words (radarStats.js STATUS_STRONG / STATUS_BEHIND)
const RADAR_STRONG = 60, RADAR_BEHIND = 40;
// Near-ties (within 5 points) go to the area that matters most to growth
const E_ORDER = ['Reach', 'Follows', 'Likes', 'Shares', 'Retention'];
// 同类创作者的同时长档作品，按同一个发布后窗口比（真实产品里由平台按同类定义在后台取，只给排位）
export const peerPostsFor = (p, window) => PEER_POSTS.filter((q) => q.age >= window && durationBucket(q.duration) === durationBucket(p.duration));

export function buildModuleE(p) {
  if (!p || !p.daily || !p.retention) return null;
  const age = ageOf(p);
  if (age < 1) return null;
  const W = Math.min(age, E_WINDOW_MAX);
  const comp = peerPostsFor(p, W);
  if (comp.length < 5) return null; // E16：可比作品不足 5 条，不出卡
  const v = viewsAtAge(p, W), vs = comp.map((q) => peerViewsAtAge(q, W));
  const H = (f) => comp.map(f);
  const pc = (x, hist) => percentile(x, hist);
  const r1 = (x) => (x * 1000).toFixed(1);
  const tv = median(vs);
  const wl = W < age ? `, first ${W} days` : '';
  const myFollow = rateOf(p, 'follow');
  const defs = [
    { name: 'Reach', parts: [[v, vs]], lines: [`Video views${wl}: ${fmt(v)} against ${fmt(tv)}`], metrics: [{ label: 'Video views', value: fmt(v) }] },
    { name: 'Retention', parts: [[p.avgPct, H((q) => q.avgPct)], [p.watchedFull, H((q) => q.watchedFull)]],
      lines: [`Watched full video: ${(p.watchedFull * 100).toFixed(1)}% against ${(median(H((q) => q.watchedFull)) * 100).toFixed(1)}%`, `Average watched: ${Math.round(p.avgPct * 100)}% against ${Math.round(median(H((q) => q.avgPct)) * 100)}%`],
      metrics: [{ label: 'Watched full video', value: `${(p.watchedFull * 100).toFixed(1)}%` }, { label: 'Average watch time', value: `${p.avgWatch}s` }] },
    // 2026-11-26 独立评审：点赞和评论合成一个分会掩盖差距，Likes 只按每次播放的点赞打分，评论保留在说明行
    { name: 'Likes', parts: [[p.likeRate, H((q) => q.likeRate)]],
      lines: [`Likes per 1K views: ${r1(p.likeRate)} against ${r1(median(H((q) => q.likeRate)))}`, `Comments per 1K views: ${r1(p.commentRate)} against ${r1(median(H((q) => q.commentRate)))}`],
      metrics: [{ label: 'Likes', value: fmt(p.likes) }, { label: 'Comments', value: fmt(p.comments) }] },
    { name: 'Shares', parts: [[p.shareRate, H((q) => q.shareRate)], [p.saveRate, H((q) => q.saveRate)]],
      lines: [`Shares per 1K views: ${r1(p.shareRate)} against ${r1(median(H((q) => q.shareRate)))}`, `Favorites per 1K views: ${r1(p.saveRate)} against ${r1(median(H((q) => q.saveRate)))}`],
      metrics: [{ label: 'Shares', value: fmt(p.shares) }, { label: 'Favorites', value: fmt(p.saves) }] },
    { name: 'Follows', parts: [[myFollow, H((q) => q.followRate)]],
      lines: [`New followers per 1K views: ${r1(myFollow)} against ${r1(median(H((q) => q.followRate)))}`],
      metrics: [{ label: 'New followers', value: fmt(p.newFollowers) }] },
  ];
  // 一句话用该维度第一项和典型同类作品比；两项方向相反、分数跟着第二项走时，把第二项也写进去
  const E_PART = { Reach: ['views'], Retention: ['average watched', 'full watches'], Likes: ['likes per view', 'comments per view'], Shares: ['shares per view', 'favorites per view'], Follows: ['new followers per view'] };
  const typicalSentence = (d, you) => {
    const [[x, h]] = d.parts, t = median(h), pct = t ? ((x - t) / t) * 100 : 0, tail = `scoring ${you}.`;
    const r = t ? x / t : 1; // 高出 2 倍以上写成倍数（5506.5% 读不出来）
    const lead = Math.abs(pct) < 0.05 ? `is in line with ${PEER_POST}` : r >= 3 ? `is ${r >= 10 ? Math.round(r) : r.toFixed(1)}× ${PEER_POST}` : `is ${Math.abs(pct).toFixed(1)}% ${pct > 0 ? 'above' : 'below'} ${PEER_POST}`;
    const names = E_PART[d.name] || [];
    if (d.parts.length > 1 && you !== 50 && (pct > 0) !== (you > 50) && Math.abs(pct) >= 0.05) return `${lead} in ${names[0]}, but ${you > 50 ? 'higher' : 'lower'} in ${names[1]}, ${tail}`;
    return `${lead}, ${tail}`;
  };
  const areas = defs.map((d) => {
    const you = Math.round(mean(d.parts.map(([x, h]) => pc(x, h))));
    const a = { name: d.name, you, prev: 50, prev2: 50, metrics: d.metrics, basis: E0.areas.find((x) => x.name === d.name)?.basis };
    a.lines = [`score: ${you} against 50 for ${PEER_POST}`, ...d.lines];
    a.note = a.lines.join(' · ');
    a.sentence = typicalSentence(d, you);
    return a;
  });
  const total = Math.round(mean(areas.map((a) => a.you)));
  // 结论句：和典型同类作品差得最多的两头（〇.8）；分数按 〇.3.6 分档，≥ 60 算高、≤ 40 算低
  // 2026-11-28: the wording follows the radar's status words (Strong ≥ 60, Behind < 40 of similar videos; radarStats.js),
  // so the text never calls an area strong or weak that the chart calls Average. Ranks come from postRadar.
  const rankOf = Object.fromEntries((postRadar(p) || []).map((r) => [r.key, r.rank]));
  const R = (a) => rankOf[a.name] ?? a.you;
  const top = Math.max(...areas.map(R));
  const hi = E_ORDER.map((name) => areas.find((a) => a.name === name)).find((a) => R(a) >= top - 5);
  const lo = areas.reduce((a, b) => (R(b) < R(a) ? b : a));
  const ratio = tv ? v / tv : 1;
  const hiPhrase = (a) => (a.name === 'Reach' && ratio >= 2 ? 'reached far more viewers' : E_HI[a.name]);
  // 2026-11-28 (Yanice: no bullet points anywhere): paragraph only. Sentence 1 = finding against similar videos;
  // sentence 2 = what to fix when an area trails, otherwise why it worked (the opening) and what to repeat.
  const at = Math.max(1, biggestDrop(p.retention)), moment = dropMoment(p);
  const lost = Math.round(((p.retention[at - 1] ?? 1) - (p.retention[at] ?? 1)) * 100);
  const usual = Math.round(median(comp.map((q) => q.firstSecondLeft)) * 100);
  const opening = at !== 1 ? `Most viewers leave at ${moment}, so show the best part sooner.`
    : lost < usual - 1 ? 'Its opening held viewers, so reuse it.'
      : lost > usual + 1 ? 'More viewers left at the start, so lead with your best shot.' : null;
  let key, lesson;
  if (R(hi) >= RADAR_STRONG && R(lo) < RADAR_BEHIND) { key = `This post ${hiPhrase(hi)} than similar videos, but ${E_LO[lo.name]}.`; lesson = E_LO_LESSON[lo.name]; }
  else if (R(hi) >= RADAR_STRONG) {
    // An all-round winner says so: every area Strong on the radar, or every area but one
    const strong = areas.filter((a) => R(a) >= RADAR_STRONG).length;
    key = `This post ${hiPhrase(hi)} than similar videos${strong === areas.length ? ' and beat them in every area' : strong === areas.length - 1 ? ' and beat them in almost every area' : ''}.`;
    lesson = opening || E_HI_LESSON[hi.name];
  }
  else if (R(lo) < RADAR_BEHIND) { key = E_LO_ONLY[lo.name]; lesson = E_LO_LESSON[lo.name]; }
  else { key = 'This post performed like similar videos.'; lesson = opening || 'Change one thing next time to stand out.'; }
  const n = comp.length;
  return {
    ...E0, cardTitle: 'Post summary', total, prevTotal: 50, prev2Total: 50, areas, key, rest: ` ${lesson}`, bullets: [], next: null,
    ui: {
      ...E0.ui,
      baseline: 'Similar creators’ typical post',
      info: [
        { ic: 'insights', t: 'Compared with', lines: [`${n} posts ${BUCKET_WORDS[durationBucket(p.duration)]} by ${COHORT.phrase}, each over its first ${W} day${W > 1 ? 's' : ''}.`] },
        { ic: 'info', t: 'Area scores', lines: ['Each area ranks this post among those posts, from 0 to 100. A typical one scores 50.'] },
      ],
    },
  };
}

// ---------- 同类对比雷达（Overview Performance summary、Post summary） ----------
// 2026-11-28：雷达上的每个同类数字都从 data/peers.js 现算，不再在组件里写数。
// 典型同类 = 同类在同一指标上的中位数；排位 = 同类里低于你的比例（并列算一半），取整并限制在 1–99%，
// 不出现 0% / 100% 或 0.08% / 99.8% 这种读不出意义的小数。
const rankOf = (x, xs) => Math.max(1, Math.min(99, Math.round(percentile(x, xs))));
const pctText = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
function radarArea(name, key, label, own, peers, format) {
  const peer = median(peers), rank = rankOf(own, peers);
  return { name, key, label, own, peer, rank, ownText: format(own), peerText: format(peer), rankText: `${rank}%` };
}
// 账号：你这 7 天 vs 同类创作者同一个 7 天（PEER_WEEKS）。Engagement = 点赞 + 评论占播放的比例，和下方 Likes、Comments、Post views 卡同源
export function accountRadar() {
  const cur = weekTotals(0);
  const col = (f) => PEER_WEEKS.map(f);
  return [
    radarArea('Views', 'Views', '7-day post views', cur.views, col((w) => w.views), fmtStat),
    radarArea('Engagement', 'Engagement', '7-day engagement', engagementOf(cur), col(engagementOf), (x) => pctText(x)),
    radarArea('Shares', 'Shares', '7-day shares', cur.shares, col((w) => w.shares), fmtStat),
    radarArea('Visits', 'Visits', '7-day profile views', cur.profile, col((w) => w.profile), fmtStat),
    radarArea('Rewards', 'Rewards', '7-day est. rewards', cur.rewards, col((w) => w.rewards), money),
  ];
}
// 作品：和模块 E 同一组同类作品（peerPostsFor：同时长档 + 同一个发布后窗口），播放按同一发布天数比（peerViewsAtAge）
export function postRadar(p) {
  if (!p || !p.daily) return null;
  const age = ageOf(p);
  if (age < 1) return null;
  const W = Math.min(age, E_WINDOW_MAX);
  const comp = peerPostsFor(p, W);
  if (comp.length < 5) return null;
  const col = (f) => comp.map(f);
  return [
    radarArea('Reach', 'Reach', W < age ? `Views, first ${W} days` : 'Video views', viewsAtAge(p, W), col((q) => peerViewsAtAge(q, W)), fmt),
    radarArea('Retention', 'Retention', 'Watched to the end', p.watchedFull, col((q) => q.watchedFull), (x) => pctText(x)),
    radarArea('Likes', 'Likes', 'Viewers who liked', p.likeRate, col((q) => q.likeRate), (x) => pctText(x)),
    radarArea('Shares', 'Shares', 'Viewers who shared', p.shareRate, col((q) => q.shareRate), (x) => pctText(x, 2)),
    radarArea('New follows', 'Follows', 'Viewers who followed', rateOf(p, 'follow'), col((q) => q.followRate), (x) => pctText(x, 2)),
  ];
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
// 评论里问得最多的 → 给这位旅行创作者的下一步建议（弹层里一行以内，≤ 38 个字符）
// 2026-11-28 (no bullets): the next step is the end of the last sentence, "…, so share a full itinerary next time."
const TOPIC_IDEA = { itinerary: 'share a full itinerary', budget: 'show your costs', 'part 2': 'make a part 2', edit: 'show how you edit', crowds: 'show how to skip the crowds', trip: 'ask who they’d bring' };
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
  // 2026-11-28 copy pass: no "1.3×" (the rows show the numbers), no bullets. Paragraph = how their viewers react against
  // yours + what the comments ask for (the reason), ending with the next step from the top ask.
  const who = `@${item.creator}${item.creator.endsWith('s') ? '’' : '’s'} viewers`;
  const VERB = { likes: 'like this post', comments: 'comment', favorites: 'save it' };
  let key;
  if (g.gap < 1.15) key = `${who} react about as often as yours.`;
  else if (g.a > g.b) key = `${who} ${VERB[g.noun]} ${g.gap >= 1.5 ? 'far more' : 'more'} often than yours.`;
  else key = `${who} ${VERB[g.noun]} less often than yours.`;
  const top = topics && topics.length >= 2 ? topics[0][1] : words.length ? words[0][0] : null;
  // The two biggest comment topics are 58% of comments (commentTopics: 32% + 26%), so "most comments" holds
  const idea = top ? `, so ${TOPIC_IDEA[top] || 'try its format in your next post'}` : '';
  const t0 = topics && topics.length >= 2 ? TOPIC_SHORT[topics[0][1]] || topics[0][0].toLowerCase() : '';
  const t1 = topics && topics.length >= 2 ? (TOPIC_SHORT[topics[1][1]] || topics[1][0].toLowerCase()).replace(t0.startsWith('the ') ? /^the / : /^$/, '') : '';
  const rest = topics && topics.length >= 2 ? ` Most comments ask about ${t0} and ${t1}${idea}.`
    : words.length ? ` Their top comment word is “${words[0][0]}”${idea}.` : '';
  const bullets = [];
  return {
    id: item.id, creator: item.creator, cardTitle: 'Compared with your posts', key, rest, bullets, next: null, rows, ratio: { noun: g.noun, gap: g.gap, ahead: g.a > g.b }, ask: askD(item, topics),
    info: [
      { t: 'This post', lines: [`Public data since it was posted, ${age} day${age > 1 ? 's' : ''} ago.`], i_play: true },
      { t: 'Your typical post', lines: [`The middle of your ${comp.length} public posts, each over its first ${age} day${age > 1 ? 's' : ''}.`], i_people: true },
    ],
  };
}

// ---------- Creator growth timeline (Inspiration › Analysis › Creator; store build's Insights › Creator) ----------
// 2026-11-28 QA M8: the timeline used to be one hard-coded sports creator for everyone ("Reached 1M followers" for a
// creator with 146.9K, "basketball fyp"). Now every creator's milestones come from their own stats: only follower
// milestones they have reached, cumulative post counts that grow over time and stay under their total, average views
// that grow with the account, and title words from their own hashtags.
const MS_STEPS = [5e6, 1e6, 500e3, 100e3, 50e3, 10e3];
const MS_FALLBACK_WORDS = ['travel tips', 'itinerary', 'budget travel'];
const msLabel = (x) => (x >= 1e6 ? `${x / 1e6}M` : `${x / 1e3}K`);
const msDate = (daysAgo) => { const d = new Date(NOW.getTime() - daysAgo * 864e5); return { d: `${d.getMonth() + 1}/${d.getDate()}`, y: String(d.getFullYear()) }; };
export function creatorMilestones(item) {
  if (!item?.creatorStats) return [];
  const { followers: F, posts: P, avgViews: A } = item.creatorStats;
  let seed = 7; for (const ch of item.creator) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  const tags = [...new Set((item.caption.match(/#(\w+)/g) || []).map((t) => t.slice(1).toLowerCase()).filter((t) => !/^(viral|fyp|foryou|traveltok)$/.test(t)))];
  const pool = [...tags, ...MS_FALLBACK_WORDS.filter((w) => !tags.includes(w))];
  const reached = MS_STEPS.filter((x) => x <= F).slice(0, 3);
  const share = [0.88, 0.52, 0.22], grow = [1, 0.58, 0.3];
  let daysAgo = 20 + Math.floor(r() * 90);
  const out = reached.map((x, i) => {
    const when = msDate(daysAgo);
    daysAgo += 140 + Math.floor(r() * 220);
    const avg = Math.round(A * grow[i] * (0.9 + r() * 0.2));
    return {
      ...when, t: `Reached ${msLabel(x)} followers`,
      n: Math.max(3 + (reached.length - i), Math.round(P * share[i])), avg,
      words: [pool[(i * 2) % pool.length], pool[(i * 2 + 1) % pool.length]],
      v: [6, 3.2, 2].map((k) => Math.round(avg * k * (0.7 + r() * 0.6))),
    };
  });
  out.start = msDate(daysAgo + 60 + Math.floor(r() * 120));
  return out;
}

// ---------- 模块 C：Topic search ----------
// Popularity for a topic on the trending list comes from its views on that list (2026-11-28 QA M5: a #1 trend was
// scoring 9 and reading "a niche topic"). Log scale: #1 (225.5M) scores 98; anything on the list scores 60 or more.
export function trendingPopularity(q) {
  const k = String(q || '').trim().toLowerCase();
  const hit = TOPICS.find(([t]) => t.toLowerCase() === k);
  if (!hit) return null;
  const top = Math.max(...TOPICS.map(([, v]) => v)), floor = 50e6;
  const t = Math.max(0, Math.min(1, Math.log(hit[1] / floor) / Math.log(top / floor)));
  return Math.round(60 + 38 * t);
}
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
  // 2026-11-28 copy pass: no scores in the text (the bars show them). Paragraph = does it fit you and is it wanted, then
  // how crowded it is, ending with the next step (no bullets). Bands match POP_PHRASE / REL_PHRASE / COMP_PHRASE.
  let key, rest, bullets;
  if (isDoc) { key = C0.key; rest = C0.rest; bullets = []; }
  else {
    const hot = pop >= 60, fit = rel >= 70 ? 'fits your travel posts' : rel >= 50 ? 'is close to what you post' : null;
    if (fit) key = `This topic ${fit}${hot ? ' and is in demand right now' : pop < 40 ? ', but it’s a niche topic' : ''}.`;
    else key = hot ? 'This topic is in demand right now, but far from your travel posts.' : pop >= 40 ? 'This topic gets steady interest, but it’s far from your travel posts.' : 'This is a niche topic, and it’s far from your travel posts.';
    const crowd = comp <= 25 ? 'Few creators cover it yet' : comp <= 45 ? 'There’s room for new creators' : comp < 70 ? 'Some creators already cover it' : 'Many creators already cover it';
    // Off-topic: the crowd level decides whether it is worth the detour (Relevance = your posts and what your viewers watch)
    // No bullets (2026-11-28): the next step ends the second sentence
    rest = fit ? ` ${crowd}, so try it as ${travel ? 'an itinerary' : 'a review'} post.`
      : comp >= 70 ? ' It’s crowded too, so only try it with a travel angle.' : ` ${comp <= 45 ? crowd : 'Some creators cover it'}, but only try it with a travel angle.`;
    bullets = [];
  }
  const rows = C0.rows.map((r) => {
    const score = r.name === 'Popularity' ? pop : r.name === 'Competition' ? comp : rel;
    const phrase = r.name === 'Popularity' ? POP_PHRASE(score) : r.name === 'Competition' ? COMP_PHRASE(score) : REL_PHRASE(score);
    return { ...r, score, note: `is ${score}: ${phrase}.` };
  });
  return { ...C0, key, rest, bullets, next: null, rows };
}
// Topic scores describe search and views on TikTok right now; the prototype reads that as the last 7 days
// (the same days as the trending list and the account cards), so the provenance line shows that window.
const TOPIC_WINDOW = { key: '7' };

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
  const cur = weekTotals(0);
  const content = A.areas.filter((a) => a.name !== 'Rewards');
  const lo = content.reduce((a, b) => (b.you < a.you ? b : a)), hi = content.reduce((a, b) => (b.you > a.you ? b : a));
  // 2026-11-27：和同类创作者比（模块 A 同口径），不再写这周和上周的涨跌
  const bullets = [`${lo.name} scored ${lo.you}, against 50 for ${PEER_WHO}.`, ...lo.lines.slice(1)];
  if (lo.name === 'Engagement') {
    const c = contributors('likes', cur.likes);
    if (c.rows[0]) bullets.push(`${nameOf(POSTS.find((p) => p.id === c.rows[0].postId))} got ${c.rows[0].val} of your ${fmtStat(cur.likes)} likes.`);
  }
  if (hi.name !== lo.name) bullets.push(`${A_NOUN[hi.name]} ${A_NOUN[hi.name].endsWith('s') ? 'are' : 'is'} your strongest area at ${hi.you}.`);
  bullets.push(...SUMMARY_ACTIONS[lo.name]);
  return {
    from: 'From Performance summary',
    question: SUMMARY_Q[lo.name],
    headline: `${lo.name} is your lowest area against similar creators, so start there.`,
    bullets,
    module: { type: 'performanceSummary', title: 'Performance summary' },
    chips: ['How can I get more likes and comments?', 'When should I post?'],
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
// 2026-11-28：Ask 全部按「和同类创作者比」的口径写——不问涨跌（drop / this week / last week），不说 per view；
// 中性或面向下一步，393pt 一行放得下。选中某一维度时停在这一维度的问题（映射不变）。
export function askA() {
  return {
    // 未选中时轮播（Yanice 2026-11-26 确认保留），第一条是页面级问题
    prompts: ['What should I work on first?', 'What got more people to like my posts?', 'How do I compare with similar creators?', 'Which post did best in the last 7 days?'],
    byArea: {
      Views: 'Which posts drove views?',
      Engagement: 'How can I get more likes and comments?',
      Shares: 'How can I get more shares?',
      Visits: 'How can I get more profile visits?',
      Rewards: 'How are my rewards worked out?',
    },
  };
}
export function askB() {
  return {
    prompts: ['Which post brought the most views?', 'How can I get more people to react?', 'Where did my new followers come from?'],
    byArea: {
      Views: 'Which posts drove views?',
      Engagement: 'How can I get more likes and comments?',
      Followers: 'Which posts brought new followers?',
    },
  };
}
export function askE(p, E) {
  const drop = dropMoment(p);
  const sc = Object.fromEntries((E?.areas || []).map((a) => [a.name, a.you]));
  // 高于典型同类作品（≥ 50）问「是什么起了作用」，低于问「下次怎么做」
  const up = (n) => (sc[n] ?? 50) >= 50;
  return {
    prompts: [`Why do viewers leave at ${drop}?`, 'How does it compare to similar videos?', 'Where did this post’s views come from?'],
    byArea: {
      Reach: 'Where did this post’s views come from?',
      Retention: `Why do viewers leave at ${drop}?`,
      Likes: up('Likes') ? 'What made viewers like this post?' : 'How can I get more likes next time?',
      Shares: up('Shares') ? 'What made people share this post?' : 'How can I get more shares and saves?',
      Follows: up('Follows') ? 'Why did this post bring new followers?' : 'How can I turn viewers into followers?',
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
import { VIEWERS_LAG, FOLLOWER_INSIGHTS, VIEWER_INSIGHTS, ACTIVE_DAYS, activeHours } from '../data/seed.js';
// 段落里的「是谁」：最大的年龄段 + 最多的国家（只说数据能撑住的：最大一组、几成）
const TENTHS = ['', 'One in ten', 'Two in ten', 'Three in ten', 'Four in ten', 'Half', 'Six in ten', 'Seven in ten', 'Eight in ten', 'Nine in ten'];
function audienceLine(ins, who, skipGender) {
  const age = ins.Age.reduce((a, b) => (b[1] > a[1] ? b : a)), loc = ins.Locations.filter((x) => x[0] !== 'Other').reduce((a, b) => (b[1] > a[1] ? b : a));
  const t = Math.round(loc[1] * 10), ages = age[0].replace('-', ' to ');
  const place = loc[0] === 'United States' ? 'the US' : loc[0] === 'United Kingdom' ? 'the UK' : loc[0];
  const g = skipGender ? '' : ` About ${Math.round(ins.Gender[0][1] * 3) === 2 ? 'two in three' : `${Math.round(ins.Gender[0][1] * 100)}%`} are women.`;
  return `${who} biggest age group is ${ages}, and ${t >= 1 && t <= 9 ? TENTHS[t].toLowerCase() : `${Math.round(loc[1] * 100)}%`} live in ${place}.${g}`;
}
// 2026-11-28：观众数据晚 3 天这件事改由洞察块下方的「Based on data from …」日期行说明，段落里不再解释（原 lagLine）
// 这段时间带来新粉丝最多的作品
function topFollowPost(range) {
  const { s, e } = rangeIdx(range);
  const rows = POSTS.map((p) => [p, POST_METRIC.newFollowers(p, sum(p.daily, s, e))]).filter((r) => r[1] >= 1);
  return rows.length ? rows.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : null;
}
// Why follower growth slowed: the longest stretch (4+ days) inside the range with no new public post and almost no net
// gain, ended by a post after which followers picked up. null when the data does not show one.
function followerStall(range) {
  const { s, e } = rangeIdx(range);
  const pubs = POSTS.filter((p) => p.privacy === 'everyone' && p.pubIdx > s && p.pubIdx <= e).sort((a, b) => a.pubIdx - b.pubIdx);
  let best = null, from = s;
  for (const p of pubs) {
    const len = p.pubIdx - from;
    const flat = sum(DAILY.followersNet, from, p.pubIdx - 1) <= 2, after = sum(DAILY.followersNet, p.pubIdx, e) > 2;
    if (len >= 4 && flat && after && (!best || len > best.len)) best = { len, post: p };
    from = p.pubIdx + 1;
  }
  return best;
}
// Viewers: the post that brought the most views in a span
const topViewsIn = (s, e) => POSTS.reduce((a, b) => (sum(b.daily, s, e) > sum(a.daily, s, e) ? b : a));
import { viewerKpis, followerKpis, rangeLabel, rangeDays, rangeIdx, trafficSources } from '../data/agg.js';
const WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const partOfDay = (h) => (h < 5 ? 'nights' : h < 12 ? 'mornings' : h < 17 ? 'afternoons' : h < 22 ? 'evenings' : 'nights');
// Most active times 的 Days 图从 7 天前排起（seed.js ACTIVE_DAYS 第 0 项 = 7 天前那天）
// 20 → 「8 PM」
export const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
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
    const share = nv.value / tv.value;
    // 2026-11-28 copy pass (Yanice: no "9 in 10", no "1/2", the tiles show the numbers; say what changed, why, and what
    // to do). Sentence 1 = how many people you reached against the span before and the post behind it; sentence 2 = who
    // they were and the lesson. The 3-day lag is now on the provenance line, so the paragraph no longer explains it.
    const prevV = tv.value - tv.delta, rv = prevV > 0 ? tv.value / prevV : 1;
    const before = days === 7 ? 'the week before' : `the ${span} before`;
    const amount = rv < 0.65 ? 'far fewer' : rv < 0.9 ? 'fewer' : rv <= 1.1 ? 'about as many' : rv < 1.6 ? 'more' : 'far more';
    const { s: vs, e: ve } = rangeIdx(range, VIEWERS_LAG), vlen = ve - vs + 1;
    let key;
    if (rv < 0.9) {
      // The post that carried the span before has cooled off (it brought most of those views and lost half of them since)
      const lead = topViewsIn(vs - vlen, vs - 1), was = sum(lead.daily, vs - vlen, vs - 1), now = sum(lead.daily, vs, ve);
      const cooled = lead.pubIdx < vs && was >= 0.5 * sum(DAILY.views, vs - vlen, vs - 1) && now <= 0.5 * was;
      key = cooled ? `You reached ${amount} people as ${shortName(lead)} cooled off.` : `You reached ${amount} people than ${before}.`;
    } else if (rv > 1.1) {
      const lead = topViewsIn(vs, ve), most = sum(lead.daily, vs, ve) >= 0.5 * sum(DAILY.views, vs, ve);
      key = `You reached ${amount} people, ${most ? 'mostly thanks to' : 'led by'} ${shortName(lead)}.`;
    } else key = `You reached about as many people as ${before}.`;
    const newWho = share >= 0.85 ? 'Almost all were new to you' : share >= 0.6 ? 'Most were new to you' : share >= 0.4 ? 'About half were new to you' : 'Most had watched you before';
    const ma = mostActive();
    const searchShare = (trafficSources(range).find(([k]) => k === 'Search') || [, 0])[1];
    const qPost = [topViewsIn(vs, ve), ...POSTS].find((p) => p.searchQueries?.length);
    const query = qPost ? qPost.searchQueries[0][0] : null;
    return setProvenance({
      cardTitle: 'Viewer summary',
      key,
      // 2026-11-28 ranking signal = search (08_tiktok_ranking_signals.md): how much Search brings (Traffic source) and
      // the top search term behind the post that brought the most views; the next step is to say that term naturally.
      rest: ` ${newWho}, and search brought ${searchShare < 0.05 ? 'only a few of them' : searchShare < 0.15 ? 'some of them' : 'many of them'}.`,
      // Viewers has no chart under the summary, so it keeps 1–2 bullets (Yanice 2026-11-28); the last is the next step.
      bullets: query ? [`Top search: “${query}”.`, 'Say it in your caption, on screen and aloud.']
        : [`They’re most active ${ma.day} around ${hourLabel(ma.peak)}.`, 'Schedule your next post for then.'],
      next: null,
      info: [
        { ic: 'people', t: 'New viewers', lines: [`${Math.round(nv.value).toLocaleString('en-US')} of ${Math.round(tv.value).toLocaleString('en-US')} viewers were new.`, `${rangeLabel(range, VIEWERS_LAG)}.`] },
        { ic: 'clock', t: 'Most active times', lines: [`${ma.day} had the most activity.`, `${rangeLabel({ key: '7' })}.`] },
      ],
    }, { basis: rangeLabel(range, VIEWERS_LAG), act: 'insight-viewers' });
  }
  const [, net] = followerKpis(range);
  const prev = net.value - net.delta;
  const f = Object.fromEntries(FOLLOWER_INSIGHTS.Gender);
  const { s, e } = rangeIdx(range), len = e - s + 1;
  const prevLabel = `${monDay(dayDate(s - len))} – ${monDay(dayDate(s - 1))}`;
  // 2026-11-28 copy pass (Yanice: "most of your followers are women, you should …", no "2 in 3"; say why and what to
  // do). Sentence 1 = did growth speed up or slow down (the Net followers tile has the numbers); sentence 2 = why: a
  // stretch with no post and no growth, or the post that brought the most followers. Bullets = who they are + next step.
  const n = net.value, diff = n - prev, when = days === 7 ? 'this week' : `in the last ${span}`;
  const key = n < 0 ? `You lost more followers than you gained ${when}.`
    : Math.abs(diff) <= Math.max(1, Math.round(Math.abs(prev) * 0.05)) ? `Your follower growth held steady ${when}.`
    : `Your follower growth ${diff < 0 ? 'slowed' : 'picked up'} ${when}.`;
  const stall = diff <= 0 ? followerStall(range) : null;
  // Followers has no chart under the summary, so it keeps 1–2 bullets (Yanice 2026-11-28): who they are + next step
  const top = topFollowPost(range);
  const rest = stall ? `It stalled for ${numWord(stall.len)} days without a post and only picked up with ${shortName(stall.post)}.`
    : top ? `${cap(shortName(top))} brought the most new followers, so make more like it.` : '';
  return setProvenance({
    cardTitle: 'Follower summary',
    key,
    rest: rest ? ` ${rest}` : '',
    // 2026-11-28 ranking signal = posting rhythm and series: post again before the viewers' peak, number the series
    bullets: [`Post again before ${mostActive().day} ${hourLabel(mostActive().peak)}, their peak.`, 'A numbered series may help them come back.'],
    next: null,
    info: [
      { ic: 'follow', t: 'Net followers', lines: ['Followers gained minus followers lost.', `${rangeLabel(range)}: ${net.value}.`, `${prevLabel}: ${prev}.`] },
      { ic: 'pie', t: 'Follower gender', lines: [`Female ${Math.round(f.Female * 100)}%, male ${Math.round(f.Male * 100)}%, other ${Math.round(f.Other * 100)}%.`] },
    ],
  }, { basis: rangeLabel(range), act: 'insight-followers' });
}

// ---------- AI 结论句（2026-11-26，prompt_pack）----------
// 上面各模块照常用模板算出 key / rest；这里在最后一步换成 AI 生成的句子（./ai/insights.en-US.js），
// 只在快照对应的同一对象上替换，其他情况保留模板。用包装而不改各模块函数体，避免和别的改动冲突。
// 2026-11-28：同时给每张卡登记洞察块下方日期行用的数据窗口（agg.js rangeLabel）和反馈按钮的 data-act 前缀（provenance.js）。
// Overview / Content 的分数只按最近 7 天算；作品按 E 的比较窗口（发布后前 W 天）；他人作品是发布至今。
// A post's window can sit in an earlier year: show the year then, so "Oct 25 – Nov 23" is not read as this autumn
const spanLabel = (s, e) => (dayDate(e).getFullYear() === dayDate(PERIOD_END).getFullYear() ? rangeLabel({ key: 'custom', s, e })
  : dayDate(s).getFullYear() === dayDate(e).getFullYear() ? `${monDay(dayDate(s))} – ${monDayYear(dayDate(e))}` : `${monDayYear(dayDate(s))} – ${monDayYear(dayDate(e))}`);
const postWindow = (p) => spanLabel(p.pubIdx, p.pubIdx + Math.min(ageOf(p), E_WINDOW_MAX) - 1);
const otherWindow = (item) => spanLabel(PERIOD_END - Math.max(1, item.postedDaysAgo), PERIOD_END);
{
  const A = buildModuleA, Bm = buildModuleB, C = buildModuleC, D = buildModuleD, E = buildModuleE, Cu = buildCurated, Sa = summaryAnswer;
  buildModuleA = (range) => setProvenance(withAI('performance_summary', A(range)), { basis: rangeLabel({ key: '7' }), act: 'insight-a' });
  buildModuleB = (range) => setProvenance(withAI('content_summary', Bm(range)), { basis: rangeLabel({ key: '7' }), act: 'insight-b' });
  buildModuleC = (q, ins) => setProvenance(withAI('topic_search', C(q, ins), String(q || '').trim().toLowerCase()), { basis: rangeLabel(TOPIC_WINDOW), act: 'insight-c' });
  // D 的 AI 句是按评论话题写的，所以只在显示评论话题时使用
  buildModuleD = (item, opts = {}) => setProvenance(withAI('other_post', D(item, opts), item && opts.topics && opts.topics.length >= 2 ? `other:${item.id}` : null), item ? { basis: otherWindow(item), act: 'insight-d' } : null);
  // 2026-11-28：post_overview 已按同类视频口径重新生成（pack 2026-11-28.10），恢复 AI 句
  buildModuleE = (p) => setProvenance(withAI('post_overview', E(p), p ? `post:${p.id}` : null), p ? { basis: postWindow(p), act: 'insight-e' } : null);
  buildCurated = (base, opts) => { const r = Cu(base, opts); return { ...r, cards: r.cards.map(curatedWithAI) }; };
  summaryAnswer = () => summaryWithAI(Sa());
}

// ---------- 雷达对比卡：同类组大小（radarStats.js 用；和 postRadar 同一个窗口、同一个时长档） ----------
export function postRadarGroupSize(p) {
  if (!p || !p.daily) return 0;
  const age = ageOf(p);
  return age < 1 ? 0 : peerPostsFor(p, Math.min(age, E_WINDOW_MAX)).length;
}
