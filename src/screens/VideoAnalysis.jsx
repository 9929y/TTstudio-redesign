// 单条作品：Video analysis（18Y_0016/0021/0028/0030、HMWY_0025、k_8w_0028、pS5_1055、v1pC_0034/0037）
// 2024 iOS 备选入口：全屏播放器 + More data（rpfqP_0303）
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store.js';
import { NavBar, TopTabs, Section, Cover, Skel, useFirstLoad, BarRows, Donut, Scroll, Avatar, asButton, Delta } from '../ui/kit.jsx';
import { Scene } from '../ui/kit.jsx';
import { coverUrl } from '../ui/illo.jsx';
import { RetentionChart } from '../ui/charts.jsx';
import { I } from '../ui/Icons.jsx';
import { POST_BY_ID, ACCOUNT } from '../data/seed.js';
import { fmt, fmtFull, fmtStat, monDayYear, time12, postViewerStats, secToClock } from '../data/agg.js';
import { CommentTopicsCard } from '../insight/CommentTopicsCard.jsx';
import { CommentRow } from './Manage.jsx';
import { ModuleE } from '../insight/ModuleE.jsx';
import { buildModuleE, askE, sincePostedWindow } from '../insight/build.js';

const TRAFFIC_INFO = 'It shows the places where your viewers discover your post. The main source types on TikTok are the For You feed, the Following feed, sound pages, profile pages, search pages, and direct messages. The other types are grouped together as "Other".';
const ORDER = ['For You', 'Following', 'Direct messages', 'Personal profile', 'Sound', 'Search', 'Other']; // 18Y_0030 顺序

export function resolvePost(id) {
  const u = useApp.getState().userPosts.find((p) => p.id === id);
  return u || POST_BY_ID[id];
}

// 头部计数（n_a731E9Wt8 1:54：22K / 1,672 / 45）：万以下完整数字，万以上取整 K
const fmtCount = (v) => (v < 1e4 ? Math.round(v).toLocaleString('en-US') : v < 1e6 ? `${Math.floor(v / 1e3)}K` : fmt(v));
function Header({ p }) {
  const d = p.publishedAt;
  return (
    <div className="va-head">
      <Cover item={p} w={64} h={84} showDur={`${p.duration}s`} radius={4} />
      <div className="va-posted">Posted on {monDayYear(d)}, {time12(d)}</div>
      <div className="va-counts">
        <div><I.playFill size={18} /><span>{fmtCount(p.views)}</span></div>
        <div><I.heart size={18} filled /><span>{fmtCount(p.likes)}</span></div>
        <div><I.commentFill size={18} /><span>{fmtCount(p.comments)}</span></div>
        <div><I.shareFill size={18} /><span>{fmtCount(p.shares)}</span></div>
        <div><I.bookmark size={18} filled /><span>{fmtCount(p.saves)}</span></div>
      </div>
    </div>
  );
}

