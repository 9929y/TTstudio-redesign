// Home（2026 iOS：Home | Inspiration 全屏竖版视频流，右侧 Insights；QKE_0038）
// Insights 弹层（ZrMm_0036，Android 平板：Post / Creator）
// 2024–25 版 Home 仪表盘（o1g 0:21、rpfqP，放在「2024–25 IA」开关后）
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, animate, useMotionValue } from 'framer-motion';
import { useApp } from '../store.js';
import { Avatar, Pills, Section, KpiCard, Cover, Scroll, LargeHeader, Spinner, CapText, asButton } from '../ui/kit.jsx';
import { TrendChart } from '../ui/charts.jsx';
import { SheetFrame } from '../shell/Overlays.jsx';
import { I } from '../ui/Icons.jsx';
import { INSPIRATION, POSTS, ACCOUNT, NOW, DAY_MS, PERIOD_END, DAILY } from '../data/seed.js';
import { fmt, fmtStat, overviewKpis, fmtMoney, monDay } from '../data/agg.js';
import { VideoStage } from './VideoAnalysis.jsx';
import { CreatorTimeline } from './V4.jsx';
import { RankBadge, Flame, TOPICS as US_TOPICS } from './US.jsx';
import { CaIcon } from './Subflows.jsx';
import { ModuleD } from '../insight/ModuleD.jsx';
import { buildModuleD, homePrompts, latestPost } from '../insight/build.js';
import { AskPill } from '../insight/AskAssistant.jsx';

// 首页 Creator Assistant 入口轮播的 8 条问题（数据驱动，见 insight/build.js homePrompts）
const HOME_PROMPTS = homePrompts();
import { CuratedForMe } from '../insight/CuratedForMe.jsx';

const FEED_H = 852;

function FeedItem({ item, own, active }) {
  const push = useApp((s) => s.push);
  const openSheet = useApp((s) => s.openSheet);
  const liked = useApp((s) => s.feedLikes[item.id]);
  const saved = useApp((s) => s.feedSaves[item.id]);
  const toggleLike = useApp((s) => s.toggleFeedLike);
  const toggleSave = useApp((s) => s.toggleFeedSave);
  const showToast = useApp((s) => s.showToast);
  const d = own ? item.publishedAt : new Date(NOW.getTime() - item.postedDaysAgo * DAY_MS);
  return (
    <div className="feed-item" style={{ height: FEED_H }}>
      <VideoStage item={item} paused={!active}>
        <div className="rail">
          <button className="rail-insights" data-act="feed-insights" onClick={() => (own ? push('videoAnalysis', { postId: item.id }) : openSheet('insights', { id: item.id }))}>
            {useApp.getState().market === 'store' ? <span className="ri-circle"><I.insights size={20} /></span> : <span className="ri-squircle"><I.railAnalysis size={40} /></span>}<span>{useApp.getState().market === 'store' ? 'Insights' : 'Analysis'}</span>
          </button>
          <div className="rail-avatar"><Avatar hue={own ? ACCOUNT.avatarHue : item.hue} size={46} label={(own ? 'ML' : item.creator[0]).toUpperCase()} ring />{!own && <span className="follow-plus">+</span>}</div>
          <button data-act="feed-like" onClick={() => toggleLike(item.id)} className={liked ? 'liked' : ''}><motion.span animate={liked ? { scale: [1, 1.3, 1] } : {}}><I.heart size={34} filled /></motion.span><span>{fmt(item.likes + (liked ? 1 : 0))}</span></button>
          <button data-act="feed-comments" onClick={() => (own ? push('videoComments', { postId: item.id }) : openSheet('feedComments', { id: item.id }))}><I.commentFill size={32} /><span>{fmt(item.comments)}</span></button>
          <button data-act="feed-save" onClick={() => toggleSave(item.id)} className={saved ? 'saved' : ''}><I.bookmark size={30} filled /><span>{fmt(item.saves + (saved ? 1 : 0))}</span></button>
          <button aria-label="More options" data-act="feed-more" onClick={() => openSheet('feedMore', { id: item.id, own })}><I.more size={28} /></button>
        </div>
        <div className="stage-caption">
          <b>{own ? ACCOUNT.name : item.creator}</b> · {d.getMonth() + 1}-{d.getDate()}
          <CapText text={item.caption || item.title || 'Untitled post'} />
          <div className="cap-sound"><I.music size={13} /> {own ? `original sound - ${ACCOUNT.handle}` : item.sound}</div>
        </div>
      </VideoStage>
    </div>
  );
}

