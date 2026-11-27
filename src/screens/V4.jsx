// V4 新增：用另一份调研（Creator_Operations_Research_CN.html）里的独立 App 官方宣传图补足的页面
// - 话题洞察搜索：appstore_search_insights（fig18，iOS App Store 宣传图）
// - Creator 成长时间线：appstore_inspiration_insights（fig19）
// - 旧版 Monetize Tab：appstore_monetization（fig5 / fig20）
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store.js';
import { NavBar, Pills, Scroll, Cover, Avatar, Section, Chip, LargeHeader } from '../ui/kit.jsx';
import { SheetFrame } from '../shell/Overlays.jsx';
import { I } from '../ui/Icons.jsx';
import { rng, INSPIRATION, POSTS } from '../data/seed.js';
import { fmt, fmtMoney, overviewKpis, listTime } from '../data/agg.js';
import { ModuleC } from '../insight/ModuleC.jsx';
import { buildModuleC } from '../insight/build.js';

const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// ---------------- 话题洞察搜索（fig18） ----------------
const S_TABS = ['Top', 'Videos', 'Users', 'Sounds', 'Hashtags'];
const TRENDING_SEARCHES = ['travel itineraries', 'packing tips', 'carry-on only', 'kyoto', 'budget trips', 'thanksgiving travel'];
function topicInsight(q) {
  const r = rng(hash(q.toLowerCase()));
  const words = q.trim().split(/\s+/);
  const base = words[words.length - 1].replace(/s$/, '');
  const cap = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());
  const raw = [`${cap(base)} for beginners`, `Quick and easy ${base}s`, `Healthy ${base}s`, `${cap(base)} on a budget`, `Viral ${base} trends`];
  let weights = raw.map(() => 0.3 + r()); const sum = weights.reduce((a, b) => a + b, 0); weights = weights.map((w) => w / sum);
  const breakdown = raw.map((t, i) => [t, weights[i]]).sort((a, b) => b[1] - a[1]).slice(0, 4);
  return {
    popularity: Math.round(55 + r() * 44), popDelta: Math.round(r() * 30) + 1,
    competition: Math.round(40 + r() * 55), compDelta: Math.round(r() * 20) + 1,
    breakdown,
    videos: Array.from({ length: 8 }, (_, i) => {
      const src = INSPIRATION[(hash(q) + i) % INSPIRATION.length];
      return { id: `${q}-${i}`, hue: (src.hue + i * 37) % 360, emoji: src.emoji, views: Math.round(src.views / (1.5 + i * 0.8) * (0.6 + r())), likes: Math.round(src.likes / (2 + i)), followers: Math.round(src.creatorStats.followers * (0.2 + r())), creator: src.creator, region: ['US', 'UK', 'CA', 'AU'][i % 4], caption: `${cap(q)} #${base}${i}` };
    }),
  };
}
const FC_OPTS = [{ key: 'all', label: 'All' }, { key: 'lt10k', label: 'Under 10K' }, { key: '10k1m', label: '10K–1M' }, { key: 'gt1m', label: 'Over 1M' }];
const VV_OPTS = [{ key: 'all', label: 'All' }, { key: 'gt100k', label: 'Over 100K' }, { key: 'gt1m', label: 'Over 1M' }];
const RG_OPTS = [{ key: 'all', label: 'All regions' }, { key: 'US', label: 'United States' }, { key: 'UK', label: 'United Kingdom' }, { key: 'CA', label: 'Canada' }, { key: 'AU', label: 'Australia' }];
const SORT_OPTS = [{ key: 'relevance', label: 'Relevance' }, { key: 'views', label: 'Most viewed' }, { key: 'likes', label: 'Most liked' }];

function OptionSheet({ title, options, value, onPick }) {
  const close = useApp((s) => s.closeSheet);
  return (
    <SheetFrame title={title}>
      {options.map((o) => (
        <button key={o.key} className="opt-row" data-act={`topic-opt-${o.key}`} onClick={() => { close(); onPick(o.key); }}>
          <span>{o.label}</span><span className={`radio ${value === o.key ? 'on' : ''}`}><i /></span>
        </button>
      ))}
    </SheetFrame>
  );
}
export const V4_SHEETS = { topicOption: OptionSheet };
// 注：aiInfo 在文件末尾注册

