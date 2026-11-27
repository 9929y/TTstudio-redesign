// Manage：Posts / Comments（QKE_0117 iOS 2026；筛选交互 o1g 2:46–3:00、91F 2:21–4:23；状态 zaDQ_0143/0149、pS5_1050）
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store.js';
import { LargeHeader, TopTabs, Chip, Cover, Scroll, Avatar, Spinner, Skel, useFirstLoad, useTabFirstLoad, asButton } from '../ui/kit.jsx';
import { I } from '../ui/Icons.jsx';
import { POSTS, POST_BY_ID } from '../data/seed.js';
import { fmt, fmtStat, listTime, time12 } from '../data/agg.js';

export const SORTS = [
  { key: 'newest', label: 'Post date (newest)', chip: 'Post date (newest)' },
  { key: 'views', label: 'Video views', chip: 'Video views' },
  { key: 'likes', label: 'Likes', chip: 'Likes' },
  { key: 'comments', label: 'Comments', chip: 'Comments' },
  { key: 'oldest', label: 'Post date (oldest)', chip: 'Post date (oldest)' },
];
export const PRIVACY = [
  { key: 'all', label: 'All' }, { key: 'everyone', label: 'Everyone' }, { key: 'friends', label: 'Friends' }, { key: 'only_you', label: 'Only you' },
];
export const REPLIES = [
  { key: 'all', label: 'All comments' }, { key: 'not_replied', label: 'Comments you haven’t replied to', chip: 'Not replied' }, { key: 'replied', label: 'Comments you’ve replied to', chip: 'Replied' },
];
export const POSTED_BY = [
  { key: 'all', label: 'All comments' }, { key: 'followers', label: 'Comments from followers', chip: 'Followers' }, { key: 'non_followers', label: 'Comments from non-followers', chip: 'Non-followers' },
];
export const FOLLOWER_COUNT = [
  { key: 'lt5k', label: 'From creators with fewer than 5K followers', chip: '<5K followers', test: (n) => n < 5000 },
  { key: '5k10k', label: 'From creators with 5K–10K followers', chip: '5K–10K followers', test: (n) => n >= 5000 && n < 10000 },
  { key: '10k100k', label: 'From creators with 10K–100K followers', chip: '10K–100K followers', test: (n) => n >= 10000 && n <= 100000 },
  { key: 'gt100k', label: 'From creators with more than 100K followers', chip: '>100K followers', test: (n) => n > 100000 },
];

// 列表加载：筛选/排序变化后先 loading 再刷新（o1g 3:00）
function useListLoading(token) {
  const [l, setL] = useState(false);
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (first) { setFirst(false); return; }
    setL(true); const t = setTimeout(() => setL(false), 550); return () => clearTimeout(t);
  }, [token]);
  return l;
}

export function usePostList() {
  const m = useApp((s) => s.manage);
  const userPosts = useApp((s) => s.userPosts);
  const edits = useApp((s) => s.postEdits);
  const na = useApp((s) => s.newAccount);
  return useMemo(() => {
    // 新账号（美国 2026-11-22 录屏 1:24）：只有 1 条「Untitled post」，▷2 ♡0 💬0
    let list = na ? [{ ...POSTS[0], id: 'na-post', title: '', views: 2, likes: 0, comments: 0, privacy: 'everyone', publishedAt: new Date(2026, 10, 21, 21, 4), na: true }] : POSTS.filter((p) => !edits[p.id]?.deleted).map((p) => (edits[p.id]?.privacy ? { ...p, privacy: edits[p.id].privacy } : p)).sort((a, b) => b.publishedAt - a.publishedAt);
    if (m.privacy !== 'all') list = list.filter((p) => p.privacy === m.privacy);
    if (m.views) list = list.filter((p) => (m.views.op === 'more' ? p.views > m.views.n : p.views < m.views.n));
    const key = { views: 'views', likes: 'likes', comments: 'comments' }[m.sort];
    if (key) list.sort((a, b) => b[key] - a[key]);
    if (m.sort === 'oldest') list.reverse();
    // 用户新建（上传中 / 定时）的作品置顶（zaDQ_0143）
    const ups = userPosts.filter((p) => (m.privacy === 'all' || p.privacy === m.privacy) && (!m.views || m.views.op === 'less'));
    return [...ups, ...list];
  }, [m, userPosts, edits, na]);
}