function OverviewTab({ p }) {
  const [sec, setSec] = useState(Math.min(2, p.duration));
  const push = useApp((s) => s.push);
  const newAccount = useApp((s) => s.newAccount);
  const market = useApp((s) => s.market);
  // 模块 E 按这条作品自己的数据算（之前对所有作品都显示 Kyoto at dusk 的写死数字）
  const insightE = useMemo(() => { const E = buildModuleE(p); return E && { ...E, ask: askE(p, E) }; }, [p]);
  const minIdx = p.retention.findIndex((v, i) => i > 0 && p.retention[i - 1] - v === Math.max(...p.retention.slice(1).map((x, j) => p.retention[j] - x)));
  return (
    <>
      {/* 模块 E（design_final/post_topic · IMS6-Key-Blue）：取代 Key metrics 与 Creator Assistant 卡 */}
      {insightE && <div style={{ padding: '8px 8px 0px' }}>
        <ModuleE post={p} insight={insightE} ca={newAccount || market === 'store' ? 'none' : 'row'} onAsk={(q) => push('creatorAssistant', { postId: p.id, from: 'post', prompt: q })} />
      </div>}
      <Section title="Retention rate" info="The percentage of viewers who are still watching at each moment of your video.">
        <div className="ret-head">On average, viewers watched {Math.round(p.avgPct * 100)}% of your video.</div>
        <div className="muted-note small">Most viewers stopped watching at {secToClock(Math.max(1, minIdx)).replace(/^0/, '')}. Check out the moment in your video where most viewers lost interest.</div>
        <div className="ret-preview">
          <Cover item={p} w={92} h={150} t={sec / p.duration} big radius={2} />
          {sec === 0 && <span className="ret-play"><I.playFill size={22} /></span>}
        </div>
        <RetentionChart curve={p.retention} value={sec} onChange={setSec} />
      </Section>
      <Section title="Traffic sources" info={TRAFFIC_INFO}>
        {/* V4：按占比降序（主 App 2025 截图 inapp_video_analysis_traffic：Other 53.7% 排在 For You 前；独立 App 18Y_0030 只有 For You 有值，无法区分固定顺序与排序） */}
        <BarRows rows={ORDER.map((k) => [k, p.traffic?.[k] ?? 0]).sort((a, b) => b[1] - a[1])} />
      </Section>
      <Section title="Search queries" info="Search terms that led viewers to your post.">
        {p.searchQueries?.length ? <BarRows rows={p.searchQueries} /> : <div className="muted-note">You’ll be able to see this information once there’s enough data.</div>}
      </Section>
    </>
  );
}

