// V4 子流程补充：官方帮助 / Creator Academy（2026-08）写明、但美国录屏没拍到的子流程
// - Creator Assistant（CA6）：Home / Analytics Overview / 作品详情的内嵌卡片 → 欢迎页（第一次）→ 对话页；首次打开后常驻 Inbox
// - Creator Weekly Report（CA7）：2026-11-26 按 Yanice 要求从原型删除
// - 作品改隐私 / 删除、评论删除（H1 Manage）
// - 评论 AI 话题总结（H1 Insights、H12 Comment insights）+ 设置 Privacy → Comments 两个开关（H12）
// 界面视觉为按 Studio 现有组件推断的样式，证据等级记在覆盖表里，界面内不写。
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store.js';
import { NavBar, Scroll, Cover, Avatar, Section } from '../ui/kit.jsx';
import { SheetFrame } from '../shell/Overlays.jsx';
import { I } from '../ui/Icons.jsx';
import { POSTS, POST_BY_ID, INSPIRATION, ACCOUNT, ACTIVE_DAYS, activeHours, DAILY, PERIOD_END } from '../data/seed.js';
import { fmt, fmtFull, fmtMoney, overviewKpis, topPosts, trafficSources } from '../data/agg.js';
import { ASSISTANT_DEMO } from '../insight/demo/assistant.js';
import { AiStar } from '../insight/CardParts.jsx';
import { AssistantWelcome, AssistantAnswer } from '../insight/AssistantAnswer.jsx';
import { mostActive, commentTopics, dropMoment, videoAnswer, summaryAnswer, buildModuleA, buildModuleB, buildModuleD, buildModuleE, otherPostTopics, postName, rewardsSplit } from '../insight/build.js';
import '../insight/assistant.css';