// 长按 ≈ 450ms 打开操作面板；长按后不再触发点击
function useLongPress(onLong) {
  const t = useRef(null); const fired = useRef(false);
  const start = () => { fired.current = false; clearTimeout(t.current); t.current = setTimeout(() => { fired.current = true; if (navigator.vibrate) navigator.vibrate(10); onLong(); }, 450); };
  const cancel = () => clearTimeout(t.current);
  return { onPointerDown: start, onPointerUp: cancel, onPointerLeave: cancel, onPointerCancel: cancel, onContextMenu: (e) => { e.preventDefault(); cancel(); fired.current = true; onLong(); }, wasLong: () => fired.current };
}
function PostCard({ p, onOpen }) {
  const edit = useApp((s) => s.postEdits[p.id]);
  const lp = useLongPress(() => !p.user && !p.na && useApp.getState().openSheet('postActions', { postId: p.id }));
  if (edit?.privacy) p = { ...p, privacy: edit.privacy };
  const isUser = !!p.user;
  const us = useApp((s) => s.market === 'store');
  const today = p.scheduledAt && p.scheduledAt.toDateString() === new Date(2026, 10, 22).toDateString();
  return (
    <motion.div layout="position" className="post-card" data-act="post-open" onClick={() => { if (!lp.wasLong()) onOpen(); }} {...asButton(() => { if (!lp.wasLong()) onOpen(); })}
      onPointerDown={lp.onPointerDown} onPointerUp={lp.onPointerUp} onPointerLeave={lp.onPointerLeave} onPointerCancel={lp.onPointerCancel} onContextMenu={lp.onContextMenu}>
      <div className="pc-top">
        <Cover item={p} w={51} h={68} text={false} radius={4} />
        <div className="pc-text">
          <div className="pc-title">{p.title || 'Untitled post'}</div>
          <div className="pc-meta">
            {/* 美国版定时作品：「at 1:00PM today」、没有徽标（appstore_manage）；非美区：Scheduled 徽标 + 时间（zaDQ_0149，Android） */}
            {p.status === 'scheduled' && !us && <span className="badge-sched">Scheduled</span>}
            {p.status === 'scheduled' ? <span>{us ? `at ${time12(p.scheduledAt).replace(' ', '')} ${today ? 'today' : `${p.scheduledAt.getMonth() + 1}/${p.scheduledAt.getDate()}`}` : time12(p.scheduledAt)}</span> : <span>{listTime(p.publishedAt)}</span>}
            {p.privacy === 'only_you' && <span className="priv"><I.lock size={12} /> Only you</span>}
            {p.privacy === 'friends' && <span className="priv"><I.people size={12} /> Friends</span>}
          </div>
        </div>
      </div>
      {isUser && p.progress < 100 ? (
        <div className="pc-progress"><div className="pc-bar"><motion.div className="pc-bar-fill" animate={{ width: `${p.progress}%` }} transition={{ ease: 'linear', duration: 0.25 }} /></div><span>{Math.round(p.progress)}%</span></div>
      ) : (
        <div className="pc-stats">
          <span><I.play size={15} />{fmtStat(p.views)}</span>
          <span><I.heart size={15} />{fmtStat(p.likes)}</span>
          <span><I.comment size={15} />{fmtStat(p.comments)}</span>
        </div>
      )}
    </motion.div>
  );
}

function PostsTab() {
  const m = useApp((s) => s.manage);
  const token = useApp((s) => s.manageToken);
  const openSheet = useApp((s) => s.openSheet);
  const setManage = useApp((s) => s.setManage);
  const push = useApp((s) => s.push);
  const detailEntry = useApp((s) => s.detailEntry);
  const list = usePostList();
  const loading = useListLoading(token);
  const sortActive = m.sort !== 'newest';
  return (
    <>
      <div className="chips">
        <Chip act="chip-sort" label={sortActive ? `Sort by: ${SORTS.find((s) => s.key === m.sort).chip}` : 'Sort by'} active={sortActive} onPress={() => openSheet('sort')} />
        <Chip act="chip-privacy" label={m.privacy !== 'all' ? `Privacy: ${PRIVACY.find((p) => p.key === m.privacy).label}` : 'Privacy'} active={m.privacy !== 'all'} onPress={() => openSheet('privacy')} onClear={() => setManage({ privacy: 'all' })} />
        <Chip act="chip-views" label={m.views ? `Video views: ${m.views.op === 'more' ? '>' : '<'} ${m.views.n}` : 'Video views'} active={!!m.views} onPress={() => openSheet('views')} onClear={() => setManage({ views: null })} />
      </div>
      <Scroll id="manage-posts" className="with-tabbar list-bg">
        {loading ? <div className="list-loading"><Spinner /></div> : list.length === 0 ? (
          <div className="muted-note center" style={{ paddingTop: 80 }}>No posts match these filters</div>
        ) : list.map((p) => (
          <PostCard key={p.id} p={p} onOpen={() => {
            if (p.na || (p.user && p.progress < 100)) return;
            push(detailEntry === 'player' && !p.user ? 'player' : 'videoAnalysis', { postId: p.id });
          }} />
        ))}
        <div style={{ height: 16 }} />
      </Scroll>
    </>
  );
}