function DualBar({ left, right, lv }) {
  return (
    <div className="dual">
      <div className="dual-top"><span>{Math.round(lv * 100)}%</span><span>{Math.round((1 - lv) * 100)}%</span></div>
      <div className="dual-track"><motion.div className="dual-fill" initial={{ width: 0 }} animate={{ width: `${lv * 100}%` }} transition={{ duration: 0.5 }} /></div>
      <div className="dual-bot"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

function ViewersTab({ p }) {
  const v = postViewerStats(p);
  return (
    <>
      <Section title="Total viewers" info="The number of unique users who viewed your post.">
        <div className="big-num">{fmtStat(v.total)}</div>
        {(() => { const d = Math.max(1, Math.round(v.total * 0.016)); return <Delta d={d} pctv={d / Math.max(1, v.total - d)} suffix="vs 1 day ago" />; })()}
      </Section>
      <Section title="Viewer types" info="New viewers haven’t watched your posts in the past year. Returning viewers have.">
        <DualBar left="New viewers" right="Returning viewers" lv={v.newPct} />
        <DualBar left="Non-followers" right="Followers" lv={1 - v.followerPct} />
      </Section>
      <Section title="Gender" info="Gender of viewers of this post.">
        <Donut rows={Object.entries(p.gender || { Female: 0.6, Male: 0.38, Other: 0.02 })} />
      </Section>
      {/* 国家分布：VfdFSKOw33g 标题提到，未逐帧核对 → 模拟 */}
      <Section title="Locations" info="Top locations of viewers of this post.">
        <BarRows rows={[['United States', 0.6], ['United Kingdom', 0.09], ['Canada', 0.07], ['Australia', 0.04], ['Other', 0.2]]} chevronFor={(l) => l === 'United States'} onRow={(l) => useApp.getState().push('locations', { title: l, tabKey: 'viewers' })} />
      </Section>
    </>
  );
}

function EngagementTab({ p }) {
  const push = useApp((s) => s.push);
  const words = useMemo(() => (p.topWords || []).map((w, i) => [w, Math.max(1, Math.round((p.comments || 4) * (0.12 - i * 0.02)))]), [p]);
  const maxW = Math.max(1, ...words.map((x) => x[1]));
  // 点赞时刻曲线：开头最高，按留存衰减（n_a731E9Wt8 3:02「Most viewers liked this video at 0:00」）
  const likeCurve = useMemo(() => p.retention.map((v, s) => Math.max(0.02, Math.min(1, v * (s === 0 ? 1 : 0.55 + 0.25 * Math.cos(s / 2))))), [p]);
  const peak = likeCurve.indexOf(Math.max(...likeCurve));
  const [sec, setSec] = useState(0);
  return (
    <>
      <Section title="Top words used in comments" info="Words most frequently used in comments on this post.">
        {words.length ? (
          <div className="bar-rows">
            {words.map(([w, c]) => (
              <div key={w} className="bar-row tap" data-act="va-word" onClick={() => push('relatedComments', { id: p.id, word: w, words })} {...asButton(() => push('relatedComments', { id: p.id, word: w, words }))}>
                <div className="bar-top"><span>{w}</span><span className="bar-v">{c}<I.right size={14} /></span></div>
                <div className="bar-track"><motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${(c / maxW) * 100}%` }} transition={{ duration: 0.5 }} /></div>
              </div>
            ))}
          </div>
        ) : <div className="muted-note">Top word insights are not ready yet. Please check back later.</div>}
      </Section>
      {/* Final（IMC-Comment-Topics）：白色 AI 卡，左右 8px 留边 */}
      <CommentTopicsCard seed={p.id.length + (p.comments || 0)} comments={p.comments || 0} period={sincePostedWindow(p)} onOpen={(k, t) => push('relatedComments', { id: p.id, word: k, words: [[k, 4]], topic: t })} />
      <Section title="Likes" info="When viewers liked your post.">
        <div className="muted-note small">Most viewers liked this video at {secToClock(peak).replace(/^0/, '')}. Check out the moment where most viewers liked your video.</div>
        <div className="ret-preview">
          <Cover item={p} w={92} h={150} t={sec / p.duration} big radius={2} />
          {sec === 0 && <span className="ret-play"><I.playFill size={22} /></span>}
        </div>
        <RetentionChart curve={likeCurve} value={sec} onChange={setSec} />
      </Section>
    </>
  );
}

export function VideoAnalysisScreen({ params }) {
  const p = resolvePost(params.postId);
  const [tab, setTab] = useState(params.tab || 'overview');
  const loading = useFirstLoad(600);
  return (
    <div className="screen gray">
      <NavBar title="Video analysis" right={!p.user ? <button data-act="va-more" aria-label="More" onClick={() => useApp.getState().openSheet('postActions', { postId: p.id })}><I.more size={22} /></button> : null} />
      <Scroll className="va-scroll">
        {loading ? (
          <div className="va-skel">
            <Skel w={64} h={84} style={{ margin: '0 auto' }} /><Skel w={180} h={12} style={{ margin: '10px auto' }} />
            <div className="va-counts">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} w={28} h={28} r={14} />)}</div>
            <Skel h={36} style={{ marginTop: 12 }} /><Skel h={220} style={{ marginTop: 12 }} r={10} />
          </div>
        ) : (
          <>
            <Header p={p} />
            <div className="sticky-tabs">
              <TopTabs id="vatabs" tabs={[{ key: 'overview', label: 'Overview' }, { key: 'viewers', label: 'Viewers' }, { key: 'engagement', label: 'Engagement' }]} value={tab} onChange={setTab} />
            </div>
            {tab === 'overview' && <OverviewTab p={p} />}
            {tab === 'viewers' && <ViewersTab p={p} />}
            {tab === 'engagement' && <EngagementTab p={p} />}
            <div style={{ height: 30 }} />
          </>
        )}
      </Scroll>
    </div>
  );
}

// ---------- 全屏播放器（2024 iOS：rpfqP_0303「▶270 ↗0 + More data」） ----------
export function VideoStage({ item, children, paused }) {
  return (
    <div className="stage">
      <div className={`stage-video ${paused ? '' : 'anim'}`} style={{ '--h': item.hue }}>
        <span className="stage-scene">{coverUrl(item) ? <img className="cover-img" src={coverUrl(item)} alt="" /> : <Scene hue={item.hue} still aspect={2.17} kind={item.scene} />}</span>
        {item.coverText && <span className="stage-text">{item.coverText}</span>}
      </div>
      {children}
    </div>
  );
}

export function PlayerScreen({ params }) {
  const p = resolvePost(params.postId);
  const push = useApp((s) => s.push);
  const pop = useApp((s) => s.pop);
  const openSheet = useApp((s) => s.openSheet);
  return (
    <div className="screen black">
      <VideoStage item={p}>
        <button aria-label="Back" className="stage-back" data-act="nav-back" onClick={pop}><I.back size={26} /></button>
        <div className="rail">
          <Avatar size={44} label="ML" ring />
          <button data-act="player-like"><I.heart size={32} filled /><span>{fmtCount(p.likes)}</span></button>
          <button data-act="player-comments" onClick={() => push('videoComments', { postId: p.id })}><I.commentFill size={32} /><span>{fmtCount(p.comments)}</span></button>
          <button data-act="player-save"><I.bookmark size={30} filled /><span>{fmtCount(p.saves)}</span></button>
          <button aria-label="More options" data-act="player-more" onClick={() => openSheet('postActions', { postId: p.id })}><I.more size={28} /></button>
        </div>
        <div className="stage-caption"><b>{ACCOUNT.name}</b> · 1d ago<div>{p.title}</div></div>
        <div className="player-bar">
          <span><I.play size={16} /> {fmt(p.views)}</span><span><I.share size={16} /> {fmt(p.shares)}</span>
          <button data-act="player-more-data" onClick={() => push('videoAnalysis', { postId: p.id })}>More data</button>
        </div>
      </VideoStage>
    </div>
  );
}

// ---------- 视频 + 评论面板（91F_0411：点评论进入视频并展开评论；侧滑返回后筛选仍在） ----------
const EMOJIS = ['😁', '🥰', '😂', '😳', '😏', '😅', '🥺'];
export function VideoCommentsScreen({ params }) {
  const p = resolvePost(params.postId);
  const addReply = useApp((s) => s.addReply);
  const showToast = useApp((s) => s.showToast);
  const pop = useApp((s) => s.pop);
  const [text, setText] = useState('');
  const [target, setTarget] = useState(params.focus || null);
  const list = p.commentList || [];
  const targetC = list.find((c) => c.id === target);
  const send = () => {
    if (!text.trim()) return;
    if (targetC) addReply(targetC.id, text.trim());
    showToast(targetC ? 'Reply posted' : 'Comment posted');
    setText('');
  };
  return (
    <div className="screen black">
      <div className="vc-video">
        <VideoStage item={p} />
        <button aria-label="Back" className="stage-back" data-act="nav-back" onClick={pop}><I.back size={26} /></button>
      </div>
      <motion.div className="vc-panel" initial={{ y: 40, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="vc-head">
          <span className="vc-tab on"><I.comment size={18} /> {fmt(p.comments)}</span>
          <span className="vc-tab"><I.heart size={18} /> {fmt(p.likes)}</span>
          <button aria-label="Close" className="vc-x" data-act="nav-back" onClick={pop}><I.close size={20} /></button>
        </div>
        <Scroll className="vc-list">
          {list.map((c) => (
            <div key={c.id} className={c.id === target ? 'vc-focus' : ''} onClick={() => setTarget(c.id)}>
              <CommentRow c={c} compact onOpen={() => setTarget(c.id)} />
            </div>
          ))}
        </Scroll>
        <div className="vc-emojis">{EMOJIS.map((e) => <button key={e} data-act="emoji" onClick={() => setText((t) => t + e)}>{e}</button>)}</div>
        <div className="vc-input">
          <Avatar size={30} label="ML" />
          <div className="vc-field">
            <input data-act="comment-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={targetC ? `Reply to ${targetC.user.handle}…` : 'Add comment…'} />
            {text ? <button className="vc-send" data-act="comment-send" onClick={send}>Post</button> : <><I.at size={20} /><I.emoji size={20} /></>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