const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hourLabel = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`;

// ---------------- Creator Assistant ----------------
export const PROMPT_GROUPS = [
  { title: 'Analyze your data', items: ['What can you do to increase your engagement?', 'What was your account traffic this month?', 'How’s your video performance?', 'When are your followers the most active?'] },
  { title: 'Find inspiration', items: ['What’s trending in travel right now?', 'Show high performers in your niche.', 'What do your followers like to watch?'] },
  { title: 'Platform rules', items: ['What’s TikTok’s Originality Policy?', 'How can I join the Creator Rewards Program?', 'What monetization tools are there on TikTok?'] },
];

function weekStats() {
  const k = overviewKpis({ key: '7' }, 'us');
  const by = Object.fromEntries(k.map((x) => [x.key, x]));
  const top = topPosts('views', { key: '7' }, 1)[0];
  const k28 = overviewKpis({ key: '28' }, 'us');
  return { by, top, k28: Object.fromEntries(k28.map((x) => [x.key, x])) };
}
const pctTxt = (p) => (p == null ? '—' : `${p >= 0 ? '+' : '−'}${Math.abs(p * 100).toFixed(1)}%`); // 一位小数，和 Key metrics 一致


// ---------- 2026-11-26：入口轮播问题的回答（都按数据现算） ----------
const n1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const sumDays = (arr, a, b) => { let t = 0; for (let i = a; i <= b; i++) t += arr[i] || 0; return t; };
function answerPlus(q, ctx) {
  const post = ctx?.postId ? POST_BY_ID[ctx.postId] : null;
  const item = ctx?.itemId ? INSPIRATION.find((x) => x.id === ctx.itemId) : null;
  const E = PERIOD_END;
  // 别人的作品（模块 D 的入口）
  if (item) {
    const topics = otherPostTopics(item);
    const D = buildModuleD(item, { topics });
    const rates = D.rows.slice(1).map((r) => `${r.label}: ${r.val}, your typical post ${r.yv}`);
    if (/learn from this post/i.test(q)) return { text: `${D.key}${D.rest}\n\n${[...rates, 'Views depend on account size, so compare the rates, not the totals'].map((x, i) => `${i + 1}. ${x}`).join('\n')}`, cards: [] };
    if (/ask about|comments/i.test(q) && topics) return { text: `${topics.length} topics come up in this post’s comments.\n\n${topics.map((t, i) => `${i + 1}. ${t[0]}: ${fmt(t[2])} comments`).join('\n')}`, cards: [] };
    if (/try this|next post/i.test(q)) {
      const t = topics?.[0];
      const lines = [t ? `Answer the top comment topic up front: ${t[0].toLowerCase()}` : 'Keep your usual format and change one thing at a time', 'Put the details in the caption or a pinned comment so people can save them', ...(item.id === 'insp3' ? ['Curated for you already has a matching idea: Amalfi on a budget, every cost listed'] : [])];
      return { text: `Borrow what viewers respond to, not the video itself.\n\n${lines.map((x, i) => `${i + 1}. ${x}`).join('\n')}`, cards: [{ label: 'See ideas for you', go: ['tab', 'create'] }] };
    }
  }
  // 我的作品（模块 E 的入口）
  if (post) {
    const Em = buildModuleE(post);
    const area = (n) => Em?.areas.find((a) => a.name === n);
    const lines = (a) => a.lines.slice(1).map((x, i) => `${i + 1}. ${x}`).join('\n');
    if (Em && /similar (creators|videos)/i.test(q)) return { text: `${Em.key}${Em.rest}\n\n${Em.areas.map((a, i) => `${i + 1}. ${a.name} ${a.you}: ${a.lines[1]}`).join('\n')}`, cards: [] };
    if (/views come from/i.test(q)) {
      const src = Object.entries(post.traffic).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const sq = post.searchQueries?.length ? [`Top search term: “${post.searchQueries[0][0]}”`] : ['Search traffic is too low to show search terms yet'];
      return { text: `“${postName(post)}” has ${fmt(post.views)} views.\n\n${[...src.map(([k, v]) => `${(v * 100).toFixed(1)}% from ${k}`), ...sq].map((x, i) => `${i + 1}. ${x}`).join('\n')}`, cards: [] };
    }
    if (Em && /like this post|more likes/i.test(q)) return { text: `Likes score ${area('Likes').you} against 50 for a typical post by similar creators.\n\n${lines(area('Likes'))}`, cards: [] };
    if (Em && /share this post|shares and saves/i.test(q)) return { text: `Shares score ${area('Shares').you} against 50 for a typical post by similar creators.\n\n${lines(area('Shares'))}`, cards: [] };
    if (Em && /new followers\?|into followers/i.test(q)) return { text: `Follows score ${area('Follows').you} against 50 for a typical post by similar creators.\n\n${lines(area('Follows'))}`, cards: [] };
  }
  // 账号（首页、模块 A / B 的入口）
  if (/today/i.test(q)) {
    const tp = [...POSTS].sort((a, b) => (b.daily[E] || 0) - (a.daily[E] || 0))[0];
    return { text: `Today so far: ${fmtFull(DAILY.views[E])} views, ${fmtFull(DAILY.likes[E])} likes and ${fmtFull(DAILY.profile[E])} profile views. Today’s numbers are still coming in.\n\n1. Yesterday you had ${fmtFull(DAILY.views[E - 1])} views, the most this week\n2. “${postName(tp)}” brought ${fmtFull(tp.daily[E])} of today’s views`, cards: [{ label: 'View key metrics', go: ['analytics', 'overview'] }] };
  }
  const { by } = weekStats();
  if (/views come from/i.test(q)) {
    const src = trafficSources({ key: '7' }).slice(0, 3);
    const t1 = topPosts('views', { key: '7' }, 1)[0];
    return { text: `In the last 7 days, most of your ${fmt(by.views.value)} views came from For You.\n\n${[...src.map(([k, v]) => `${(v * 100).toFixed(1)}% from ${k}`), `“${postName(t1.post)}” brought ${Math.round((t1.value / by.views.value) * 100)}% of all views`].map((x, i) => `${i + 1}. ${x}`).join('\n')}`, cards: [{ label: 'View traffic source', go: ['analytics', 'overview'] }] };
  }
  if (/why did (my|your) views (fall|rise)/i.test(q)) {
    const t1 = topPosts('views', { key: '7' }, 1)[0];
    const d = Array.from(DAILY.views.slice(E - 6, E + 1));
    return { text: `Post views ${by.views.delta < 0 ? 'fell' : 'rose'} ${Math.abs(by.views.deltaPct * 100).toFixed(1)}% to ${fmt(by.views.value)}.\n\n1. Daily views slid from ${fmtFull(d[0])} to ${fmtFull(d[4])} before your new post\n2. “${postName(t1.post)}” went up on ${t1.post.publishedAt.toLocaleString('en-US', { month: 'short', day: 'numeric' })} and brought ${Math.round((t1.value / by.views.value) * 100)}% of the week’s views\n3. ${(trafficSources({ key: '7' })[0][1] * 100).toFixed(1)}% of views came from For You`, cards: [{ label: 'View key metrics', go: ['analytics', 'overview'] }] };
  }
  if (/drove ((my|your) )?views/i.test(q)) {
    const rows = topPosts('views', { key: '7' }, 3);
    return { text: `These posts drove most of your ${fmt(by.views.value)} views in the last 7 days.\n\n${rows.map((r, i) => `${i + 1}. “${postName(r.post)}”: ${fmt(r.value)} views`).join('\n')}`, cards: [{ label: 'View top posts', go: ['analytics', 'content'] }] };
  }
  if (/visiting (my|your) profile|profile visits/i.test(q)) {
    const pv = by.profile.value, pvp = pv - by.profile.delta, v = by.views.value, vp = v - by.views.delta;
    const A = buildModuleA({ key: '7' }), vis = A?.areas.find((a) => a.name === 'Visits');
    return { text: `Profile views ${pv < pvp ? 'fell' : 'rose'} ${Math.abs(by.profile.deltaPct * 100).toFixed(1)}% to ${pv}, but views fell more, so more of your viewers went on to your profile.\n\n1. Profile views per 1K views: ${n1((pvp / vp) * 1000)} → ${n1((pv / v) * 1000)}\n2. Visits score ${vis ? vis.you : '—'}, against 50 for a typical similar creator\n3. End with a reason to check your other posts`, cards: [] };
  }
  if (/rewards (are )?worked out|on track for creator rewards/i.test(q)) {
    const { total, crp, gifts } = rewardsSplit(7);
    const followers = DAILY.followersTotal[E], v30 = sumDays(DAILY.views, E - 29, E);
    const head = /on track/i.test(q) ? `Yes. You have ${fmtFull(followers)} followers and ${fmtFull(v30)} video views in the last 30 days, so you meet all three requirements.` : 'Estimated rewards come from your posts over 1 minute in the Creator Rewards Program, plus LIVE Gifts.';
    return { text: `${head}\n\n1. This week: ${fmtMoney(total)}, ${by.rewards.delta < 0 ? 'down' : 'up'} ${Math.abs(by.rewards.deltaPct * 100).toFixed(1)}%\n2. ${fmtMoney(crp)} from Creator Rewards Program posts, ${fmtMoney(gifts)} from LIVE Gifts\n3. Only posts longer than 1 minute earn Creator Rewards`, cards: [{ label: 'View rewards analytics', go: ['route', 'rewardsAnalyticsUS'] }] };
  }
  if (/new viewers/i.test(q)) {
    const rows = topPosts('newViewers', { key: '7' }, 3);
    return { text: `These posts brought the most new viewers in the last 7 days.\n\n${rows.map((r, i) => `${i + 1}. “${postName(r.post)}”: ${fmt(r.value)} new viewers`).join('\n')}`, cards: [{ label: 'View top posts', go: ['analytics', 'content'] }] };
  }
  if (/new followers|followers slow|brought new followers/i.test(q)) {
    const B = buildModuleB({ key: '7' }), f = B?.areas.find((a) => a.name === 'Followers');
    const rows = topPosts('newFollowers', { key: '7' }, 3);
    return { text: `${f ? f.lines[1] : ''}. ${f ? f.dd.sub.charAt(0).toUpperCase() + f.dd.sub.slice(1) : ''}.\n\n${rows.map((r, i) => `${i + 1}. “${postName(r.post)}”: ${fmt(r.value)} new followers`).join('\n')}`, cards: [{ label: 'View top posts', go: ['analytics', 'content'] }] };
  }
  return null;
}

// 根据真实（模拟）数据生成回答：每条回答可带「卡片」跳转到对应页面
function answer(q, ctx) {
  const plusAns = answerPlus(q, ctx);
  if (plusAns) return plusAns;
  const { by, top, k28 } = weekStats();
  const post = ctx?.postId ? POST_BY_ID[ctx.postId] : null;
  // 2026-11-28：和卡片同一口径（同类创作者），不再和前 7 天比
  if (/engagement|likes and comments|like (my|your) posts|likes drop/i.test(q)) {
    const eg = buildModuleA({ key: '7' })?.areas.find((a) => a.name === 'Engagement');
    return { text: `${eg ? `Your engagement ${eg.sentence}` : 'Here is how to get more likes and comments.'} Try:\n\n1. Ask a question in the first 3 seconds\n2. Pin a comment that asks where to go next\n3. Reply with a video to your most-liked question`, cards: [{ label: 'Reply to comments', go: ['tab', 'manage', 'comments'] }] };
  }
  if (/shares/i.test(q)) {
    const sa = buildModuleA({ key: '7' })?.areas.find((a) => a.name === 'Shares');
    return { text: `${sa ? `${sa.lines[1]} for a typical similar creator, a score of ${sa.you}.` : `You got ${fmt(by.shares.value)} shares in the last 7 days.`} To get more:\n\n1. Ask viewers to send it to the friend they would go with\n2. Pin a comment that asks who they would take`, cards: [{ label: 'View key metrics', go: ['analytics', 'overview'] }] };
  }
  const src28 = trafficSources({ key: '28' });
  if (/traffic/i.test(q)) return { text: `In the last 28 days your posts got ${fmt(k28.views.value)} views (${pctTxt(k28.views.deltaPct)}) and ${fmt(k28.profile.value)} profile views. Most of your views came from the ${src28[0][0]} feed, followed by ${src28[1][0] === 'Personal profile' ? 'your profile page' : src28[1][0]}.`, cards: [{ label: 'View traffic source', go: ['analytics', 'overview'] }] };
  if (/video performance|this post|performing|viewers leave/i.test(q)) {
    const p = post || top?.post;
    return { text: p ? `“${p.title.split('#')[0].trim()}” has ${fmt(p.views)} views and ${fmt(p.likes)} likes. On average viewers watched ${Math.round(p.avgPct * 100)}% of it, and most left at ${dropMoment(p)}. Try showing the payoff in the first second.` : 'You haven’t posted in the last 7 days.', cards: p ? [{ label: 'Open video analysis', go: ['post', p.id] }] : [] };
  }
  if (/most active|followers.*active|when should i post/i.test(q)) {
    // 和 Viewer summary、Most active 图同一个来源（build.js mostActive）：ACTIVE_DAYS 按日期对应星期，不是按 Sunday 起算
    const ma = mostActive();
    return { text: `Your audience is most active on ${ma.day}s, around ${hourLabel(ma.peak)}. Posting 1–2 hours before that gives your video time to be picked up.`, cards: [{ label: 'View follower activity', go: ['analytics', 'followers'] }] };
  }
  if (/trending|high performers|niche|followers like|\bideas?\b/i.test(q)) return { text: 'Here are posts performing well with audiences similar to yours this week:', posts: INSPIRATION.slice(0, 3), cards: [{ label: 'Get more inspiration', go: ['route', 'creatorInspiration'] }] };
  if (/high quality|stronger hook/i.test(q)) return { text: 'High-quality videos are original, hold attention and are easy to follow. A few things that usually help:\n\n1. Hook viewers in the first 2 seconds\n2. Film in good light at 1080p or higher\n3. Keep one clear idea per video\n4. Add a description with relevant keywords so the video can be found in Search', cards: [{ label: 'Get more inspiration', go: ['route', 'creatorInspiration'] }] };
  if (/originality/i.test(q)) return { text: 'Original content is content you create yourself, or that adds substantial creative value to other material — like commentary, editing or a new perspective. Reposting others’ content without meaningful changes isn’t eligible for the For You feed or rewards.', cards: [{ label: 'Learn more on Creator Academy', go: ['external'] }] };
  if (/rewards program|join/i.test(q)) return { text: 'To join the Creator Rewards Program you need to be 18 or older, have at least 10,000 followers and 100,000 video views in the last 30 days. Videos must be over 1 minute long to earn rewards.', cards: [{ label: 'View Creator Rewards Program', go: ['route', 'creatorRewards'] }] };
  if (/monetization tools/i.test(q)) return { text: 'Depending on eligibility, you can earn with the Creator Rewards Program, Subscription, TikTok Shop, Creator Marketplace, LIVE Gifts and Service+.', cards: [{ label: 'Open Monetization', go: ['route', 'monetization'] }] };
  return { text: `Thanks for the question! Your top post this week is “${top ? top.post.title.split(/[#,]/)[0].trim() : '—'}”. Views are ${pctTxt(by.views.deltaPct)} this week — posting at least 3 times a week usually keeps reach steady.`, cards: [] };
}

function useGo() {
  const push = useApp((s) => s.push); const switchTab = useApp((s) => s.switchTab);
  return (go) => {
    if (!go) return;
    const [k, a, b] = go;
    if (k === 'post') push('videoAnalysis', { postId: a });
    else if (k === 'analytics') { switchTab('analytics'); useApp.setState({ aTab: a }); }
    else if (k === 'tab') { switchTab(a); if (b) useApp.setState((s) => ({ manage: { ...s.manage, tab: b } })); }
    else if (k === 'route') push(a);
    else if (k === 'external') useApp.getState().showAlert({ title: 'Open Creator Academy?', message: 'This will open tiktok.com in your browser.', actions: [{ label: 'Cancel' }, { label: 'Open', bold: true }] });
  };
}

// ---------------- Creator Assistant：界面按主 App 内 Studio 的实物（creatoracademy 2025-11-11、chriscoxtoks 2025-03-15） ----------------
// 图标：C 形机器人（上青下靛的渐变描边 + 两个深色圆点）
export function CaIcon({ size = 24 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="ca-ic" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id={`cag${id}`} x1="16" y1="4" x2="7" y2="20" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#4fe3e6" /><stop offset=".45" stopColor="#2f62f2" /><stop offset="1" stopColor="#1d0f8a" /></linearGradient></defs>
      <path d="M21 8.9C20.1 6.4 17.9 5 15.2 5H9.6a7 7 0 0 0 0 14h5.6c2.7 0 4.9-1.4 5.8-3.9" fill="#fff" stroke={`url(#cag${id})`} strokeWidth="3.2" />
      <circle cx="9.7" cy="12" r="1.55" fill="#1b1470" /><circle cx="14.3" cy="12" r="1.55" fill="#1b1470" />
    </svg>
  );
}
const Arrow = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" /></svg>;

// 欢迎页的 4 个问题和问候语是实物原文（creatoracademy 0:14、0:23）
export const CA_HELLO = ASSISTANT_DEMO.welcome.greeting;
const CA_STARTERS = ASSISTANT_DEMO.welcome.questions.map((x) => [x.icon, x.text]);
const kk = (n) => (n >= 1000 ? `${(n / 1000).toFixed(2)}k` : String(n));
const AVG_VIEWS = Math.round(POSTS.reduce((a, p) => a + p.views, 0) / POSTS.length);
const AVG_LIKE = POSTS.reduce((a, p) => a + p.likes, 0) / POSTS.reduce((a, p) => a + p.views, 0);

// 作品分析的回答：句式照实物（chriscoxtoks 0:14、0:40），数字用这条作品的模拟数据
function postAnalysis(p) {
  const up = p.views >= AVG_VIEWS, lr = p.likes / p.views, lrUp = lr >= AVG_LIKE;
  const pct = (x) => `${(x * 100).toFixed(2)}%`;
  return {
    postId: p.id,
    text: `Hello there! I’m analyzing your video’s performance and engagement metrics.\n\nYour video has received ${up ? 'an impressive ' : ''}${kk(p.views)} plays, which is a significant ${up ? 'increase from' : 'drop from'} your average of ${kk(AVG_VIEWS)}. ${up ? 'The engagement rates are also promising' : 'The engagement rates tell a similar story'}: the like rate is slightly ${lrUp ? 'higher' : 'lower'} at ${pct(lr)}, and the share, favorite, and follow rates are close to your average.\n\n${lrUp ? 'To keep the momentum, consider posting a follow-up while this video is still being recommended, and reply to the top comments to encourage more engagement.' : 'To increase engagement, consider adding a creative twist to your travel videos, such as showing the best view in the first two seconds to capture viewers’ attention and encourage more likes.'}`,
    cards: [{ label: 'Open video analysis', go: ['post', p.id] }],
  };
}
const postInsight = (p) => postAnalysis(p).text.split('\n\n')[1];

// 内嵌卡片（不是弹窗，没有关闭按钮）：图标 + Creator Assistant + 「Ask more ›」，下面一块浅蓝底文字和一小段粉色短条
export function AssistantPopup({ where, postId }) {
  const push = useApp((s) => s.push);
  const newAccount = useApp((s) => s.newAccount);
  const market = useApp((s) => s.market);
  if (newAccount || market === 'store') return null; // US：需 10K+ 粉
  const post = postId && POST_BY_ID[postId];
  return (
    <button className={`ca-in ca-in-${where}`} data-act={`assistant-pop-${where}`} onClick={() => push('creatorAssistant', { postId, from: where })}>
      <span className="ca-in-head"><CaIcon size={24} /><b>Creator Assistant</b><em>Ask more<I.right size={14} /></em></span>
      <span className="ca-in-body"><span>{post ? postInsight(post) : CA_HELLO}</span></span>
      <i className="ca-in-bar" />
    </button>
  );
}

// 设计稿（design_final/assistant）：欢迎不再是单独一页，而是对话的第一屏；回答 = 一句结论 + 要点 + 一个模块。
// 回答内容全部来自 src/insight/demo/assistant.js（之后换成 API 生成的内容）。
const CA_KINDS = ASSISTANT_DEMO.kinds;
// 从某个模块的「Ask Creator Assistant」进来时，直接给出对应的回答；其余入口（home / insights / Inbox）先出欢迎
const CA_CONTEXT_KIND = { analytics: 'summary', post: 'video' };
// 「作品表现」的回答按作品现算（入口作品；从别处问就用最新一条），其他回答用 demo/assistant.js
// Overview 进来的回答按模块 A 的最弱项生成（2026-11-26 改为公式算分后，最弱项是 Engagement）
const kindData = (kind, postId) => (kind === 'video' ? videoAnswer(POST_BY_ID[postId] || POSTS[POSTS.length - 1]) : kind === 'summary' ? summaryAnswer() : CA_KINDS[kind]);
function kindFor(q) {
  const t = q.trim();
  const exact = Object.keys(CA_KINDS).find((k) => CA_KINDS[k].question === t);
  if (exact) return exact;
  if (t === summaryAnswer()?.question || /work on first/i.test(t)) return 'summary'; // 页面级问题：回答「最弱的一项先改」
  if (/post next|did best|most views\?/i.test(t)) return 'next';
  if (/^how do i compare with similar creators\?$/i.test(t)) return 'summary'; // 2026-11-27：模块 A 的分数改成和同类创作者比
  if (/weekly performance/i.test(t)) return 'traffic';
  if (/video performance|performing|viewers leave|doing\?$/i.test(t)) return 'video';
  return null;
}
// 从哪里进来：对话顶部的来源标签，和输入框的占位提示（跟着入口场景走）
function fromLabel(params) {
  const f = params?.from;
  if (f === 'analytics') return 'From Performance summary';
  if (f === 'content') return 'From Content summary';
  if (f === 'post' && POST_BY_ID[params.postId]) return `From Video analysis · ${postName(POST_BY_ID[params.postId])}`;
  if (f === 'insights' && params.itemId) { const it = INSPIRATION.find((x) => x.id === params.itemId); if (it) return `From Analysis · @${it.creator}`; }
  return undefined;
}
function placeholderFor(params) {
  const f = params?.from;
  if (f === 'home') return 'Ask about your account';
  if (f === 'analytics') return 'Ask about your last 7 days';
  if (f === 'content') return 'Ask about your top posts';
  if (f === 'post' && POST_BY_ID[params.postId]) return `Ask about “${postName(POST_BY_ID[params.postId])}”`;
  if (f === 'insights') return 'Ask what you can learn from this post';
  return ASSISTANT_DEMO.placeholder;
}
// 设计稿没有模块的问题：没问过的现有问题 + 两个设计稿里有回答的问题
const CA_MORE = [CA_KINDS.next.question, summaryAnswer()?.question].filter(Boolean);

// 点示例问题后的回复（2026-11-26 按 Yanice 要求）：原型里 Creator Assistant 只作设计参考，不生成回答
const PREVIEW_REPLY = 'This prototype presents Creator Assistant as a design reference. Live answers rely on backend services and agent orchestration, including secure access to account data, tool calls and response checks, which are outside the scope of this build. The rest of the prototype runs on sample data.';

export function CreatorAssistantScreen({ params }) {
  const thread = useApp((s) => s.assistantThread);
  const pop = useApp((s) => s.pop);
  const openSheet = useApp((s) => s.openSheet);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState({});
  const busyRef = useRef(false), timers = useRef([]), booted = useRef(false);
  const go = useGo();
  const scrollRef = useRef(null), anchorRef = useRef(null);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // 新的一轮（提问 / 入口说明）滚到顶部，回答从上往下读
  useEffect(() => {
    const sc = scrollRef.current; if (!sc) return;
    const top = anchorRef.current ? Math.max(0, anchorRef.current.offsetTop - sc.offsetTop - 12) : 0;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (sc.scrollTo) sc.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' }); else sc.scrollTop = top;
  }, [thread.length, busy]);

  // 回答先出「…」，再整条出现
  const say = (msg, delay = 700) => {
    busyRef.current = true; setBusy(true);
    timers.current.push(setTimeout(() => {
      useApp.setState((s) => ({ assistantThread: [...s.assistantThread, { me: false, ...msg }] }));
      busyRef.current = false; setBusy(false);
    }, delay));
  };
  const sayKind = (kind, extra, delay) => say({ kind, postId: params?.postId, text: kindData(kind, params?.postId).headline, ...extra }, delay);
  const ask = (q, from) => {
    if (!q.trim() || busyRef.current) return;
    useApp.setState((s) => ({ assistantThread: [...s.assistantThread, { me: true, text: q.trim(), ...(from ? { from } : {}) }] }));
    setInput('');
    // 原型不生成回答：点任何示例问题都回复同一段说明
    say({ text: PREVIEW_REPLY, cards: [], preview: true });
  };
  useEffect(() => {
    // 进入时只显示 onboarding 第一屏：每次都是新的对话，不替用户发问题，也不自动回答（2026-11-26 按反馈）
    useApp.setState({ assistantOpened: true, assistantThread: [] });
  }, []);

  const last = thread[thread.length - 1];
  const asked = new Set(thread.filter((m) => m.me).map((m) => m.text));
  const follow = !last || last.me ? [] : last.kind
    ? (CA_KINDS[last.kind]?.chips || [])
    : [...CA_MORE, ...CA_STARTERS.map((x) => x[1]), ...PROMPT_GROUPS.flatMap((g) => g.items)].filter((q, i, a) => a.indexOf(q) === i && !asked.has(q)).slice(0, 5);
  const showChips = false; // 回复后不再给追问建议
  // 这一轮从哪条开始：最后一条提问；没有提问（周报入口）就是最后一条回答
  let anchor = thread.length - 1;
  while (anchor > 0 && !thread[anchor].me && thread[anchor - 1]?.me) anchor -= 1;
  return (
    <div className="screen ca-screen cax-screen">
      <div className="ca-head">
        <button className="nb-back" data-act="nav-back" onClick={pop} aria-label="Back"><I.back size={26} /></button>
        <CaIcon size={30} /><b>Creator Assistant</b>
        <button className="ca-more" data-act="assistant-more" aria-label="More" onClick={() => openSheet('assistantMore')}><I.more size={22} /></button>
      </div>
      <div className="cax-body">
        <Scroll className="cax-scroll" innerRef={scrollRef}>
          {/* Final W2（画板 IMY-CA-Welcome，已选）：onboarding 就是对话的第一屏——问候语 + 「Feel free to ask me questions like」问题卡，
              从任何入口进来都在对话顶部；问候 260ms 上浮淡入，问题卡晚 80ms */}
          <div className="cax-bubble hello cax-in">{ASSISTANT_DEMO.welcome.greeting}</div>
          <AssistantWelcome onAsk={ask} />
          {thread.map((m, i) => {
            const ref = i === anchor ? anchorRef : undefined;
            if (m.me) return [
              m.from && <span key={`f${i}`} className="cax-from cax-in" ref={ref}>{m.from}</span>,
              <span key={i} className="cax-me cax-in" ref={m.from ? undefined : ref}>{m.text}</span>,
            ];
            return [
              m.from && <span key={`f${i}`} className="cax-from bot" ref={ref}>{m.from}</span>,
              <div key={i} className="cax-msg-bot" ref={m.from ? undefined : ref}>
                <AssistantAnswer kind={m.kind} postId={m.postId} text={m.text} fb={fb[i]} onFb={(k) => { setFb({ ...fb, [i]: fb[i] === k ? null : k }); if (fb[i] !== k) useApp.getState().showToast('Thanks for your feedback'); }}>
                  {!m.kind && (m.posts || m.cards?.length > 0) && (
                    <div className="cax-links">
                      {m.posts?.map((x) => <button key={x.id} className="cax-linkpost" data-act="assistant-post" onClick={() => useApp.getState().push('searchPlayer', { id: x.id })}><Cover item={x} w={104} h={138} radius={8} text={false} /><span>{fmt(x.views)} views</span></button>)}
                      {m.cards?.map((c) => <button key={c.label} className="cax-link" data-act="assistant-card" onClick={() => go(c.go)}>{c.label}<I.right size={14} /></button>)}
                    </div>
                  )}
                </AssistantAnswer>
              </div>,
            ];
          })}
          {busy && <div className="cax-bubble ca-typing"><i /><i /><i /></div>}
          <div className={`cax-end ${showChips ? 'chips' : ''}`} />
        </Scroll>
      </div>
      {/* 没有输入框：原型里不提供自由提问（2026-11-26 按反馈） */}
      {/* 输入框下方不放说明（2026-11-26 按反馈删掉）；用户自己输入的问题在对话里说明只是 mock data */}
    </div>
  );
}

// 对话页右上角「…」：实物里只看到按钮，没看到点开后的内容；这里的两项是原型自己补的
// 「为什么不是实时 AI」说明
const PREVIEW_INFO = [
  ['UI reference only', 'Creator Assistant is shown here as an interface. Its replies come from scripted rules over this prototype’s sample data.'],
  ['Why it isn’t live', 'A working assistant needs an agent harness: access to account data, tools it can call, and safety checks on every answer. That is the feasibility blocker for this prototype, so no model is connected.'],
  ['What is AI-written', 'The insight sentences on the cards were generated with Claude ahead of time, from the same sample data.'],
];
export function AssistantPreviewSheet() {
  return (
    <SheetFrame title="About this preview">
      <div className="cax-pv">
        {PREVIEW_INFO.map(([t, d]) => <div key={t} className="cax-pv-item"><b>{t}</b><span>{d}</span></div>)}
      </div>
    </SheetFrame>
  );
}

export function AssistantMoreSheet() {
  const close = useApp((s) => s.closeSheet);
  return (
    <SheetFrame noHeader>
      <div className="pa-menu">
        <button className="danger" data-act="assistant-clear" onClick={() => { close(); useApp.setState({ assistantThread: [] }); useApp.getState().showToast('Chat history cleared'); }}><span>Clear chat history</span></button>
        <button data-act="assistant-feedback" onClick={() => { close(); useApp.getState().showToast('Thanks for your feedback'); }}><span>Share feedback</span></button>
        <button className="pa-cancel" data-act="assistant-more-cancel" onClick={close}>Cancel</button>
      </div>
    </SheetFrame>
  );
}

// ---------------- 作品操作：隐私 / 删除（H1 Manage → Posts） ----------------
const PRIV = [['everyone', 'Everyone'], ['friends', 'Friends'], ['only_you', 'Only you']];
export function PostActionsSheet({ postId }) {
  const close = useApp((s) => s.closeSheet);
  const p = POST_BY_ID[postId] || useApp.getState().userPosts.find((x) => x.id === postId);
  const edit = useApp((s) => s.postEdits[postId]) || {};
  const [view, setView] = useState('menu');
  const privacy = edit.privacy || p?.privacy || 'everyone';
  if (!p) return null;
  const del = () => {
    close();
    setTimeout(() => useApp.getState().showAlert({
      title: 'Delete post?', message: 'You won’t be able to recover it. It will also be deleted from TikTok.',
      actions: [{ label: 'Cancel' }, { label: 'Delete', destructive: true, onPress: () => {
        useApp.setState((s) => ({ postEdits: { ...s.postEdits, [postId]: { ...s.postEdits[postId], deleted: true } } }));
        const st = useApp.getState(); if (st.stacks[st.tab]?.some((r) => r.name === 'videoAnalysis')) st.pop();
        setTimeout(() => useApp.getState().showToast('Post deleted'), 350);
      } }],
    }), 260);
  };
  return (
    <SheetFrame title={view === 'menu' ? '' : 'Who can view this post'} noHeader={view === 'menu'}>
      {view === 'menu' ? (
        <div className="pa-menu">
          <button data-act="post-action-privacy" onClick={() => setView('privacy')}><I.lock size={20} /><span>Privacy settings</span><em>{PRIV.find((x) => x[0] === privacy)[1]}</em><I.right size={16} /></button>
          <button data-act="post-action-analytics" onClick={() => { close(); useApp.getState().push('videoAnalysis', { postId }); }}><I.analytics size={20} /><span>View analytics</span><I.right size={16} /></button>
          <button data-act="post-action-delete" className="danger" onClick={del}><I.trash size={20} /><span>Delete</span></button>
          <button className="pa-cancel" data-act="post-action-cancel" onClick={close}>Cancel</button>
        </div>
      ) : PRIV.map(([k, l]) => (
        <button key={k} className="opt-row" data-act={`post-privacy-${k}`} onClick={() => { useApp.setState((s) => ({ postEdits: { ...s.postEdits, [postId]: { ...s.postEdits[postId], privacy: k } } })); close(); useApp.getState().showToast('Privacy updated'); }}>
          <span>{l}</span><span className={`radio ${privacy === k ? 'on' : ''}`}><i /></span>
        </button>
      ))}
    </SheetFrame>
  );
}

// ---------------- 评论操作：删除（H1 Manage → Comments） ----------------
export function CommentActionsSheet({ commentId, handle }) {
  const close = useApp((s) => s.closeSheet);
  return (
    <SheetFrame noHeader>
      <div className="pa-menu">
        <button data-act="comment-action-reply" onClick={() => { close(); setTimeout(() => useApp.getState().openSheet('reply', { commentId, handle }), 260); }}><I.comment size={20} /><span>Reply</span></button>
        <button data-act="comment-action-copy" onClick={() => { close(); useApp.getState().showToast('Copied'); }}><I.copy size={20} /><span>Copy</span></button>
        <button data-act="comment-action-delete" className="danger" onClick={() => { close(); setTimeout(() => useApp.getState().showAlert({ title: 'Delete comment?', message: `@${handle}’s comment will be removed from your post.`, actions: [{ label: 'Cancel' }, { label: 'Delete', destructive: true, onPress: () => { useApp.setState((s) => ({ deletedComments: { ...s.deletedComments, [commentId]: true } })); useApp.getState().showToast('Comment deleted'); } }] }), 260); }}><I.trash size={20} /><span>Delete</span></button>
        <button className="pa-cancel" data-act="comment-action-cancel" onClick={close}>Cancel</button>
      </div>
    </SheetFrame>
  );
}

// ---------------- 评论 AI 话题总结（H1：只在评论数达到一定量的作品显示） ----------------
// 话题池和计算搬到 insight/build.js，模块 D、S1 卡和这里引用同一份
export { commentTopics };

// ---------------- 设置子页（H1 / CA3 / H12 的真实条目） ----------------
export const SETTING_PAGES = {
  Account: { groups: [['', [['User information', '›'], ['Password', '›'], ['Passkey', '›'], ['Verification', '›'], ['Switch to Business Account', '›']]], ['', [['Download your data', '›'], ['Deactivate or delete account', '›']]]] },
  Privacy: { groups: [['Discoverability', [['Private account', 'toggle:private'], ['Suggest your account to others', '›'], ['Sync contacts and Facebook friends', '›']]], ['Interactions', [['Comments', 'page:Comments'], ['Mentions and tags', '›'], ['Direct messages', '›'], ['Duet', '›'], ['Stitch', '›'], ['Downloads', '›']]], ['', [['Blocked accounts', '›']]]] },
  Comments: { groups: [['', [['Who can comment on your posts', 'value:Everyone'], ['Filter all comments', 'toggle:filterAll'], ['Filter spam and offensive comments', 'toggle:filterSpam:on']]], ['Comment insights', [['Allow insights on my videos', 'toggle:insightsMine:on'], ['Include my comments for insights', 'toggle:insightsOthers:on']]]], foot: 'Comment insights use AI to summarize and filter comments into categories. These settings are on by default.' },
  'Post settings': { groups: [['', [['Allow high-quality uploads', 'toggle:hq:on'], ['Save posts to device', 'toggle:save'], ['Default audience', 'value:Everyone'], ['Content disclosure', '›']]]] },
  'Security & permissions': { groups: [['', [['Security alerts', '›'], ['Manage devices', '›'], ['2-step verification', 'value:On'], ['Apps and services permissions', '›']]]] },
  Notifications: { groups: [['Creator notifications', [['Post performance', 'toggle:n1:on'], ['Monetization', 'toggle:n2:on'], ['Events and activities', 'toggle:n3:on']]], ['Account notifications', [['Account updates', 'toggle:n5:on'], ['Reports and appeals', 'toggle:n6:on']]]], foot: 'Changes apply to both TikTok and TikTok Studio.' },
  'Edit profile': { groups: [['About you', [['Name', 'value:Mira Lane'], ['Username', 'value:miralane.travels'], ['Pronouns', 'value:Add'], ['Bio', 'value:Weekend trips you can actually afford'], ['Links', 'value:Add']]]] },
  Favourites: { empty: ['No favorites yet', 'Videos, sounds and effects you favorite will appear here.'] },
  Likes: { empty: ['No liked videos yet', 'Videos you like will appear here.'] },
  Announcements: { groups: [['', [['TikTok Studio updates', '›'], ['Creator Rewards Program changes', '›'], ['Community Guidelines updates', '›']]]] },
  'Activity centre': { groups: [['', [['Watch history', '›'], ['Comment history', '›'], ['Post visibility', '›'], ['Associated videos', '›']]]] },
  'Content preferences': { groups: [['', [['Filter video keywords', '›'], ['Restricted Mode', 'value:Off'], ['Manage topics', '›']]]] },
  'Report a problem': { groups: [['Topics', [['Analytics', '›'], ['Posting and editing', '›'], ['Monetization', '›'], ['Account and login', '›'], ['Something else', '›']]]] },
  Support: { groups: [['', [['Help Center', '›'], ['Safety Center', '›'], ['Contact us', '›']]]] },
  'Terms and policies': { groups: [['', [['Terms of Service', '›'], ['Privacy Policy', '›'], ['Community Guidelines', '›'], ['Copyright Policy', '›'], ['Open source libraries', '›']]]] },
  'App language': { radio: ['English (US)', 'Español', 'Português (Brasil)', '日本語', '한국어', '中文 (简体)'] },
  Display: { radio: ['Use device settings', 'Light', 'Dark'] },
};
export function SettingPage({ title }) {
  const push = useApp((s) => s.push);
  const page = SETTING_PAGES[title];
  const [tog, setTog] = useState({});
  const [radio, setRadio] = useState(0);
  const insights = useApp((s) => s.commentInsightsOn);
  if (!page) return null;
  if (page.empty) return <div className="sp-empty"><b>{page.empty[0]}</b><span>{page.empty[1]}</span></div>;
  if (page.radio) return <div className="settings-group"><div className="sg-card">{page.radio.map((r, i) => <button key={r} className="list-row" data-act="setting-radio" onClick={() => setRadio(i)}><span className="lr-label">{r}</span>{radio === i && <I.check size={18} style={{ color: 'var(--c-primary)' }} />}</button>)}</div></div>;
  return (
    <>
      {page.groups.map(([g, rows], gi) => (
        <div key={gi} className="settings-group">{g && <div className="sg-title">{g}</div>}<div className="sg-card">
          {rows.map(([l, kind]) => {
            if (kind.startsWith('toggle:')) {
              const [, key, def] = kind.split(':');
              const on = key === 'insightsMine' ? insights : (tog[key] ?? def === 'on');
              return <div key={l} className="list-row"><span className="lr-label">{l}</span><button data-act="setting-toggle" className={`ios-switch ${on ? 'on' : ''}`} onClick={() => (key === 'insightsMine' ? useApp.setState({ commentInsightsOn: !insights }) : setTog({ ...tog, [key]: !on }))}><i /></button></div>;
            }
            if (kind.startsWith('page:')) return <button key={l} className="list-row" data-act={`setting-page-${kind.slice(5)}`} onClick={() => push('settingDetail', { title: kind.slice(5) })}><span className="lr-label">{l}</span><I.right size={16} /></button>;
            if (kind.startsWith('value:')) return <button key={l} className="list-row" data-act="setting-value" onClick={() => {}}><span className="lr-label">{l}</span><span className="lr-value">{kind.slice(6)}</span><I.right size={16} /></button>;
            return <button key={l} className="list-row" data-act="setting-row" onClick={() => {}}><span className="lr-label">{l}</span><I.right size={16} /></button>;
          })}
        </div></div>
      ))}
      {page.foot && <div className="sg-foot">{page.foot}</div>}
    </>
  );
}

// Description ideas（美国 2026-08 发布页工具条）：按画面给 3 条描述建议，点一条填入
export function DescIdeasSheet({ onPick }) {
  const close = useApp((s) => s.closeSheet);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1100); return () => clearTimeout(t); }, []);
  const ideas = ['Weekend trip in 48 hours — save this for your next long weekend ✈️ #weekendtrip #traveltips', 'The one trick that makes this city feel empty. Would you try it? #travelhacks #hiddengems', 'POV: you finally found the view everyone keeps asking about ✨ #travel #traveltok'];
  return (
    <SheetFrame title="Description ideas">
      <div className="di-sub"><AiStar size={13} /> Generated from your post. Edit anything before posting.</div>
      {loading ? <div className="di-list">{[0, 1, 2].map((i) => <div key={i} className="di-skel"><i /><i /></div>)}</div> : (
        <div className="di-list">{ideas.map((t, i) => <button key={i} className="di-item" data-act={`desc-idea-${i}`} onClick={() => { onPick?.(t); close(); }}>{t}</button>)}</div>
      )}
    </SheetFrame>
  );
}

export const SUBFLOW_SHEETS = { assistantMore: AssistantMoreSheet, assistantPreview: AssistantPreviewSheet, postActions: PostActionsSheet, commentActions: CommentActionsSheet, descIdeas: DescIdeasSheet };