// ---------------- Comments ----------------
export function useAllComments() {
  const m = useApp((s) => s.manage);
  const replies = useApp((s) => s.replies);
  const deleted = useApp((s) => s.deletedComments);
  const na = useApp((s) => s.newAccount);
  return useMemo(() => {
    if (na) return []; // 新账号（美国 2026-11-22 录屏 1:27）：No comments yet
    let all = POSTS.flatMap((p) => p.commentList).filter((c) => !deleted[c.id]).sort((a, b) => b.time - a.time);
    const isReplied = (c) => c.replies.length > 0 || (replies[c.id]?.length || 0) > 0;
    if (m.replies === 'not_replied') all = all.filter((c) => !isReplied(c));
    if (m.replies === 'replied') all = all.filter(isReplied);
    if (m.postedBy === 'followers') all = all.filter((c) => c.user.isFollower);
    if (m.postedBy === 'non_followers') all = all.filter((c) => !c.user.isFollower);
    if (m.followerCount.length) all = all.filter((c) => FOLLOWER_COUNT.some((f) => m.followerCount.includes(f.key) && f.test(c.user.followerCount)));
    return all.slice(0, 60);
  }, [m, replies, deleted, na]);
}

export function CommentRow({ c, onOpen, compact }) {
  const replies = useApp((s) => s.replies[c.id]) || [];
  const liked = useApp((s) => s.commentLikes[c.id]) ?? c.likedByCreator;
  const disliked = useApp((s) => s.commentDislikes[c.id]);
  const toggleLike = useApp((s) => s.toggleCommentLike);
  const toggleDislike = useApp((s) => s.toggleCommentDislike);
  const openSheet = useApp((s) => s.openSheet);
  const [open, setOpen] = useState(false);
  const lp = useLongPress(() => openSheet('commentActions', { commentId: c.id, handle: c.user.handle }));
  const post = POST_BY_ID[c.postId];
  const allReplies = [...c.replies, ...replies.map((r, i) => ({ id: `${c.id}-u${i}`, byCreator: true, text: r.text, time: r.time }))];
  const total = allReplies.length + c.otherReplies;
  return (
    <div className="comment-row">
      <div className="cr-main" data-act="comment-open" onClick={() => { if (!lp.wasLong()) onOpen?.(); }} {...asButton(() => { if (!lp.wasLong()) onOpen?.(); })}
        onPointerDown={lp.onPointerDown} onPointerUp={lp.onPointerUp} onPointerLeave={lp.onPointerLeave} onPointerCancel={lp.onPointerCancel} onContextMenu={lp.onContextMenu}>
        <Avatar hue={c.user.hue} size={26} label={c.user.handle[0].toUpperCase()} />
        <div className="cr-text">
          <div className="cr-handle">{c.user.handle} · {time12(c.time).replace(' ', ' ')}</div>
          <div className="cr-body">{c.text}</div>
        </div>
        {!compact && <Cover item={post} w={34} h={46} text={false} radius={3} />}
      </div>
      <div className="cr-actions">
        <button className="cr-reply" data-act="comment-reply" onClick={() => openSheet('reply', { commentId: c.id, handle: c.user.handle })}>Reply to comments</button>
        <span className="cr-right">
          <button data-act="comment-like" className={liked ? 'liked' : ''} onClick={() => toggleLike(c.id, c.likedByCreator)}><I.heart size={16} filled={liked} />{c.likes + (liked && !c.likedByCreator ? 1 : 0)}</button>
          <button aria-label="Dislike" data-act="comment-dislike" className={disliked ? 'on' : ''} onClick={() => toggleDislike(c.id)}><I.thumbDown size={16} /></button>
        </span>
      </div>
      {total > 0 && (
        <>
          <AnimatePresence>
            {open && (
              <motion.div className="cr-replies" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                {allReplies.map((r) => (
                  <div key={r.id} className="cr-reply-item"><Avatar size={20} label="ML" /><div><div className="cr-handle">Mira Lane · <span className="creator-tag">Creator</span></div><div className="cr-body">{r.text}</div></div></div>
                ))}
                {c.otherReplies > 0 && <div className="muted-note small">+ {c.otherReplies} more from others</div>}
              </motion.div>
            )}
          </AnimatePresence>
          <button className="cr-view" data-act="comment-view-replies" onClick={() => setOpen(!open)}>{open ? 'Hide' : `View ${total} replies`}<I.down size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} /></button>
        </>
      )}
    </div>
  );
}

