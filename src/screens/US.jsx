// V4 · 美国版（默认）：按用户 2026-11-22 美国 iPhone 真机录屏（中文界面，原型沿用英文文案）对齐
// 证据帧：assets/frames/studioapp_usrec20261122_<mmss>.jpg
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store.js';
import { NavBar, Pills, Scroll, Cover, Avatar, Chip, Skel, Spinner, CapText, asButton } from '../ui/kit.jsx';
import { TrendChart } from '../ui/charts.jsx';
import { SheetFrame } from '../shell/Overlays.jsx';
import { I } from '../ui/Icons.jsx';
import { rng, INSPIRATION, NOW, DAY_MS, ACCOUNT, DAILY, PERIOD_END, POSTS, dayDate } from '../data/seed.js';
import { fmt, fmtMoney, overviewKpis } from '../data/agg.js';
import { VideoStage } from './VideoAnalysis.jsx';
import { CommentTopicsCard } from '../insight/CommentTopicsCard.jsx';
import { Illo, illoBg } from '../ui/illo.jsx';
import { ModuleD } from '../insight/ModuleD.jsx';
import { buildModuleD, otherPostTopics, rewardsSplit, sincePostedWindow } from '../insight/build.js';

const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function useDelay(ms, dep) { const [ok, setOk] = useState(false); useEffect(() => { setOk(false); const t = setTimeout(() => setOk(true), ms); return () => clearTimeout(t); }, [dep]); return ok; }

// ---------- 共享小件 ----------
export const Flame = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.1 2.1-5 3.6-6.6.4 1.6 1.3 2.6 2.4 3.1C11 7.6 12.5 4.9 15 3c-.2 2.8 1 4.4 2.3 6 1.1 1.4 1.7 2.9 1.7 4.6C19 17.9 15.9 21 12 21z" /></svg>
);
// 排名徽标：1 金 / 2 银 / 3 铜方块；4 起只显示灰色数字（usrec 0:02）
export const RankBadge = ({ n }) => (n <= 3 ? <span className={`rk-badge r${n}`}>{n}</span> : <span className="rk-num">{n}</span>);

export const TOPICS = [
  // 美国 2026-11-22 录屏 0:02 / 0:17 的真实话题榜（14 条原文；截断处按可见部分补全）
  ['Hunger Games Premieres in NYC', 225.5e6], ['Hunger Games Sunrise on the Reaping Trailer', 218.3e6], ['England Faces Spain in Madrid', 145.2e6], ['Robert Pattinson as James Bond Speculation', 141.3e6],
  ['SpaceX Launches Starship, Booster Caught Again', 119.2e6], ['Videos Claim Pterodactyl Over Ciudad Juárez', 114.4e6], ['CORTIS Wins MMA Top 10 Goes viral', 105.4e6], ['MMA Award 2026 Reactions', 100.2e6],
  ['Rockstar Confirms GTA 6 Is Single-Player First', 98.0e6], ['Gane and Hokit Trash Talk at UFC 334', 90.9e6], ['Philippines Wins Eurovision Asia in Bangkok', 88.5e6], ['Denmark Rout Portugal 4-1', 76.6e6],
  ['SpaceX Starship Flight 12 Recap', 75.8e6], ['Microsoft Enables GTA 6 on Xbox One', 73.8e6],
];