function Feed({ items, own, k }) {
  const idx = useApp((s) => s.feedIndex[k]);
  const setIdx = useApp((s) => s.setFeedIndex);
  const y = useMotionValue(-idx * FEED_H);
  const wheelLock = useRef(0);
  const go = (i) => {
    const n = Math.max(0, Math.min(items.length - 1, i));
    setIdx(k, n);
    animate(y, -n * FEED_H, { type: 'spring', stiffness: 300, damping: 34 });
  };
  useEffect(() => { y.set(-idx * FEED_H); }, [k]);
  return (
    <div className="feed" data-act="feed-swipe"
      onWheel={(e) => { const now = Date.now(); if (now - wheelLock.current < 600 || Math.abs(e.deltaY) < 12) return; wheelLock.current = now; go(idx + (e.deltaY > 0 ? 1 : -1)); }}>
      <motion.div style={{ y }} drag="y" dragConstraints={{ top: -(items.length - 1) * FEED_H, bottom: 0 }} dragElastic={0.15}
        onDragEnd={(_, info) => {
          const dy = info.offset.y, v = info.velocity.y;
          if (dy < -80 || v < -500) go(idx + 1); else if (dy > 80 || v > 500) go(idx - 1); else go(idx);
        }}>
        {items.map((it, i) => <FeedItem key={it.id} item={it} own={own} active={i === idx} />)}
      </motion.div>
      {idx === 0 && own && <div className="swipe-hint">Swipe up for more</div>}
    </div>
  );
}

// 2026 iOS：Home Tab = 仪表盘（Y2um_0058/0122/0205，2026-06；7m2O_0118，2026-11）；
// Inspiration Tab = 全屏视频流（QKE_0038，2026-08：粗体带下划线的是 Inspiration）
const INSP_CHIPS = [{ key: 'topics', label: 'Topics' }, { key: 'posts', label: 'Posts' }, { key: 'creators', label: 'Creators' }]; // 7m2O_0118（2026-11）
const TOPICS = [
  ['Thanksgiving travel hacks', 52.1e6], ['Sleeper trains are back', 38.4e6], ['Carry-on only trips', 27.3e6], ['Winter sun escapes', 24.0e6], ['Kyoto in autumn', 21.9e6],
];
function Spark({ seed }) {
  const pts = Array.from({ length: 8 }, (_, i) => 10 - Math.abs(Math.sin(seed + i * 0.9)) * 8 - i * 0.6);
  return <svg width="26" height="12" viewBox="0 0 26 12"><polyline points={pts.map((y, i) => `${i * 3.6},${Math.max(1, y)}`).join(' ')} fill="none" stroke="#c4c4c8" strokeWidth="1.4" /></svg>;
}