function CommentsTab() {
  const m = useApp((s) => s.manage);
  const token = useApp((s) => s.manageToken);
  const openSheet = useApp((s) => s.openSheet);
  const push = useApp((s) => s.push);
  const list = useAllComments();
  const loading = useListLoading(token);
  const fc = m.followerCount;
  const fcLabel = fc.length === 0 ? 'Follower count' : fc.length === 1 ? FOLLOWER_COUNT.find((f) => f.key === fc[0]).chip : `Follower count (${fc.length})`;
  return (
    <>
      <div className="chips">
        <Chip act="chip-replies" label={m.replies === 'all' ? 'Replies' : REPLIES.find((r) => r.key === m.replies).chip} active={m.replies !== 'all'} onPress={() => openSheet('replies')} />
        <Chip act="chip-postedby" label={m.postedBy === 'all' ? 'Posted by' : POSTED_BY.find((r) => r.key === m.postedBy).chip} active={m.postedBy !== 'all'} onPress={() => openSheet('postedBy')} />
        <Chip act="chip-followercount" label={fcLabel} active={fc.length > 0} onPress={() => openSheet('followerCount')} />
      </div>
      <Scroll id="manage-comments" className="with-tabbar list-bg">
        {loading ? <div className="list-loading"><Spinner /></div> : list.length === 0 ? (
          (useApp.getState().newAccount && m.replies === 'all' && m.postedBy === 'all' && !fc.length) ? <div className="list-empty-na">No comments yet</div> : <div className="muted-note center" style={{ paddingTop: 80 }}>No comments match these filters</div>
        ) : list.map((c) => <CommentRow key={c.id} c={c} onOpen={() => push('videoComments', { postId: c.postId, focus: c.id })} />)}
        <div style={{ height: 16 }} />
      </Scroll>
    </>
  );
}

export function ManageScreen() {
  const tab = useApp((s) => s.manage.tab);
  const market = useApp((s) => s.market); // 美国版 Tab 名为单数 Post / Comment（appstore_manage）
  const firstLoad = useTabFirstLoad('manage', 700); // 美国 2026-11-22（usrec 1:22）：首次进入胶囊置灰 + 两点 loading，1:24 出列表
  return (
    <div className="screen gray manage-screen">
      <div className="fixed-head">
        <LargeHeader title="Manage" />
        <TopTabs id="mtabs" tabs={market === 'store' ? [{ key: 'posts', label: 'Post' }, { key: 'comments', label: 'Comment' }] : [{ key: 'posts', label: 'Posts' }, { key: 'comments', label: 'Comments' }]} value={tab} onChange={(t) => useApp.setState((s) => ({ manage: { ...s.manage, tab: t } }))} />
      </div>
      {firstLoad && <div className="manage-loading"><div className="ml-chips">{['Sort by', 'Privacy', 'Video views'].map((l) => <span key={l}>{l}<I.down size={13} /></span>)}</div><div className="spin-center"><Spinner /></div></div>}
      <div className="manage-body" style={firstLoad ? { visibility: 'hidden' } : undefined}>
        <div className="mtab" style={{ display: tab === 'posts' ? 'flex' : 'none' }}><PostsTab /></div>
        <div className="mtab" style={{ display: tab === 'comments' ? 'flex' : 'none' }}><CommentsTab /></div>
      </div>
    </div>
  );
}