// ---------- 插图（线稿，按录屏风格重绘，不使用原图） ----------
export function TagsIllustration() { return <Illo name="tags-tip" className="illo-tip" fallback={<TagsIllustrationSvg />} />; }
function TagsIllustrationSvg() {
  return (
    <svg viewBox="0 0 260 150" width="100%" height="150" aria-hidden="true">
      <defs><linearGradient id="tgc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e4e8f0" /><stop offset="1" stopColor="#f6f7fa" /></linearGradient></defs>
      <rect x="18" y="22" width="112" height="128" rx="6" fill="url(#tgc)" />
      <rect x="138" y="4" width="110" height="34" rx="6" fill="#eef0f5" />
      <rect x="138" y="46" width="110" height="104" rx="6" fill="url(#tgc)" />
      <path d="m68 82 14 8-14 8z" fill="#fff" /><path d="m188 102 12 7-12 7z" fill="#fff" />
      <rect x="26" y="30" width="18" height="16" rx="4" fill="#fff" /><path d="M35 42s-5-3-5-6a2.6 2.6 0 0 1 5-1 2.6 2.6 0 0 1 5 1c0 3-5 6-5 6z" fill="#161823" />
      <rect x="146" y="54" width="50" height="18" rx="4" fill="#fff" /><text x="171" y="67" textAnchor="middle" fontSize="10" fontWeight="700" fill="#161823">↑ 36.2x</text>
    </svg>
  );
}
export function NoResultsIllustration() { return <Illo name="no-results" className="illo-noresults" fallback={<NoResultsIllustrationSvg />} />; }
function NoResultsIllustrationSvg() {
  // 线稿人物侧脸 + 举着青色放大镜 + 粉色爱心（usrec 0:21 风格重绘）
  return (
    <svg viewBox="0 0 200 150" width="190" height="142" fill="none" stroke="#161823" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M86 34c6-14 24-20 40-14 15 6 22 20 19 34" fill="#fff" />
      <path d="M90 30c8-6 20-6 28-1M84 46c-2-8 1-14 6-16" />
      <path d="M145 54c2 10-2 20-10 26l-6 4c-6 4-14 4-20 0" fill="#fff" />
      <path d="M128 64c2 2 2 5 0 7M120 50h.01" strokeWidth="3" />
      <path d="M129 84c10 6 18 16 22 30M108 88c-8 6-12 14-14 26" />
      <circle cx="82" cy="62" r="23" fill="#4fcfd6" />
      <circle cx="82" cy="62" r="15" fill="#c9f3f5" stroke="#161823" />
      <path d="M72 54a12 12 0 0 1 9-6" stroke="#fff" strokeWidth="3" />
      <path d="M66 80 50 102" strokeWidth="6" />
      <path d="M58 92c-6 2-10 8-8 14s10 6 14 2l6-8" fill="#fff" />
      <path d="M170 70s-11-6-11-13a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 7-11 13-11 13z" fill="#fe2c55" stroke="none" />
    </svg>
  );
}
const CrpIcon = ({ kind }) => <Illo name={`crp-${kind}`} className="illo-crp" fallback={<CrpIconSvg kind={kind} />} />;
const CrpIconSvg = ({ kind }) => (
  <svg viewBox="0 0 64 64" width="62" height="62" fill="none" stroke="#161823" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'star' && <><circle cx="34" cy="24" r="17" fill="#fff" /><path d="m34 13 3 7 7 .6-5.4 4.6 1.7 7-6.3-3.8-6.3 3.8 1.7-7L24 20.6l7-.6z" /><path d="M10 50c8-6 16-8 24-6l14 4c3 1 3 5 0 5H30" fill="#161823" /></>}
    {kind === 'video' && <><rect x="8" y="16" width="40" height="28" rx="4" fill="#fff" transform="rotate(-10 28 30)" /><path d="m25 25 10 5-10 6z" fill="#161823" /><circle cx="48" cy="16" r="8" fill="#fff" /><circle cx="48" cy="16" r="3.5" fill="#161823" /></>}
    {kind === 'trend' && <><rect x="12" y="8" width="26" height="44" rx="5" fill="#fff" transform="rotate(-12 25 30)" /><circle cx="38" cy="36" r="12" fill="#fff" /><path d="m30 36 4-4 4 6 5-6M46 44l8 8" /></>}
  </svg>
);

// ---------- Creator inspiration（usrec 0:07–0:31） ----------
const CI_TABS = [{ key: 'topics', label: 'Topics' }, { key: 'posts', label: 'Posts' }, { key: 'creators', label: 'Creators' }];
const CATS = [{ key: 'all', label: 'All categories' }, { key: 'food', label: 'Food & drink' }, { key: 'ent', label: 'Entertainment' }, { key: 'sports', label: 'Sports' }];
const REGIONS = [{ key: 'US', label: 'US' }, { key: 'GB', label: 'GB' }, { key: 'CA', label: 'CA' }];

export function TagsTipModal({ onClose }) {
  return (
    <motion.div className="tip-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="tip-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}>
        <button aria-label="Close" className="tip-x" data-act="tags-tip-close" onClick={onClose}><I.close size={18} /></button>
        <TagsIllustration />
        <div className="tip-title">Video tags help you discover content</div>
        <div className="tip-body">Browse content your followers watch, videos recognized by TikTok, top creators, and content similar to yours.</div>
        <button className="btn-primary block tip-ok" data-act="tags-tip-ok" onClick={onClose}>Got it</button>
      </motion.div>
    </motion.div>
  );
}

function PostNowFab() {
  const openModal = useApp((s) => s.openModal);
  return <button className="fab-post" data-act="post-now" onClick={() => openModal('picker', { mode: 'upload' })}><I.videoCamFill size={20} /> Post now</button>;
}