// 美国 2026-11-22 录屏（usrec 2:50–4:42）：猜你喜欢 / 历史 / 提示气泡 → 结果页（AI creation insights 卡 + 视频网格）
const R_TABS = [['top', 'Top'], ['videos', 'Videos'], ['users', 'Users'], ['sounds', 'Sounds'], ['hashtags', 'Hashtags']];
const SUGGEST = [['live shop sale', 'hot'], ['tiktok shop online shop', 'hot'], ['winwilliam'], ['Wonder Back To You Selfie Trend', 'trending'], ['GTA 6 Prison Ending', 'trending'], ['auctions live'], ['Shop TikTok Products'], ['Walmart Shares Fall', 'trending'], ['creatorsearchinsights'], ['Shopping From TikTok']];
// 「Creators are posting」按话题类型给内容。只有 live shop sale 的四行和百分比是录屏原文（usrec 3:01），其余为模拟
const POSTING_SETS = [
  [/shop|sale|auction|deal|product|walmart|store/i, ['Fashion & seasonal promos', 'Tech & home finds', '$1 live auctions', 'Beauty & personal care'],
    ['LIVE now with double discounts!!!', 'Everything in my cart is under $20', 'Unboxing this week’s TikTok Shop order', 'Restock day — come shop with me', 'Holiday gift guide: finds they’ll actually use', 'Trying the viral shapewear so you don’t have to', '$1 auction starts in 10 minutes', 'Desk setup finds that changed my routine'], ['product', 'portrait']],
  [/gta|xbox|rockstar|playstation|gameplay/i, ['News explainers', 'Gameplay predictions', 'Reaction clips', 'Memes & edits'],
    ['What this actually means for launch day', 'Every detail hidden in the announcement', 'My honest reaction to the news', 'Ranking the rumours from likely to never', 'Can your console even run it?', 'Explaining it in 60 seconds', 'The community is not okay 😭', 'Map size comparison, side by side'], ['product', 'portrait']],
  [/premiere|trailer|bond|hunger games|eurovision|award|speculation|season|episode|goes viral/i, ['Red carpet & cast moments', 'Trailer breakdowns', 'Fan reactions & theories', 'Outfit recreations'],
    ['Red carpet looks, ranked 😍', 'Every detail you missed in the trailer', 'Book vs. movie: what they changed', 'Cast interview moments I can’t stop replaying', 'My theory about the ending', 'Recreating the premiere look on a budget', 'POV: you got tickets for opening night', 'Reacting to the first reviews'], ['portrait', 'portrait']],
  [/faces|rout|ufc|trash talk|\d-\d|match|cup|league|vs\b/i, ['Match highlights', 'Fan reactions', 'Tactical breakdowns', 'Memes & edits'],
    ['That goal from every angle', 'Watch party reaction — we lost it', 'Why the press worked: 3 clips', 'Player ratings, no bias', 'The moment the stadium went silent', 'Post-match interview highlights', 'Edit: the whole night in 30 seconds', 'What this result means for the table'], ['portrait', 'portrait']],
  [/spacex|launch|starship|shares|microsoft|claim|recap|flight/i, ['News explainers', 'Original footage', 'Reaction clips', 'Fact checks'],
    ['Explained in 60 seconds', 'The footage everyone is sharing', 'What the headlines got wrong', 'I watched it live — here’s what happened', 'Fact check: is this clip real?', 'Timeline of the whole thing', 'Why this matters more than you think', 'Slow-mo of the key moment'], ['product', 'portrait']],
  [/trend|selfie|dance|challenge/i, ['Selfie lip-sync', 'Photo slideshow memories', 'Relationship captions', 'Product showcase'],
    ['Had to try this one', 'Our version of the trend', 'Photo dump, but make it the trend', 'He didn’t know I was filming', 'Tutorial: how to get the transition', 'Trying it with my mom', 'Take 14 was the one', 'The trend, but at work'], ['portrait', 'portrait']],
  [/travel|trip|itinerar|pack|hik|kyoto|tokyo|flight|hotel|beach|city/i, ['Itineraries', 'Packing guides', 'Hotel reviews', 'Day trips'],
    ['The 3-day version', 'Rating every one I could find', 'Is it worth the 2-hour line?', 'Planning the whole week', 'How locals do it', 'The mistake everyone makes', 'Budget version: under $100', 'Going for the first time'], ['food', 'food']],
];
const POSTING_FALLBACK = [/./, ['Explainers', 'Reactions', 'Tutorials', 'Memes & edits'],
  ['Explained in 60 seconds', 'My honest reaction', 'How to do it, step by step', 'The edit nobody asked for', 'Things I wish I knew sooner', 'Reacting to your comments', 'A beginner’s guide', 'Day 1 vs. day 30'], ['portrait', 'product']];