function HomeDashboard() {
  const switchTab = useApp((s) => s.switchTab);
  const push = useApp((s) => s.push);
  const openSheet = useApp((s) => s.openSheet);
  const inbox = useApp((s) => s.inbox);
  const markRead = useApp((s) => s.markRead);
  const [chip, setChip] = useState('topics');
  const [expanded, setExpanded] = useState({});
  const k = overviewKpis({ key: '7' });
  const na = useApp((s) => s.newAccount);
  const market = useApp((s) => s.market);
  const noAssistant = na || market === 'store'; // assistant entries are hidden for new accounts and the US store build
  const tiles = na ? ['Post views', 'Net followers', 'Likes'].map((label) => ({ label, v: '0', d: -0 })) : [
    { label: 'Post views', v: fmtStat(k[0].value), d: k[0].deltaPct },
    { label: 'Net followers', v: fmtStat(DAILY.followersNet.slice(PERIOD_END - 6, PERIOD_END + 1).reduce((a, b) => a + b, 0)), d: 0 },
    // 美国 2026-11-22 录屏（usrec 0:34）第 3 张是 Likes；巴西 2026-11 变现账号是 Est. rewards
    { label: 'Likes', v: fmtStat(k[2].value), d: k[2].deltaPct },
  ];
  const total = DAILY.followersTotal[PERIOD_END];
  const rows = chip === 'topics' ? US_TOPICS.slice(0, 11).map(([t, v], i) => ({ id: `t${i}`, title: t, views: v, item: INSPIRATION[i % INSPIRATION.length], topic: true }))
    : chip === 'posts' ? INSPIRATION.slice(0, 5).map((x) => ({ id: x.id, title: x.caption, views: x.views, item: x }))
      : INSPIRATION.slice(0, 5).map((x) => ({ id: x.id, title: `@${x.creator}`, views: x.creatorStats.followers, item: x, creator: true }));
  return (
    <Scroll id="home-dashboard" className="with-tabbar home-dash" onScroll={(e) => { const v = e.currentTarget.scrollTop > 120; if (v !== useApp.getState().homeScrolled) useApp.setState({ homeScrolled: v }); }}>
      <div className="hd-dark">
        <div className="hd-profile"><Avatar size={64} label="ML" /><div><div className="hd-name">{ACCOUNT.name}</div><div className="hd-sub"><b>{na ? 0 : fmt(total)}</b> followers <span>|</span> <b>{na ? 1 : POSTS.length}</b> {na ? 'post' : 'posts'}</div></div></div>
        <div className="hd-tiles">
          {tiles.map((t) => (
            <button key={t.label} className="hd-tile" data-act="home-kpi" onClick={() => switchTab('analytics')}>
              <span className="hd-tl">{t.label}</span><span className="hd-tv">{t.v}</span>
              <span className={`hd-td ${t.d > 0 ? 'up' : ''}`}>{t.d == null ? '–' : na ? '-0%' : `${t.d > 0 ? '+' : ''}${Math.round(t.d * 100)}%`} <i>|</i> 7 days</span>
            </button>
          ))}
        </div>
        {/* FIN-S1-Page: Ask Creator Assistant takes Start creating's place; creating now starts from a Curated for me card */}
        {noAssistant
          ? <button className="hd-start" data-act="home-start-creating" onClick={() => switchTab('create')}><span className="hd-start-ic"><I.plus size={12} /></span>Start creating</button>
          : <AskPill prompts={HOME_PROMPTS} icon={<CaIcon size={22} />} onAsk={(q) => push('creatorAssistant', { from: 'home', prompt: q, postId: /doing\?$/.test(q) ? latestPost().id : undefined })} />}
      </div>
      <div className="hd-body">
        {/* 新账号也显示 Curated for me，只有 Trending now 一张（Final「Home · new US account」） */}
        <CuratedForMe place="home" only={na ? 'trend' : ''} />
        <div className="hd-card">
          <button className="hd-card-head" data-act="home-inbox-more" onClick={() => switchTab('inbox')}><span>Inbox</span><I.right size={18} /></button>
          <div className="hd-inbox">
            {inbox.filter((n) => n.type === 'account').slice(0, 2).map((n) => (
              <div key={n.id} className="hd-ib">
                <div className="hd-ib-tag">Account updates · {n.homeTime || n.time}</div>
                <div className="hd-ib-title" data-act="home-inbox-open" onClick={() => { markRead(n.id); push(n.detail === 'appeal' ? 'appeal' : 'policy', { id: n.id }); }} {...asButton(() => { markRead(n.id); push(n.detail === 'appeal' ? 'appeal' : 'policy', { id: n.id }); })}>{n.title}</div>
                <div className={`hd-ib-body ${expanded[n.id] ? 'open' : ''}`}><span className="hd-ib-text">{n.body}</span>{!expanded[n.id] && <button data-act="home-inbox-expand" onClick={() => setExpanded({ ...expanded, [n.id]: true })}>Expand</button>}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hd-card">
          <button className="hd-card-head" data-act="home-inspiration-more" onClick={() => push('creatorInspiration')}><span>Inspiration</span><I.right size={18} /></button>
          <Pills items={INSP_CHIPS} value={chip} onChange={setChip} />
          <div className="hd-rank">
            {rows.map((r, i) => (
              <button key={r.id} className={`hd-rank-row ${r.topic ? 'topic' : ''}`} data-act="home-inspiration-row" onClick={() => (r.topic ? push('topicSearch', { q: r.title }) : r.creator ? openSheet('creatorAnalysis', { id: r.item.id }) : openSheet('insights', { id: r.item.id }))}>
                <RankBadge n={i + 1} />
                {r.topic ? <><span className="hd-rtitle grow">{r.title}</span><span className="hd-rv"><Flame /> {fmt(r.views)}</span></> : <>
                  <span className="hd-rt"><span className="hd-rtitle">{r.title}</span><span className="hd-rv"><Flame /> {fmt(r.views)}</span></span>
                  {r.creator ? <Avatar hue={r.item.hue} size={42} label={r.item.creator[0].toUpperCase()} /> : <Cover item={r.item} w={42} h={56} text={false} radius={4} />}</>}
              </button>
            ))}
          </div>
          <button className="hd-more" data-act="home-more-inspiration" onClick={() => push('creatorInspiration')}>Get more inspiration</button>
        </div>
        <div className="hd-card">
          <button className="hd-card-head" data-act="home-monetization" onClick={() => push('monetization')}><span>Monetization</span><I.right size={18} /></button>
          <div className="hd-money">
            {/* 美国 2026-11-22（usrec 0:05）：Service+ / Subscription / TikTok Shop for Sellers / Creator Rewards Program / Creator Marketplace，横向滚动 */}
            {[['Service+', <I.monService size={22} />, 'svc'], ['Subscription', <I.monSubscription size={22} />, 'sub'], ['TikTok Shop for Sellers', <I.monShop size={22} />, 'shop'], ['Creator Rewards Program', <I.monRewards size={22} />, 'crp'], ['Creator Marketplace', <I.monMarket size={22} />, 'cm']].map(([n, ic, k]) => (
              <button key={n} data-act={`home-monetization-${k}`} onClick={() => (k === 'crp' ? push('creatorRewards') : useApp.getState().showAlert({ title: 'Continue to TikTok app?', message: `Open ${n} in TikTok`, actions: [{ label: 'Cancel' }, { label: 'Continue', bold: true }] }))}><span className="hd-mi">{ic}</span><span>{n}</span></button>
            ))}
          </div>
        </div>
      </div>
    </Scroll>
  );
}

// 新账号的 Home（aHcj_0028，2026-10）：TikTok Studio 字标 + 工具 + Upload + 灵感视频预览「Swipe up for ideas」
// 新账号 Home（aHcj_0028，FR 2026-10）与 美国版 Home（appstore_home，US App Store）：
// 「TikTok Studio」字标 + 工具 + Upload + 下方灵感视频；美国版多 Auto captions、右上有搜索
function NewAccountHome({ us }) {
  const openModal = useApp((s) => s.openModal);
  const setHomeTab = useApp((s) => s.setHomeTab);
  const push = useApp((s) => s.push);
  const newAccount = useApp((s) => s.newAccount);
  const tools = [
    ...(us ? [['Auto captions', <I.captions size={24} />, 'captions']] : []),
    ['Photo editor', <I.photoEditor size={24} />, 'photo'], [us ? 'Autocut' : 'AutoCut', <I.autocut size={24} />, 'autocut'], ['Camera', <I.camera size={24} />, 'camera'],
  ];
  return (
    <div className={`screen black na-home ${us ? 'us' : ''}`}>
      <div className="na-head"><div className="na-word">TikTok <span>Studio</span></div>{us && <button aria-label="Search" data-act="open-topic-search" onClick={() => push('topicSearch')}><I.search size={24} /></button>}</div>
      <div className="create-tiles dark">
        {tools.map(([l, ic, m]) => (
          <button key={l} className="ct" data-act={`na-${m}`} onClick={() => (m === 'camera' ? openModal('camera') : openModal('picker', { mode: m }))}><span className="ct-box">{ic}</span><span className="ct-label">{l}</span></button>
        ))}
      </div>
      <button className="upload-btn light" data-act="na-upload" onClick={() => openModal('picker', { mode: 'upload' })}><I.plus size={18} /> Upload</button>
      <button className="na-preview" data-act="na-swipe-ideas" onClick={() => setHomeTab('inspiration')}>
        <VideoStage item={INSPIRATION[2]} />
        {(newAccount || !us) ? <div className="na-hint"><I.insights size={34} /><span>Swipe up for ideas on what to create</span></div> : <div className="na-play"><I.playFill size={40} /></div>}
      </button>
    </div>
  );
}

export function HomeScreen() {
  const legacy = useApp((s) => s.legacyIA);
  const market = useApp((s) => s.market);
  const homeTab = useApp((s) => s.homeTab);
  const setHomeTab = useApp((s) => s.setHomeTab);
  const openModal = useApp((s) => s.openModal);
  const push = useApp((s) => s.push);
  const newAccount = useApp((s) => s.newAccount);
  const us = market === 'store';
  const homeScrolledRaw = useApp((s) => s.homeScrolled);
  const [feedLoading, setFeedLoading] = useState(false);
  const feedSeen = useRef(false);
  useEffect(() => { if (homeTab === 'inspiration' && !feedSeen.current) { feedSeen.current = true; setFeedLoading(true); const t = setTimeout(() => setFeedLoading(false), 650); return () => clearTimeout(t); } }, [homeTab]);
  if (legacy) return <LegacyHome />;
  if (us && homeTab === 'home') return <NewAccountHome us />;
  // 美国 2026-11-22（usrec 0:34）：0 粉丝的新账号看到的仍是仪表盘，数值为 0
  // 美国版全屏视频流：顶部「Trending | Inspiration」（appstore_inspiration_insights）；非美区：「Home | Inspiration」（QKE_0038）
  // 美国 2026-11-22 / 巴西 2026-11：Home | Discover（首页 | 发现）；2026-08 英语区为 Home | Inspiration
  const tabs = us ? [['trending', 'Trending'], ['inspiration', 'Inspiration']] : [['home', 'Home'], ['inspiration', 'Discover']];
  const scrolled = homeScrolledRaw && homeTab === 'home' && !us;
  return (
    <div className="screen black">
      <div style={{ display: homeTab === 'inspiration' ? 'block' : 'none' }}><Feed items={INSPIRATION} k="inspiration" /></div>
      {/* 美国 2026-11-22（usrec 1:33–1:35）：首次进入 Discover 是白底 + 两点 loading */}
      {feedLoading && homeTab === 'inspiration' && <div className="feed-loading"><Spinner /></div>}
      {us && <div style={{ display: homeTab === 'trending' ? 'block' : 'none' }}><Feed items={[...INSPIRATION].reverse()} k="trending" /></div>}
      {!us && <div className="home-dash-wrap" style={{ display: homeTab === 'home' ? 'flex' : 'none' }}><HomeDashboard /></div>}
      <div className={`home-top ${scrolled ? 'light' : ''}`}>
        {homeTab !== 'home' ? <button aria-label="Create" data-act="home-create" onClick={() => openModal('picker', { mode: 'upload' })}><I.plusCircleFill size={28} /></button> : <span style={{ width: 28 }} />}
        <div className="home-tabs">
          {tabs.map(([t, l]) => (
            <button key={t} data-act={`home-tab-${t}`} className={homeTab === t ? 'on' : ''} onClick={() => setHomeTab(t)}>
              {l}{homeTab === t && <motion.i layoutId="ht" className="ht-line" />}
            </button>
          ))}
        </div>
        <button aria-label="Search" data-act="open-topic-search" onClick={() => push('topicSearch')}>{us ? <I.search size={26} /> : <I.searchSpark size={26} />}</button>
      </div>
    </div>
  );
}

// ---------- Insights 弹层（他人作品聚合数据） ----------
const TREND_PILLS = [{ key: 'views', label: 'Post views' }, { key: 'comments', label: 'Comments' }, { key: 'likes', label: 'Likes' }, { key: 'saves', label: 'Favorites' }];
export function InsightsSheet({ id }) {
  const item = INSPIRATION.find((x) => x.id === id);
  const [tab, setTab] = useState('post');
  const [metric, setMetric] = useState('views');
  const ratio = { views: 1, comments: item.comments / item.views, likes: item.likes / item.views, saves: item.saves / item.views }[metric];
  const data = item.trend.map((v, i) => ({ date: new Date(NOW.getTime() - (item.trend.length - i) * DAY_MS), value: Math.round(v * ratio) }));
  return (
    <SheetFrame title="Analytics" full>
      <div className="ins-tabs">
        {['post', 'creator'].map((t) => (
          <button key={t} data-act={`insights-tab-${t}`} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t === 'post' ? 'Post' : 'Creator'}{tab === t && <motion.i layoutId="it" className="tt-line" />}</button>
        ))}
      </div>
      <div className="ins-body">
        {tab === 'post' ? (
          <>
            {/* S7 module D replaces Key metrics and its blue tip */}
            <div style={{ padding: '8px 8px 0' }}><ModuleD insight={buildModuleD(item, { words: item.topWords.map((w) => [w]) })} /></div>
            <Section title="Trends" info="Daily trend since the post was published.">
              <Pills variant="blue" items={TREND_PILLS} value={metric} onChange={setMetric} />
              <TrendChart data={data} hatchLast={false} animKey={metric} />
            </Section>
            <Section title="Top words used in comments" info="Words most frequently used in comments.">
              <div className="word-chips">{item.topWords.map((w, i) => <span key={w} className="word-chip" style={{ fontSize: 17 - i }}>{w}</span>)}</div>
            </Section>
          </>
        ) : (
          <>
            <div className="ins-creator"><Avatar hue={item.hue} size={64} label={item.creator[0].toUpperCase()} /><b>{item.creator}</b></div>
            <Section title="Creator stats" info="Public stats for this creator.">
              <div className="kpi-grid">
                {[['Followers', item.creatorStats.followers], ['Likes', item.creatorStats.totalLikes], ['Posts', item.creatorStats.posts], ['Avg. views', item.creatorStats.avgViews]].map(([l, v], i) => (
                  <KpiCard key={l} k={{ key: l, label: l, text: fmt(v) }} delay={i * 0.05} />
                ))}
              </div>
            </Section>
            {/* V4：fig19（App Store 宣传图）——Insights 的创作者成长时间线 */}
            <Section title="See how this creator grew" info="Milestones in this creator's growth and the posts behind them.">
              <CreatorTimeline item={item} />
            </Section>
          </>
        )}
      </div>
    </SheetFrame>
  );
}

// ---------- 2024–25 版 Home（Analytics 卡 / Monetization 卡 / Recent posts / Creation inspirations） ----------
function LegacyHome() {
  const switchTab = useApp((s) => s.switchTab);
  const openModal = useApp((s) => s.openModal);
  const push = useApp((s) => s.push);
  const k = overviewKpis({ key: '7' });
  const recent = [...POSTS].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 6);
  const [insp, setInsp] = useState('trending');
  return (
    <div className="screen gray">
      <Scroll id="legacy-home" className="with-tabbar">
        <div className="lh-dark">
          <div className="lh-title">TikTok Studio</div>
          <div className="create-tiles dark">
            {[['Photo editor', <I.photoEditor size={24} />, 'photo'], ['AutoCut', <I.autocut size={24} />, 'autocut'], ['Camera', <I.camera size={24} />, 'upload']].map(([l, ic, m]) => (
              <button key={l} className="ct" data-act={`lh-${m}`} onClick={() => openModal('picker', { mode: m })}><span className="ct-box">{ic}</span><span className="ct-label">{l}</span></button>
            ))}
          </div>
          <button className="upload-btn light" data-act="lh-upload" onClick={() => openModal('picker', { mode: 'upload' })}><I.plus size={18} /> Upload</button>
        </div>
        <Section title="Analytics" sub="Last 7 days" right={<button aria-label="Open analytics" className="link-btn" data-act="lh-analytics" onClick={() => switchTab('analytics')}><I.right size={18} /></button>}>
          <div className="kpi-grid">{k.slice(0, 2).map((x) => <KpiCard key={x.key} k={x} onPress={() => switchTab('analytics')} />)}</div>
        </Section>
        <Section title="Monetization" right={<button aria-label="Open monetization" className="link-btn" data-act="lh-monetise" onClick={() => switchTab('monetise')}><I.right size={18} /></button>}>
          <div className="muted-note">Estimated rewards · Last 7 days</div><div className="big-num">{fmtMoney(k[5].value)}</div>
        </Section>
        <Section title="Recent posts">
          <div className="h-scroll">{recent.map((p) => <button key={p.id} className="lh-post" data-act="lh-post" onClick={() => push('videoAnalysis', { postId: p.id })}><Cover item={p} w={96} h={128} /><span><I.play size={12} /> {fmt(p.views)}</span></button>)}</div>
        </Section>
        <Section title="Creation inspirations">
          <Pills variant="blue" value={insp} onChange={setInsp} items={[{ key: 'trending', label: 'Trending' }, { key: 'recommended', label: 'Recommended' }]} />
          {(insp === 'trending' ? INSPIRATION : [...INSPIRATION].reverse()).slice(0, 4).map((x) => (
            <div key={x.id} className="rank-row static"><Cover item={x} w={52} h={68} text={false} /><div className="rr-text"><div className="rr-title">{x.caption}</div><div className="rr-sub"><I.play size={12} /> {fmt(x.views)} · <I.heart size={12} /> {fmt(x.likes)}</div></div></div>
          ))}
        </Section>
      </Scroll>
    </div>
  );
}