function CiTopics() {
  const openSheet = useApp((s) => s.openSheet);
  const [cat, setCat] = useState('all'); const [rg, setRg] = useState('US');
  const ready = useDelay(500, cat + rg);
  const list = TOPICS.map(([t, v], i) => [t, Math.round(v * (rg === 'US' ? 1 : 0.4 + (i % 3) * 0.1) * (cat === 'all' ? 1 : 0.6))]);
  return (
    <>
      <div className="ci-filters">
        <Chip act="ci-category" label={CATS.find((c) => c.key === cat).label} active={false} onPress={() => openSheet('ciOption', { title: 'Category', options: CATS, value: cat, onPick: setCat })} />
        <Chip act="ci-region" label={rg} active={false} onPress={() => openSheet('ciOption', { title: 'Region', options: REGIONS, value: rg, onPick: setRg })} />
      </div>
      {!ready ? <div className="ci-skel">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="ci-skrow"><Skel w={16} h={16} /><Skel h={14} /><Skel w={50} h={12} /></div>)}</div> : (
        <div className="ci-topics">
          {list.map(([t, v], i) => (
            <button key={t} className="ci-trow" data-act="ci-topic" onClick={() => useApp.getState().push('topicSearch', { q: t })}>
              <RankBadge n={i + 1} /><span className="ci-tt">{t}</span><span className="ci-tv"><Flame /> {fmt(v)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// CA5（2026-08）：App 专属的灵感分类 Hot / Similar / Followers viewed / Outliers
const REC_CHIPS = [{ key: 'similar', label: 'Similar' }, { key: 'followers', label: 'Followers viewed' }, { key: 'outliers', label: 'Outliers' }];
function CiPosts({ initMode, initRec }) {
  const [mode, setMode] = useState(initMode || 'popular');
  const [rec, setRec] = useState(initRec || 'similar');
  const openSheet = useApp((s) => s.openSheet);
  const newAccount = useApp((s) => s.newAccount);
  const chipSel = useApp((s) => s.chipSel);
  const ready = useDelay(550, mode + rec);
  const shift = mode === 'recommended' ? REC_CHIPS.findIndex((c) => c.key === rec) * 2 + 1 : 0;
  const items = INSPIRATION.concat(INSPIRATION).map((x, i) => ({ ...x, id: `${x.id}-${i}`, hue: (x.hue + i * 23 + shift * 31) % 360, likes: Math.round(x.likes / (1 + ((i + shift) % 12) * 0.4)), lift: (3.2 + ((i * 7 + shift) % 11) * 2.7).toFixed(1) }));
  return (
    <>
      <div className="ci-filters between">
        <Pills items={[{ key: 'recommended', label: 'Recommended' }, { key: 'popular', label: 'Popular' }]} value={mode} onChange={setMode} />
        <button aria-label="Filter" data-act="ci-filter" className={chipSel['Date posted'] ? 'on' : ''} onClick={() => openSheet('optionList', { title: 'Date posted' })}><I.funnel size={20} /></button>
      </div>
      {mode === 'recommended' && !newAccount && (
        <div className="ci-subchips">{REC_CHIPS.map((c) => <button key={c.key} data-act={`ci-rec-${c.key}`} className={rec === c.key ? 'on' : ''} onClick={() => setRec(c.key)}>{c.label}</button>)}</div>
      )}
      {mode === 'recommended' && !newAccount && ready && <div className="ci-rec-note">{{ similar: 'Posts similar to your content', followers: 'Content your followers are watching', outliers: 'Videos with views far above the creator’s average' }[rec]}</div>}
      {!ready ? <div className="ci-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i}><Skel h={210} r={6} /><Skel h={12} style={{ marginTop: 8 }} /><Skel h={12} w="60%" style={{ marginTop: 6 }} /></div>)}</div>
        : mode === 'recommended' && newAccount ? (
          // 录屏 0:21：新账号的 Recommended 为空 → 「找不到结果」插图
          <div className="ci-empty"><NoResultsIllustration /><div>No results found</div></div>
        ) : (
          <div className="ci-grid">
            {items.map((x, i) => (
              <button key={x.id} className="ci-card" data-act="ci-post" onClick={() => useApp.getState().push('searchPlayer', { id: x.id.split('-')[0] })}>
                <div className="ci-thumb"><Cover item={x} w={170} h={210} text radius={6} />{mode === 'popular' && i < 3 && <span className="ci-rank"><RankBadge n={i + 1} /></span>}{mode === 'recommended' && rec === 'outliers' && <span className="ci-lift">↑ {x.lift}x</span>}<span className="ci-save"><I.bookmark size={16} /></span><span className="ci-likes"><I.heart size={13} /> {fmt(x.likes)}</span></div>
                <div className="ci-cap">{x.caption}</div>
                <div className="ci-author"><Avatar hue={x.hue} size={20} label={x.creator[0].toUpperCase()} /> {x.creator}</div>
              </button>
            ))}
          </div>
        )}
    </>
  );
}

function CiCreators() {
  const [mode, setMode] = useState('popular');
  const openSheet = useApp((s) => s.openSheet);
  const ready = useDelay(550, mode);
  return (
    <>
      <div className="ci-filters between">
        <Pills items={[{ key: 'recommended', label: 'Recommended' }, { key: 'popular', label: 'Popular' }]} value={mode} onChange={setMode} />
        <button aria-label="Filter" data-act="ci-filter" onClick={() => openSheet('info', { title: 'Filter', text: 'Filter by category, region and publish date.' })}><I.funnel size={20} /></button>
      </div>
      {!ready ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="ci-crow"><div className="ci-chead"><Skel w={40} h={40} r={20} /><div style={{ flex: 1 }}><Skel h={12} w="50%" /><Skel h={10} w="40%" style={{ marginTop: 6 }} /></div><Skel w={70} h={26} /></div><div className="ci-cthumbs">{[0, 1, 2, 3].map((k) => <Skel key={k} w={88} h={118} r={4} />)}</div></div>)
        : (mode === 'recommended' ? [...INSPIRATION].reverse() : INSPIRATION).map((x, i) => (
          <div key={x.id} className="ci-crow">
            <div className="ci-chead">
              <RankBadge n={i + 1} /><Avatar hue={x.hue} size={47} label={x.creator[0].toUpperCase()} />
              <div className="ci-cmeta"><div className="ci-cname">{x.creator} {i === 0 && <span className="verified">✓</span>}</div><div className="ci-csub">+{fmt(x.creatorStats.followers / 20)} followers in 7 days</div></div>
              <button className="ci-abtn" data-act="ci-creator-analytics" onClick={() => openSheet('creatorAnalysis', { id: x.id })}><I.insights size={14} /> Analytics</button>
            </div>
            <div className="ci-cthumbs h-scroll">{[0, 1, 2, 3].map((k) => <span key={k} className="ci-ct"><Cover item={{ hue: (x.hue + k * 30) % 360, emoji: x.emoji }} w={104} h={138} text={false} radius={6} /><em><I.heart size={11} /> {fmt(x.likes / (40 + k * 30))}</em></span>)}</div>
          </div>
        ))}
    </>
  );
}

// params（2026-11-27）：洞察块的「下一步」可以直接打开某个 Tab，例如 Posts › Recommended › Followers viewed
export function CreatorInspirationScreen({ params } = {}) {
  const seen = useApp((s) => s.seenTagsTip);
  const [tab, setTab] = useState(params?.tab || 'topics');
  const ready = useDelay(700, 'first');
  const showTip = ready && !seen;
  return (
    <div className="screen ci-screen">
      <div className="ci-hero">
        <div className="ci-swirl" style={illoBg('ci-hero')} />
        <div className="ci-nav">
          <button aria-label="Back" data-act="nav-back" onClick={() => useApp.getState().pop()}><I.back size={26} /></button>
          <button aria-label="Saved" data-act="ci-saved" onClick={() => useApp.getState().openSheet('info', { title: 'Saved', text: 'Topics, posts and creators you save will appear here.' })}><I.bookmark size={22} /></button>
        </div>
        <h1>Creator inspiration</h1>
      </div>
      <div className="ci-tabs">{CI_TABS.map((t) => <button key={t.key} data-act={`ci-tab-${t.key}`} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label}{tab === t.key && <motion.i layoutId="cit" className="tt-line" />}</button>)}</div>
      <Scroll className="ci-body">
        {!ready ? <div className="ci-skel"><div className="ci-skrow"><Skel w={90} h={28} r={14} /><Skel w={60} h={28} r={14} /></div>{Array.from({ length: 9 }).map((_, i) => <div key={i} className="ci-skrow"><Skel w={16} h={16} /><Skel h={14} /><Skel w={50} h={12} /></div>)}</div>
          : tab === 'topics' ? <CiTopics /> : tab === 'posts' ? <CiPosts initMode={params?.mode} initRec={params?.rec} /> : <CiCreators />}
        <div style={{ height: 90 }} />
      </Scroll>
      <PostNowFab />
      <AnimatePresence>{showTip && <TagsTipModal onClose={() => useApp.setState({ seenTagsTip: true })} />}</AnimatePresence>
    </div>
  );
}

export function CiOptionSheet({ title, options, value, onPick }) {
  const close = useApp((s) => s.closeSheet);
  return (
    <SheetFrame title={title}>
      {options.map((o) => <button key={o.key} className="opt-row" data-act={`ci-opt-${o.key}`} onClick={() => { close(); onPick(o.key); }}><span>{o.label}</span><span className={`radio ${value === o.key ? 'on' : ''}`}><i /></span></button>)}
    </SheetFrame>
  );
}

// ---------- 创作者成长时间线（usrec 0:27、2:08–2:11） ----------
function milestones(item) {
  const r = rng(hash(item.creator));
  return [
    { d: '5/20', y: '2026', t: 'Reached 1M followers', n: 1176, avg: '112K', words: ['basketball fyp', 'sports football'], v: [17.9e6, 6.8e6, 3.7e6] },
    { d: '2/16', y: '2024', t: 'Reached 500K followers', n: 1806, avg: '160K', words: ['nfl sports', 'football nfl'], v: [13.4e6, 7.7e6, 7.7e6] },
    { d: '9/20', y: '2022', t: 'Reached 100K followers', n: 1525, avg: '81K', words: ['nfl football', 'school football'], v: [4.4e6, 2.2e6, 1.9e6] },
  ].map((m) => ({ ...m, v: m.v.map((x) => Math.round(x * (0.6 + r() * 0.8))) }));
}
export function MilestoneTimeline({ item, start = true }) {
  return (
    <div className="ms-line">
      {milestones(item).map((m, i) => (
        <div key={i} className="ms-item">
          <div className="ms-date"><b>{m.d}</b><span>{m.y}</span></div>
          <div className="ms-body">
            <div className="ms-t">{m.t}</div>
            <div className="ms-x">Published {m.n.toLocaleString('en-US')} posts with an average of {m.avg} views per post. Most common words in titles: {m.words[0]} and {m.words[1]}. Top posts to learn from:</div>
            <div className="ms-posts">{m.v.map((v, k) => <span key={k} className="ms-p"><Cover item={{ hue: (item.hue + k * 40 + i * 20) % 360, emoji: item.emoji }} w={82} h={110} text={false} radius={4} /><em><I.playFill size={10} /> {fmt(v)}</em></span>)}</div>
          </div>
        </div>
      ))}
      {start && <div className="ms-item"><div className="ms-date"><b>3/22</b><span>2020</span></div><div className="ms-body"><div className="ms-t">Started posting on TikTok</div></div></div>}
    </div>
  );
}
export function CreatorAnalysisSheet({ id }) {
  const item = INSPIRATION.find((x) => x.id === id) || INSPIRATION[0];
  const ready = useDelay(600, id);
  return (
    <SheetFrame title="Analysis" height="86%">
      <div className="an-body">{!ready ? <AnSkeleton /> : <MilestoneTimeline item={item} start={false} />}</div>
    </SheetFrame>
  );
}
function AnSkeleton() {
  return <div style={{ padding: 16 }}><Skel h={18} w="40%" /><div className="kpi-grid" style={{ marginTop: 12 }}>{[0, 1, 2, 3].map((i) => <Skel key={i} h={60} r={6} />)}</div><Skel h={18} w="30%" style={{ marginTop: 20 }} /><Skel h={140} r={8} style={{ marginTop: 10 }} /></div>;
}

// ---------- Discover → Analysis 弹层（usrec 1:45–2:11） ----------
const TIPS = ['This post’s comment rate is higher than most other posts. Learn how this creator engages with viewers to increase engagement on your posts.', 'This is the creator’s most-viewed post. Study the content, style and techniques used, then apply them in your posts to increase exposure and engagement.'];
const AN_PILLS = [{ key: 'views', label: 'Post views' }, { key: 'comments', label: 'Comments' }, { key: 'likes', label: 'Likes' }, { key: 'saves', label: 'Favorites' }];
// 2026-11-26：评论热词改用这条作品自己的 topWords（和首页 Insights 弹层同一份），不再对所有作品用同一组词
export function topWordsFor(item) {
  const r = rng(hash(item.id));
  return item.topWords.map((w, i) => [w, Math.max(1, Math.round(item.comments * (0.09 - i * 0.015) * (0.9 + r() * 0.2)))]);
}
export function AnalysisSheet({ id }) {
  const item = INSPIRATION.find((x) => x.id === id) || INSPIRATION[0];
  const [tab, setTab] = useState('post');
  const [metric, setMetric] = useState('views');
  const ready = useDelay(650, id + tab);
  const push = useApp((s) => s.push); const close = useApp((s) => s.closeSheet);
  const noCa = useApp((s) => s.newAccount || s.market === 'store');
  const topicsOn = useApp((s) => s.commentInsightsOn);
  const ratio = { views: 1, comments: item.comments / item.views, likes: item.likes / item.views, saves: item.saves / item.views }[metric];
  const data = Array.from({ length: 15 }, (_, d) => ({ h: d, value: Math.round(item.views / 9 * Math.exp(-((d - 2) ** 2) / 10) * ratio) }));
  const words = topWordsFor(item); const maxW = Math.max(...words.map((w) => w[1]));
  return (
    <SheetFrame title="Analysis" height="86%">
      <div className="ins-tabs">{[['post', 'Post'], ['creator', 'Creator']].map(([k, l]) => <button key={k} data-act={`analysis-tab-${k}`} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{tab === k && <motion.i layoutId="ant" className="tt-line" />}</button>)}</div>
      <div className="ins-body">
        {!ready ? <AnSkeleton /> : tab === 'post' ? (
          <>
            {/* Final（S7）：模块 D 替换 Key metrics 和蓝色提示条 */}
            <div style={{ padding: '8px 8px 0' }}><ModuleD ca={noCa ? 'none' : 'row'} insight={buildModuleD(item, { topics: topicsOn ? otherPostTopics(item) : null, words })} /></div>
            <section className="section"><div className="sec-head"><div className="sec-title">Trends <I.info size={15} /></div></div>
              <Pills variant="blue" items={AN_PILLS} value={metric} onChange={setMetric} />
              <TrendChart data={data} hatchLast={false} animKey={metric} xLabel={(d) => String(d.h)} tooltipLabel={(d) => `Day ${d.h}`} />
            </section>
            <CommentTopicsCard seed={item.id.length + item.comments} comments={item.comments} period={sincePostedWindow(item)} onOpen={(k, t) => { close(); push('relatedComments', { id: item.id, word: k, words: [[k, 4]], topic: t }); }} />
            <section className="section"><div className="sec-head"><div className="sec-title">Top words used in comments <I.info size={15} /></div></div>
              <div className="bar-rows">{words.map(([w, c]) => (
                <div key={w} className="bar-row tap" data-act="analysis-word" onClick={() => { close(); push('relatedComments', { id: item.id, word: w }); }} {...asButton(() => { close(); push('relatedComments', { id: item.id, word: w }); })}>
                  <div className="bar-top"><span>{w}</span><span className="bar-v">{c}<I.right size={14} /></span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(c / maxW) * 100}%` }} /></div>
                </div>))}</div>
            </section>
          </>
        ) : (
          <section className="section">
            <button className="an-creator" data-act="analysis-creator-profile" onClick={() => useApp.getState().showAlert({ title: 'Continue to TikTok app?', message: `Open @${item.creator} in TikTok`, actions: [{ label: 'Cancel' }, { label: 'Continue', bold: true }] })}>
              <Avatar hue={item.hue} size={40} label={item.creator[0].toUpperCase()} /><span><b>{item.creator}</b><small>{fmt(item.creatorStats.followers)} followers · {fmt(item.creatorStats.totalLikes)} likes</small></span><I.right size={18} />
            </button>
            <MilestoneTimeline item={item} />
          </section>
        )}
      </div>
    </SheetFrame>
  );
}

// ---------- 「N related comments」（usrec 2:01） ----------
const RC = [['sAdoboNinja', 'I’ve never seen {w} done like this in the same room', 'Jun 7', 15], ['DeepEdgarInMe', '{W}?', 'Jun 7', 11], ['Kayson', 'Wait {w} and this in the same video....', 'Jun 13', 5], ['Deus_Diego', 'The other one is {w} ofc it’s obvious', 'Jun 30', 2]];
export function RelatedCommentsScreen({ params }) {
  const item = INSPIRATION.find((x) => x.id === params.id) || INSPIRATION[0];
  const words = params.words || topWordsFor(item);
  const [w, setW] = useState(params.word);
  const [open, setOpen] = useState(false);
  const rows = RC.slice(0, Math.max(1, words.find((x) => x[0] === w)?.[1] + 1 || 4));
  const bold = (t) => { const parts = t.split(/(\{w\}|\{W\})/); return parts.map((p, i) => (p === '{w}' ? <b key={i}>{w}</b> : p === '{W}' ? <b key={i}>{w[0].toUpperCase() + w.slice(1)}</b> : p)); };
  return (
    <div className="screen">
      <NavBar title={`${rows.length} related comments`} />
      <div className="rc-select-wrap">
        <button className="rc-select" data-act="related-word-select" onClick={() => setOpen(!open)}><I.comment size={16} /> {w}<I.down size={16} style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : undefined }} /></button>
        <AnimatePresence>{open && <motion.div className="rc-menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{words.map(([x, c]) => <button key={x} data-act="related-word-opt" className={x === w ? 'on' : ''} onClick={() => { setW(x); setOpen(false); }}>{x}<span>{c}</span></button>)}</motion.div>}</AnimatePresence>
      </div>
      <Scroll>
        {rows.map(([u, t, d, l], i) => (
          <div key={u} className="rc-row"><Avatar hue={(i * 80 + 20) % 360} size={36} label={u[0]} /><div className="rc-t"><div className="rc-u">{u}</div><div className="rc-b">{bold(t)}</div><div className="rc-d">{d}<span><I.heart size={13} /> {l}</span></div></div></div>
        ))}
      </Scroll>
    </div>
  );
}

// ---------- 搜索结果的全屏播放器（usrec 4:28：顶部是搜索框，右侧 Analysis） ----------
export function SearchPlayerScreen({ params }) {
  const base = INSPIRATION.find((x) => x.id === params.id) || INSPIRATION[0];
  const item = { ...base, hue: params.hue ?? base.hue, scene: params.scene, caption: params.caption ?? base.caption };
  const openSheet = useApp((s) => s.openSheet); const pop = useApp((s) => s.pop);
  return (
    <div className="screen black">
      <VideoStage item={item}>
        <div className="sp-top"><button aria-label="Back" data-act="nav-back" onClick={pop}><I.back size={24} /></button><div className="sp-field"><I.search size={16} /> {params.q || item.caption.split(' ').slice(0, 3).join(' ')}<b>Search</b></div></div>
        <div className="rail">
          <button className="rail-insights" data-act="feed-insights" onClick={() => openSheet('insights', { id: item.id })}><span className="ri-circle"><I.insights size={20} /></span><span>Analysis</span></button>
          <div className="rail-avatar"><Avatar hue={item.hue} size={46} label={item.creator[0].toUpperCase()} ring /><span className="follow-plus">+</span></div>
          <button data-act="feed-like"><I.heart size={34} filled /><span>{fmt(item.likes)}</span></button>
          <button data-act="feed-comments"><I.commentFill size={32} /><span>{fmt(item.comments)}</span></button>
          <button data-act="feed-save"><I.bookmark size={30} filled /><span>{fmt(item.saves)}</span></button>
        </div>
        <div className="stage-caption"><b>{item.creator}</b> · 2025-5-22<CapText text={item.caption} /></div>
        <div className="sp-comment"><span>Add comment...</span><span>😁 🥰 😂</span></div>
      </VideoStage>
    </div>
  );
}

// ---------- Rewards analytics（usrec 0:52–0:56） ----------
export function RewardsAnalyticsUSScreen() {
  const chipSel = useApp((s) => s.chipSel);
  const [tab, setTab] = useState('overview');
  const [src, setSrc] = useState('total');
  const [range, setRange] = useState('7');
  const openSheet = useApp((s) => s.openSheet);
  const ready = useDelay(600, 'ra');
  // 2026-11-26：金额、变化、日序列、来源拆分和每条作品都从 DAILY.rewards / 作品数据算，与 Overview 的 Est. rewards 一致
  const k = overviewKpis({ key: range });
  const total = k[5].value;
  const days = +range, s0 = PERIOD_END - days + 1;
  const { crp, gifts, posts: postRewards } = rewardsSplit(days);
  const shown = src === 'crp' ? crp : total;
  const data = Array.from({ length: days }, (_, i) => {
    const d = s0 + i, all = DAILY.rewards[d];
    const c = POSTS.reduce((a, p) => a + (p.duration >= 60 ? (p.daily[d] || 0) * 0.0009 : 0), 0);
    return { date: dayDate(d), value: +(src === 'crp' ? Math.min(all, c) : all).toFixed(2) };
  });
  const dp = k[5].deltaPct;
  return (
    <div className="screen gray">
      <NavBar title="Rewards analytics" right={<span className="ra-icons"><button aria-label="Feedback" data-act="ra-feedback" onClick={() => openSheet('info', { title: 'Report', text: 'Tell us what’s wrong with this data. Your feedback helps us improve rewards analytics.' })}><I.flag size={20} /></button><button aria-label="About this data" data-act="ra-info" onClick={() => openSheet('info', { title: 'Rewards analytics', text: 'Estimated rewards are calculated from qualified views and may change after review. Data is displayed in UTC.' })}><I.info size={20} /></button></span>} />
      <div className="top-tabs equal">{[['overview', 'Overview'], ['post', 'Each post']].map(([kk, l]) => <button key={kk} role="tab" data-act={`ra-tab-${kk}`} className={tab === kk ? 'on' : ''} onClick={() => setTab(kk)}><span>{l}</span>{tab === kk && <motion.i layoutId="rat" className="tt-line" />}</button>)}</div>
      {!ready ? <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}><Spinner /></div> : (
        <Scroll>
          {tab === 'overview' ? (
            <section className="section">
              <Pills className="ra-pills" items={[{ key: 'total', label: 'Total' }, { key: 'crp', label: 'Creator Rewards Program' }]} value={src} onChange={setSrc} />
              <div className="ra-head"><div><div className="ra-l">Estimated rewards</div><div className="ra-v"><small>$</small>{shown.toFixed(2)}</div><div className="ra-d">{src === 'total' && dp != null ? `${dp >= 0 ? '+' : '−'}${Math.abs(dp * 100).toFixed(1)}% · ${days} days` : `${days} days`}</div></div>
                <button className="ra-range" data-act="ra-range" onClick={() => openSheet('ciOption', { title: 'Date range', options: [{ key: '7', label: 'Last 7 days' }, { key: '28', label: 'Last 28 days' }, { key: '60', label: 'Last 60 days' }], value: range, onPick: setRange })}>Last {range} days <I.down size={14} /></button></div>
              <TrendChart data={data} hatchLast={false} animKey={src + range} fmtValue={(v) => v.toFixed(1)} />
              <div className="ra-src"><div className="sec-title">Reward sources</div>
                {[['Creator Rewards Program', crp], ['LIVE Gifts', gifts]].map(([n, v]) => (
                  <div key={n} className="bar-row"><div className="bar-top"><span>{n} <small>{total ? Math.round((v / total) * 100) : 0}%</small></span><span className="bar-v">{fmtMoney(v)}</span></div><div className="bar-track"><div className="bar-fill" style={{ width: `${total ? (v / total) * 100 : 0}%` }} /></div></div>
                ))}
              </div>
            </section>
          ) : (
            <>
              <div className="chips">{['Program', 'Date range', 'Publish date'].map((l) => <Chip key={l} act={`ra-chip-${l}`} label={chipSel[l] || l} active={!!chipSel[l]} onPress={() => openSheet('optionList', { title: l })} />)}</div>
              <div className="muted small" style={{ padding: '0 16px' }}><I.info size={12} /> Currently, only some monetization programs provide rewards analytics for each post.</div>
              {postRewards.length ? postRewards.map(({ post, value }, i) => (
                <button key={post.id} className="rank-row" data-act="ra-post-open" onClick={() => useApp.getState().push('videoAnalysis', { postId: post.id })}>
                  <span className="rank">{i + 1}</span>
                  <Cover item={post} w={56} h={74} />
                  <div className="rr-text"><div className="rr-title">{post.title || 'Untitled post'}</div><div className="rr-sub">{fmtMoney(value)} in the last {days} days</div></div>
                </button>
              )) : <div className="ra-empty"><I.videoCam size={46} /><b>No videos to show</b><span>Posts eligible for rewards will appear here.</span></div>}
            </>
          )}
        </Scroll>
      )}
    </div>
  );
}

// ---------- Creator Rewards Program（usrec 1:36–1:38） ----------
export function CreatorRewardsScreen() {
  const showToast = useApp((s) => s.showToast);
  const [notify, setNotify] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // 2026-11-26：用账号自己的数据（之前写死 0 / 0，和 Analytics 的 10,915 粉、近 30 天 129K 播放对不上）；新账号仍是 0
  const newAccount = useApp((s) => s.newAccount);
  const followers = newAccount ? 0 : DAILY.followersTotal[PERIOD_END];
  const views = newAccount ? 0 : DAILY.views.slice(PERIOD_END - 29, PERIOD_END + 1).reduce((a, b) => a + b, 0);
  const okF = followers >= 10000, okV = views >= 100000;
  return (
    <div className="screen crp">
      <div className={`crp-nav ${scrolled ? 'scrolled' : ''}`}><button aria-label="Back" data-act="nav-back" onClick={() => useApp.getState().pop()}><I.back size={26} /></button>{scrolled && <span>Creator Rewards Program</span>}</div>
      <Scroll onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}>
        <div className="crp-hero"><div className="crp-kicker">{okF && okV ? 'You’re in the program' : 'You’re almost eligible'}</div><h1>Creator Rewards Program</h1><Illo name="crp-squiggle" className="crp-squiggle" fallback={<svg className="crp-squiggle" viewBox="0 0 120 50"><path d="M4 40 C20 0 30 50 46 14 S70 44 84 8 S108 40 116 10" stroke="#9cfce4" strokeWidth="9" fill="none" strokeLinecap="round" /></svg>} /></div>
        {[['Create longer videos to earn bigger rewards', 'star', '#fceab4'], ['Earn more with high-quality content', 'video', '#c6f0e4'], ['Monetize alongside other popular creators', 'trend', '#e3dcfb']].map(([t, ic, bg]) => (
          <div key={t} className="crp-card" style={{ background: bg }}><span>{t}</span><CrpIcon kind={ic} /></div>
        ))}
        <div className="crp-req-title">{okF && okV ? 'You meet all the requirements:' : 'To join, you need to meet the following requirements:'}</div>
        <div className="crp-req ok"><I.check size={16} /> Be at least 18 years old</div>
        <div className={`crp-req ${okF ? 'ok' : 'no'}`}>{okF ? <I.check size={16} /> : <I.close size={16} />} Have at least 10,000 followers<div className="crp-bar"><i style={{ width: `${Math.min(1, followers / 10000) * 100}%` }} /></div><em>{followers.toLocaleString('en-US')}</em></div>
        <div className={`crp-req ${okV ? 'ok' : 'no'}`}>{okV ? <I.check size={16} /> : <I.close size={16} />} Have at least 100,000 video views in the last 30 days<div className="crp-bar"><i style={{ width: `${Math.min(1, views / 100000) * 100}%` }} /></div><em>{Math.round(views).toLocaleString('en-US')}</em></div>
        <div className="muted small" style={{ padding: '14px 20px 120px' }}>To learn more about the Creator Rewards Program or share feedback, see Frequently asked questions.</div>
      </Scroll>
      <div className="crp-foot">{okF && okV
        ? <button className="btn-primary block" data-act="crp-rewards" onClick={() => useApp.getState().push('rewardsAnalyticsUS')}>View rewards analytics</button>
        : <button className="btn-primary block" data-act="crp-notify" onClick={() => { setNotify(true); showToast('You’ll be notified when you’re eligible'); }}>{notify ? 'We’ll notify you' : 'Notify me when eligible'}</button>}</div>
    </div>
  );
}

// ---------- 指标说明弹层（usrec 2:25 / 2:28 / 2:33） ----------
const DEFS = {
  overview: [['Post views', 'The number of times your posts were viewed.'], ['Profile views', 'The number of times your profile was viewed.'], ['Likes', 'The number of times viewers liked your posts.'], ['Comments', 'The number of comments your posts received.'], ['Shares', 'The number of times your posts were shared.'], ['Est. rewards', 'Estimated rewards for eligible posts published during the selected period.']],
  viewers: [['Total viewers', 'All viewers who watched your posts, whether new or returning.'], ['Returning viewers', 'Viewers who watched your posts in the past year and again during the selected period.'], ['New viewers', 'Viewers who watched your posts for the first time in a year during the selected period.']],
  followers: [['Total followers', 'The total number of people following you.'], ['Net followers', 'New followers minus lost followers during the selected period.']],
};
export function KpiInfoSheet({ tab }) {
  return (
    <SheetFrame title="Key metrics">
      <div className="kd-list">{(DEFS[tab] || DEFS.overview).map(([t, d]) => <div key={t}><b>{t}</b><span>{d}</span></div>)}</div>
      <div className="kd-foot">Data is displayed in UTC.</div>
    </SheetFrame>
  );
}