// 2026-11-26：话题卡的三个分数和子话题占比与飞书一致。live shop sale 用飞书画板的演示值（62 / 78 / 36，43% / 32% / 21% / 4%）；
// 其他搜索词按词生成，Relevance 按和旅行内容的关联给分（个人关联算法待推荐团队确认，〇.3.6）
const TRAVEL_RE = /travel|trip|itinerar|pack|hik|kyoto|tokyo|flight|hotel|beach|city|budget|amalfi|lisbon|bali|milan|paris/i;
function aiInsight(q) {
  const r = rng(hash(q.toLowerCase()));
  const doc = q.trim().toLowerCase() === 'live shop sale';
  const pop = doc ? 62 : Math.round(r() * 70), comp = doc ? 36 : Math.round(20 + r() * 78);
  const rel = doc ? 78 : TRAVEL_RE.test(q) ? 62 + Math.round(r() * 28) : 12 + Math.round(r() * 30);
  const [, labels, caps, kinds] = POSTING_SETS.find(([re]) => re.test(q)) || POSTING_FALLBACK;
  let w = [0.43, 0.32, 0.21, 0.04];
  if (!doc) { const a = 34 + Math.round(r() * 16), b = 20 + Math.round(r() * 9), d = 4 + Math.round(r() * 8); w = [a, b, 100 - a - b - d, d].sort((x, y) => y - x).map((x) => x / 100); }
  const rows = labels.map((l, i) => [l, w[i]]);
  const off = hash(q) % caps.length;
  return { pop, comp, rel, rows, spark: Array.from({ length: 10 }, () => r()), videos: Array.from({ length: 8 }, (_, i) => { const src = INSPIRATION[(hash(q) + i) % INSPIRATION.length]; return { id: src.id, key: `${q}-${i}`, hue: (src.hue + i * 37) % 360, emoji: src.emoji, likes: Math.round(src.likes / (2 + i * 1.5)), creator: src.creator, caption: caps[(off + i) % caps.length], scene: kinds[i % 3 === 1 ? 0 : 1] }; }) };
}
const Spark = ({ pts, color }) => <svg width="34" height="14" viewBox="0 0 34 14"><polyline points={pts.map((v, i) => `${i * 3.7},${12 - v * 10}`).join(' ')} fill="none" stroke={color} strokeWidth="1.2" /></svg>;

export function TopicSearchScreen({ params = {} }) {
  const chipSel = useApp((s) => s.chipSel);
  const pop = useApp((s) => s.pop);
  const push = useApp((s) => s.push);
  const openSheet = useApp((s) => s.openSheet);
  const [input, setInput] = useState(params.q || '');
  const [q, setQ] = useState(params.q || '');
  const [loading, setLoading] = useState(!!params.q);
  const [history, setHistory] = useState(() => (window.__tsHistory ||= []));
  const [tip, setTip] = useState(!window.__tsTipSeen);
  const [order, setOrder] = useState(0);
  const [tab, setTab] = useState('top');
  const [open, setOpen] = useState(null);
  const [rowsReady, setRowsReady] = useState(false);
  const [following, setFollowing] = useState({});
  const ins = useMemo(() => (q ? aiInsight(q) : null), [q]);
  useEffect(() => {
    if (!q) return;
    setLoading(true); setRowsReady(false);
    const t1 = setTimeout(() => setLoading(false), 600); // 单个红点 loading（usrec 2:55）
    const t2 = setTimeout(() => setRowsReady(true), 1700); // 「Creators are posting」先闪光骨架（usrec 2:56–3:00）
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [q]);
  const submit = (text) => {
    const t = (text ?? input).trim() || 'live shop sale';
    setInput(t); setQ(t); setTab('top'); setOpen(null);
    const h = [t, ...history.filter((x) => x !== t)].slice(0, 5); window.__tsHistory = h; setHistory(h);
  };
  const sugg = SUGGEST.slice(order % 3).concat(SUGGEST.slice(0, order % 3));
  return (
    <div className="screen">
      <div className="ts-top">
        <button aria-label="Back" data-act="nav-back" onClick={() => (q ? (setQ(''), setInput('')) : pop())}><I.back size={26} /></button>
        <div className="search-field">
          <I.search size={18} />
          <input autoFocus={!q} data-act="topic-search-input" value={input} placeholder="live shop sale" onChange={(e) => setInput(e.target.value)} onFocus={() => q && setQ('')} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          {q && input && <button aria-label="Clear search" data-act="topic-search-clear" className="ts-clear" onClick={() => { setInput(''); setQ(''); }}><I.close size={11} /></button>}
        </div>
        {q ? <button aria-label="More options" data-act="topic-search-more" onClick={() => openSheet('info', { title: 'More', text: 'Share search · Report a problem' })}><I.more size={22} /></button>
          : <button className="ts-go" data-act="topic-search-submit" onClick={() => submit()}>Search</button>}
      </div>
      {!q ? (
        <Scroll>
          {history.map((h) => (
            <div key={h} className="ts-hist"><button data-act="topic-history" onClick={() => submit(h)}><I.clock size={16} /> {h}</button><button aria-label="Remove" data-act="topic-history-remove" onClick={() => { const x = history.filter((y) => y !== h); window.__tsHistory = x; setHistory(x); }}><I.close size={14} /></button></div>
          ))}
          <div className="ts-sugg-head"><b>You may like</b><button data-act="topic-refresh" onClick={() => setOrder((o) => o + 1)}>↻ Refresh</button>
            <AnimatePresence>{tip && <motion.button className="ts-tip" data-act="topic-tip" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onClick={() => { window.__tsTipSeen = true; setTip(false); setOrder((o) => o + 1); }}>Tap to see more recommended topics</motion.button>}</AnimatePresence>
          </div>
          {sugg.map(([t, tag], i) => (
            <button key={t} className={`ts-sugg ${i < 2 ? 'hot' : ''}`} data-act="topic-trending" onClick={() => submit(t)}>
              <i className="ts-dot" /><span>{t}{tag === 'trending' && <small><I.insights size={10} /> Trending</small>}</span>
            </button>
          ))}
          <div className="ts-foot"><button data-act="topic-help">Help us improve</button><i /> <button data-act="topic-learn">Learn more</button></div>
        </Scroll>
      ) : loading ? (
        <div className="ts-loading"><span className="red-pulse" /></div>
      ) : (
        <>
          <div className="ts-tabs">{R_TABS.map(([k, l]) => <button key={k} data-act={`topic-tab-${l}`} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{tab === k && <motion.i layoutId="tst" className="tt-line" />}</button>)}</div>
          <div className="chips ts-chips">
            {tab === 'users' ? ['Follower count', 'Account type', 'Other preferences'].map((l) => <Chip key={l} act={`topic-ufilter-${l}`} label={chipSel[l] || l} active={!!chipSel[l]} onPress={() => openSheet('optionList', { title: l })} />) : (
              <>
                <button aria-label="Sort" className="chip ts-sort" data-act="topic-sort" onClick={() => openSheet('topicOption', { title: 'Sort by', options: [{ key: 'relevance', label: 'Relevance' }, { key: 'views', label: 'Most viewed' }, { key: 'latest', label: 'Latest' }], value: 'relevance', onPick: () => {} })}><I.sortList size={17} /></button>
                {['Follower count', 'Video views', 'Region', 'Date posted'].map((l) => <Chip key={l} act={`topic-filter-${l}`} label={chipSel[l] || l} active={!!chipSel[l]} onPress={() => openSheet('optionList', { title: l })} />)}
              </>
            )}
          </div>
          <Scroll className="ts-body">
            {tab === 'top' && (
              /* 模块 C（design_final/post_topic · IMS-C-Blue）：无标题，AI 标记 + 洞察句 + 三条分数；下半部分沿用原实现 */
              <div style={{ padding: 8 }}>
              <ModuleC className="ai-card" insight={buildModuleC(q, ins)}>
                <div className="ai-posting" style={{ marginTop: 0 }}>Creators are posting</div>
                {!rowsReady ? [0, 1, 2].map((i) => <div key={i} className="ai-shimmer"><i /><i /></div>) : ins.rows.map(([t, w], i) => (
                  <div key={t}>
                    <button className="ai-row" data-act="ai-posting-row" onClick={() => setOpen(open === i ? null : i)}><span>{t}</span><span>{Math.round(w * 100)}% <I.down size={14} style={{ transform: open === i ? 'rotate(180deg)' : undefined }} /></span></button>
                    <AnimatePresence>{open === i && <motion.div className="ai-x h-scroll" style={{ marginRight: -16 }} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{ins.videos.slice(i, i + 4).map((v) => <span key={v.key} className="ci-ct"><Cover item={v} w={96} h={127} text={false} radius={6} /><em><I.heart size={12} /> {fmt(v.likes)}</em></span>)}</motion.div>}</AnimatePresence>
                  </div>
                ))}
                <button className="ai-post" data-act="ai-post-now" onClick={() => useApp.getState().openModal('picker', { mode: 'upload' })}><I.videoCam size={17} /> Post now</button>
              </ModuleC>
              </div>
            )}
            {(tab === 'top' || tab === 'videos') && (
              <div className="ts-grid">{ins.videos.map((v) => (
                <button key={v.key} className="ts-cell" data-act="topic-video" onClick={() => push('searchPlayer', { id: v.id, q, hue: v.hue, scene: v.scene, caption: v.caption })}>
                  <Cover item={v} w={170} h={226} text={false} radius={6} />
                  <span className="ts-cap">{v.caption}</span>
                  <span className="ts-meta"><Avatar hue={v.hue} size={14} /> {v.creator} <em><I.heart size={11} /> {fmt(v.likes)}</em></span>
                </button>))}</div>
            )}
            {tab === 'users' && INSPIRATION.map((x) => (
              <div key={x.id} className="ts-user"><Avatar hue={x.hue} size={44} label={x.creator[0].toUpperCase()} /><div className="rr-text"><div className="rr-title">{x.creator}</div><div className="rr-sub">{fmt(x.creatorStats.followers)} followers · {fmt(x.creatorStats.totalLikes)} likes</div></div>
                <button className={`ts-follow ${following[x.id] ? 'on' : ''}`} data-act="topic-follow" onClick={() => setFollowing({ ...following, [x.id]: !following[x.id] })}>{following[x.id] ? 'Following' : 'Follow'}</button></div>
            ))}
            {tab === 'sounds' && INSPIRATION.map((x) => <div key={x.id} className="ts-user"><Cover item={x} w={44} h={44} text={false} radius={6} /><div className="rr-text"><div className="rr-title">{x.sound}</div><div className="rr-sub">{fmt(x.views / 20)} posts</div></div></div>)}
            {tab === 'hashtags' && ins.rows.map(([t, w]) => <div key={t} className="ts-user"><span className="ts-hash">#</span><div className="rr-text"><div className="rr-title">#{t.toLowerCase().replace(/[^a-z0-9]+/g, '')}</div><div className="rr-sub">{fmt(w * 4.2e8)} views</div></div></div>)}
            <div style={{ height: 30 }} />
          </Scroll>
        </>
      )}
    </div>
  );
}

export function AiInfoSheet() {
  return (
    <SheetFrame title="AI creation insights">
      <div className="kd-list">
        <div><span>AI creation insights uses a score from 0 to 100 to show how popular or saturated a topic is in TikTok’s current content ecosystem.</span></div>
        <div><b>Popularity</b><span>Based on search volume and average views, this reflects how interested viewers are in the topic. A higher score means more demand; a lower score may mean a niche or emerging topic.</span></div>
        <div><b>Content saturation</b><span>Reflects how much content already exists for the topic. A lower score means more room for new content; a higher score means the topic is already well covered.</span></div>
        <div><b>Creators are posting</b><span>Based on your search and top-performing content types, see what other creators are posting. A higher percentage means more videos in that sub-topic.</span></div>
      </div>
    </SheetFrame>
  );
}

// Manage 右上角的普通搜索：搜本人作品（V3 的 Search，原型假设）
export function PostSearchScreen() {
  const [q, setQ] = useState('');
  const push = useApp((s) => s.push);
  const pop = useApp((s) => s.pop);
  const posts = useMemo(() => (q ? POSTS.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())).slice(0, 12) : []), [q]);
  return (
    <div className="screen">
      <div className="search-top">
        <div className="search-field"><I.search size={18} /><input autoFocus data-act="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your posts" /></div>
        <button data-act="search-cancel" onClick={pop}>Cancel</button>
      </div>
      <Scroll>
        {!q ? <div className="muted-note pad">Search your posts by title or description.</div> : posts.length ? posts.map((p) => (
          <button key={p.id} className="rank-row" style={{ padding: '10px 16px' }} data-act="search-result" onClick={() => push('videoAnalysis', { postId: p.id })}>
            <Cover item={p} w={48} h={64} /><div className="rr-text"><div className="rr-title">{p.title}</div><div className="rr-sub">{listTime(p.publishedAt)} · {fmt(p.views)} views</div></div>
          </button>
        )) : <div className="muted-note center" style={{ paddingTop: 60 }}>No results for “{q}”</div>}
      </Scroll>
    </div>
  );
}

// ---------------- Creator 成长时间线（fig19） ----------------
export function CreatorTimeline({ item }) {
  const r = rng(hash(item.creator));
  const ms = [
    { d: '12/15', y: '2025', t: 'Reached 50K followers', n: 16, avg: 600 },
    { d: '8/20', y: '2025', t: 'Reached 10K followers', n: 42, avg: 210 },
    { d: '3/02', y: '2025', t: 'First post over 100K views', n: 9, avg: 1800 },
  ];
  return (
    <div className="ct-line">
      {ms.map((m, i) => (
        <div key={i} className="ct-item">
          <div className="ct-date"><b>{m.d}</b><span>{m.y}</span></div>
          <div className="ct-body">
            <div className="ct-t">{m.t}</div>
            <div className="ct-x">{m.n} posts published, with an average of {m.avg} views per post. Top words used in titles: {item.topWords.slice(0, 3).join(', ')}. Top 3 posts you can learn from:</div>
            <div className="ct-posts">{[0, 1, 2].map((k) => <span key={k} className="ct-p"><Cover item={{ hue: (item.hue + k * 40 + i * 20) % 360, emoji: item.emoji }} w={76} h={100} text={false} radius={4} /><em><I.playFill size={10} /> {fmt(Math.round(item.views / (8 + k * 3 + i * 5) * (0.7 + r() * 0.5)))}</em></span>)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- 旧版 Monetize Tab（fig5 / fig20，iOS App Store 宣传图；底部 Tab 有 $） ----------------
export function LegacyMonetiseV4() {
  const showAlert = useApp((s) => s.showAlert);
  const push = useApp((s) => s.push);
  const openSheet = useApp((s) => s.openSheet);
  const k = overviewKpis({ key: '7' });
  const [dismissed, setDismissed] = useState([]);
  const toMain = (what) => showAlert({ title: 'Continue to TikTok app?', message: `Open ${what} in TikTok`, actions: [{ label: 'Cancel' }, { label: 'Continue', bold: true, onPress: () => useApp.getState().showToast('Opening TikTok…') }] });
  const insights = [
    { id: 'ri1', t: 'Revenue insight', b: 'Based on your features, we believe you have high potential to create videos that are 1 minute or longer to get rewarded.' },
    { id: 'ri2', t: 'Program tip', b: 'Creators like you who turned on Subscription earned more from their most engaged viewers.' },
  ].filter((x) => !dismissed.includes(x.id));
  const [lb, setLb] = useState('recommended');
  return (
    <div className="screen gray">
      <div className="fixed-head"><LargeHeader title="Monetization" /></div>
      <Scroll id="monetise" className="with-tabbar">
        <div className="money-card m26">
          <div className="mc-top"><span className="small">Estimated rewards in the last 7 days <I.info size={12} /></span></div>
          <div className="mc-num">{fmtMoney(k[5].value)}</div>
          <button className="mc-bal" data-act="money-view" onClick={() => toMain('Balance')}><span>Balance: {fmtMoney(k[5].value * 3.2)}</span><span>View <I.right size={14} /></span></button>
        </div>
        <Section title="Rewards analytics" right={<button className="link-btn" data-act="rewards-viewall" onClick={() => push('rewardsAnalytics')}>View all <I.right size={14} /></button>}>
          <div className="kpi-grid">
            {[['Creator Rewards', k[5].value, 0.275], ['Subscription', k[5].value * 0.18, -0.075]].map(([l, v, d]) => (
              <button key={l} className="ra-card" data-act="rewards-card" onClick={() => push('rewardsAnalytics')}>
                <b>{fmtMoney(v)}</b><span>{l}</span><em className={d > 0 ? 'up' : 'down'}>{d > 0 ? '▲' : '▼'} {Math.abs(d * 100).toFixed(1)}% <i>7d</i></em>
              </button>
            ))}
          </div>
        </Section>
        {insights.length > 0 && (
          <div className="ri-scroll h-scroll">
            {insights.map((x) => (
              <div key={x.id} className="ri-card">
                <div className="ri-h"><b>{x.t}</b><button aria-label="Dismiss" data-act="revenue-insight-dismiss" onClick={() => setDismissed((d) => [...d, x.id])}><I.close size={18} /></button></div>
                <div className="ri-b">{x.b}</div>
                <button className="ri-apply" data-act="revenue-insight-apply" onClick={() => toMain('Creator Rewards Program')}>Apply now</button>
              </div>
            ))}
          </div>
        )}
        <Section title="Programs for you" right={<button className="link-btn" data-act="programs-viewall" onClick={() => openSheet('info', { title: 'Programs', text: 'Subscription · Video Gifts · Service+ · LIVE Gifts · TikTok Shop for Sellers · Creator Marketplace' })}>View all <I.right size={14} /></button>}>
          {[['TikTok Shop for Creator', <I.bag size={20} />, 'Create videos that are 1 minute or longer to get rewarded on qualified views.'], ['Subscription', <I.star size={20} />, 'Offer exclusive perks to your most engaged viewers.'], ['Video Gifts', <I.gift size={20} />, 'Let viewers send Gifts on your videos.']].map(([n, ic, d]) => (
            <div key={n} className="prog-row v4"><span className="pr-ic">{ic}</span><span className="pr-txt"><b>{n}</b><small>{d} <u>Learn more</u></small></span><button className="btn-join" data-act={`join-${n}`} onClick={() => toMain(n)}>Apply</button></div>
          ))}
        </Section>
        <Section title="Trending in Monetisation">
          <Pills variant="blue" value={lb} onChange={setLb} items={[{ key: 'recommended', label: 'Recommended' }, { key: 'live', label: 'LIVE rewards' }]} />
          {(lb === 'recommended' ? INSPIRATION : [...INSPIRATION].reverse()).slice(0, 4).map((x) => (
            <button key={x.id} className="rank-row" data-act="monetise-creator" onClick={() => push('creatorProfile', { id: x.id })}><Avatar hue={x.hue} size={40} label={x.creator[0].toUpperCase()} /><div className="rr-text"><div className="rr-title">{x.creator}</div><div className="rr-sub">{fmt(x.creatorStats.followers)} followers</div></div></button>
          ))}
        </Section>
      </Scroll>
    </div>
  );
}

export function RewardsAnalyticsScreen() {
  const [range, setRange] = useState('7');
  const k = overviewKpis({ key: range });
  return (
    <div className="screen gray">
      <NavBar title="Rewards analytics" />
      <Scroll>
        <div style={{ padding: '12px 16px 0' }}><Pills value={range} onChange={setRange} items={[{ key: '7', label: '7 days' }, { key: '28', label: '28 days' }, { key: '60', label: '60 days' }]} /></div>
        <Section title="Estimated rewards" sub="Last 7 days">
          <div className="big-num">{fmtMoney(k[5].value)}</div>
          <div className="muted small">Creator Rewards · {fmtMoney(k[5].value)} · Subscription · {fmtMoney(k[5].value * 0.18)}</div>
        </Section>
      </Scroll>
    </div>
  );
}

V4_SHEETS.aiInfo = AiInfoSheet;
