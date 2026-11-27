// 所有底部弹层。单选型选完自动关闭；输入型需点 Done/Apply（没输入时置灰）——实录 #16 #24 #25
import { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollList, ScrollItem, Checkbox } from '@douyinfe/semi-ui';
import { useApp } from '../store.js';
import { SheetFrame } from '../shell/Overlays.jsx';
import { I } from '../ui/Icons.jsx';
import { Avatar } from '../ui/kit.jsx';
import { SORTS, PRIVACY, REPLIES, POSTED_BY, FOLLOWER_COUNT } from './Manage.jsx';
import { InsightsSheet } from './Home.jsx';
import { NOW, PERIOD_END, dayDate, DAY_MS, ACCOUNT } from '../data/seed.js';
import { monDay } from '../data/agg.js';

function Radio({ on }) { return <span className={`radio ${on ? 'on' : ''}`}><i /></span>; }

// 单选列表：选中 → 150ms 后自动关闭（91F 2:28：选中后弹层自动收起）
function SingleSelect({ title, options, value, onPick }) {
  const close = useApp((s) => s.closeSheet);
  const [v, setV] = useState(value);
  return (
    <SheetFrame title={title}>
      {options.map((o) => (
        <button key={o.key} className="opt-row" data-act={`opt-${o.key}`} onClick={() => { setV(o.key); setTimeout(() => { close(); if (o.key !== value) onPick(o.key); }, 160); }}>
          <span>{o.label}</span><Radio on={v === o.key} />
        </button>
      ))}
    </SheetFrame>
  );
}

function SortSheet() {
  const m = useApp((s) => s.manage); const setManage = useApp((s) => s.setManage);
  return <SingleSelect title="Sort by" options={SORTS} value={m.sort} onPick={(k) => setManage({ sort: k })} />;
}
function PrivacySheet() {
  const m = useApp((s) => s.manage); const setManage = useApp((s) => s.setManage);
  return <SingleSelect title="Privacy" options={PRIVACY} value={m.privacy} onPick={(k) => setManage({ privacy: k })} />;
}
function RepliesSheet() {
  const m = useApp((s) => s.manage); const setManage = useApp((s) => s.setManage);
  return <SingleSelect title="Filter comments" options={REPLIES} value={m.replies} onPick={(k) => setManage({ replies: k })} />;
}
function PostedBySheet() {
  const m = useApp((s) => s.manage); const setManage = useApp((s) => s.setManage);
  return <SingleSelect title="Filter comments" options={POSTED_BY} value={m.postedBy} onPick={(k) => setManage({ postedBy: k })} />;
}

// Follower count：多选 + Apply（91F_0349）——复用 Semi Checkbox 逻辑，视觉改为右侧方框
function FollowerCountSheet() {
  const m = useApp((s) => s.manage); const setManage = useApp((s) => s.setManage); const close = useApp((s) => s.closeSheet);
  const [sel, setSel] = useState(m.followerCount);
  const all = sel.length === 0;
  const toggle = (k) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  return (
    <SheetFrame title="Filter comments" footer={<button className="btn-primary block" data-act="followercount-apply" onClick={() => { close(); setManage({ followerCount: sel }); }}>Apply</button>}>
      <button className="opt-row" data-act="fc-all" onClick={() => setSel([])}><span>All comments</span><Checkbox checked={all} onChange={() => setSel([])} /></button>
      {FOLLOWER_COUNT.map((f) => (
        <button key={f.key} className="opt-row" data-act={`fc-${f.key}`} onClick={() => toggle(f.key)}><span>{f.label}</span><Checkbox checked={sel.includes(f.key)} onChange={() => toggle(f.key)} /></button>
      ))}
    </SheetFrame>
  );
}

// Filter by video views（o1g_0248）：单选 more/less + 数字；未输入时 Done 置灰
function ViewsSheet() {
  const m = useApp((s) => s.manage); const setManage = useApp((s) => s.setManage); const close = useApp((s) => s.closeSheet);
  const [op, setOp] = useState(m.views?.op || 'more');
  const [n, setN] = useState(m.views ? String(m.views.n) : '');
  const ok = n.length > 0;
  return (
    <SheetFrame title="Filter by video views" footer={<button className="btn-primary block" disabled={!ok} data-act="views-done" onClick={() => { close(); setManage({ views: { op, n: Number(n) } }); }}>Done</button>}>
      <button className="opt-row" data-act="views-more" onClick={() => setOp('more')}><span>Videos with more than</span><Radio on={op === 'more'} /></button>
      <button className="opt-row" data-act="views-less" onClick={() => setOp('less')}><span>Videos with less than</span><Radio on={op === 'less'} /></button>
      <div className="field-label">Number of views</div>
      <input className="num-input" data-act="views-input" inputMode="numeric" autoFocus placeholder="Enter a number" value={n}
        onChange={(e) => setN(e.target.value.replace(/\D/g, '').slice(0, 12))} onKeyDown={(e) => e.key === 'Enter' && ok && (close(), setManage({ views: { op, n: Number(n) } }))} />
      <div className="field-count">{n.length}/12</div>
    </SheetFrame>
  );
}

function InfoSheet({ title, text }) {
  return <SheetFrame title={title}><div className="info-text">{text}</div></SheetFrame>;
}

// Custom 日期（原型假设：录屏里没人点过 Custom，Q1）
// Custom（TikTok Studio App 美国 2026-04，TikTok @tremaynemitchellofficial 7625422365127691534）：
// 标题 Custom + ×；顶部固定星期行 Sun–Sat；月份连续往上排（月份标题居中「April 2026」）；选中日期红色实心圆；
// 今天灰字 + 描边圈（不可选，可选到昨天）；之后的日期置灰；底部整宽红色 Update。可只选一天（Apr 4 - Apr 4）。
function CustomRangeSheet() {
  const setRange = useApp((s) => s.setRange); const close = useApp((s) => s.closeSheet); const range = useApp((s) => s.range);
  const [a, setA] = useState(range.key === 'custom' ? range.s : null);
  const [b, setB] = useState(range.key === 'custom' ? range.e : null);
  const scRef = useRef(null);
  const LAST = PERIOD_END - 1; // 数据到昨天
  const months = useMemo(() => {
    const end = dayDate(PERIOD_END);
    const res = [];
    for (let k = 3; k >= 0; k--) {
      const first = new Date(end.getFullYear(), end.getMonth() - k, 1);
      const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < first.getDay(); i++) cells.push(null);
      for (let d = 1; d <= days; d++) {
        const dt = new Date(first.getFullYear(), first.getMonth(), d);
        const idx = PERIOD_END - Math.round((end - dt) / DAY_MS);
        cells.push({ d, idx, today: idx === PERIOD_END, disabled: idx > LAST });
      }
      res.push({ label: first.toLocaleString('en-US', { month: 'long', year: 'numeric' }), cells });
    }
    return res;
  }, []);
  useEffect(() => { const el = scRef.current; if (el) el.scrollTop = el.scrollHeight; }, []);
  const tap = (idx) => {
    if (a == null || b == null || a !== b) { setA(idx); setB(idx); return; } // 先选一天
    if (idx < a) { setA(idx); return; }
    setB(Math.min(idx, a + 59));
  };
  return (
    <SheetFrame title="Custom" height="78%" footer={<button className="btn-primary block cr-update" disabled={a == null} data-act="custom-apply" onClick={() => { close(); setRange({ key: 'custom', s: a, e: b ?? a }); }}>Update</button>}>
      <div className="cal-dows">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cal-scroll" ref={scRef}>
        {months.map((m, mi) => (
          <div key={m.label} className="cal">
            {mi > 0 && <div className="cal-title">{m.label}</div>}
            <div className="cal-grid">
              {m.cells.map((c, i) => c ? (
                <button key={i} disabled={c.disabled} data-act="custom-day" onClick={() => tap(c.idx)}
                  className={`cal-d ${c.idx === a || c.idx === b ? 'end' : ''} ${a != null && b != null && c.idx > a && c.idx < b ? 'mid' : ''} ${c.today ? 'today' : ''}`}>{c.d}</button>
              ) : <span key={i} />)}
            </div>
          </div>
        ))}
      </div>
    </SheetFrame>
  );
}

// Schedule post（zaDQ_0105：日期 / 时 / 分三列滚轮 + 服务器存储说明）——复用 Semi ScrollList wheel 模式
function ScheduleSheet({ value, onDone }) {
  const close = useApp((s) => s.closeSheet); const showToast = useApp((s) => s.showToast);
  const base = value || new Date(NOW.getTime() + 60 * 60000);
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + i); return { value: i, text: i === 0 ? 'Today' : `${monDay(d).split(' ')[0]} ${String(d.getDate()).padStart(2, '0')} (${WD[d.getDay()]})`, d }; });
  const hours = Array.from({ length: 24 }, (_, i) => ({ value: i, text: String(i) }));
  const mins = Array.from({ length: 60 }, (_, i) => ({ value: i, text: String(i).padStart(2, '0') }));
  const d0 = Math.max(0, Math.round((new Date(base.getFullYear(), base.getMonth(), base.getDate()) - new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate())) / DAY_MS));
  const [di, setDi] = useState(d0); const [h, setH] = useState(base.getHours()); const [mi, setMi] = useState(base.getMinutes());
  const done = () => {
    const d = days[di].d; const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mi);
    if (at - NOW < 15 * 60000) { showToast('Choose a time at least 15 minutes from now'); return; }
    close(); onDone(at);
  };
  return (
    <SheetFrame title={useApp.getState().market === 'store' ? 'Schedule post' : 'Post time'} footer={<button className="btn-primary block" data-act="schedule-done" onClick={done}>Done</button>}>
      <div className="wheel" data-act="schedule-wheel">
        <ScrollList>
          <ScrollItem mode="wheel" cycled={false} list={days} selectedIndex={di} onSelect={(x) => setDi(x.value)} aria-label="date" />
          <ScrollItem mode="wheel" cycled list={hours} selectedIndex={h} onSelect={(x) => setH(x.value)} aria-label="hour" />
          <ScrollItem mode="wheel" cycled list={mins} selectedIndex={mi} onSelect={(x) => setMi(x.value)} aria-label="minute" />
        </ScrollList>
      </div>
      <div className="info-text center small">By continuing, you allow your post to be uploaded and stored on our servers until the scheduled post time.</div>
    </SheetFrame>
  );
}

function ReplySheet({ commentId, handle }) {
  const addReply = useApp((s) => s.addReply); const close = useApp((s) => s.closeSheet); const showToast = useApp((s) => s.showToast);
  const [t, setT] = useState('');
  const send = () => { if (!t.trim()) return; addReply(commentId, t.trim()); close(); showToast('Reply posted'); };
  return (
    <SheetFrame title={`Reply to ${handle}`}>
      <div className="reply-box">
        <input autoFocus data-act="reply-input" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={`Reply to ${handle}…`} />
        <button className="btn-primary" disabled={!t.trim()} data-act="reply-send" onClick={send}>Send</button>
      </div>
    </SheetFrame>
  );
}

function PostPrivacySheet({ value, onPick }) {
  return <SingleSelect title="Who can view this post" options={[{ key: 'everyone', label: 'Everyone' }, { key: 'friends', label: 'Friends' }, { key: 'only_you', label: 'Only you' }]} value={value} onPick={onPick} />;
}

function ToggleList({ title, rows, note }) {
  const [on, setOn] = useState(rows.map((r) => r[1]));
  return (
    <SheetFrame title={title}>
      {rows.map((r, i) => (
        <div key={r[0]} className="opt-row"><span>{r[0]}{r[2] && <small>{r[2]}</small>}</span>
          <button data-act="toggle" className={`ios-switch ${on[i] ? 'on' : ''}`} onClick={() => setOn(on.map((x, j) => (j === i ? !x : x)))}><i /></button></div>
      ))}
      {note && <div className="info-text small">{note}</div>}
    </SheetFrame>
  );
}
// V4：结构取自主 App「Disclosure and ads setting」（inapp_disclosure_ads_setting，2026-10-16 教程）；独立 App 只录到入口
function DisclosureSheet() {
  const close = useApp((s) => s.closeSheet); const showToast = useApp((s) => s.showToast);
  const [on, setOn] = useState({ disclose: false, brand: false, branded: false, ad: false, adsOnly: false });
  const T = (k) => <button data-act={`disclosure-${k}`} className={`ios-switch ${on[k] ? 'on' : ''}`} onClick={() => setOn({ ...on, [k]: !on[k] })}><i /></button>;
  const C = (k) => <button data-act={`disclosure-${k}`} className={`dc-check ${on[k] ? 'on' : ''}`} onClick={() => setOn({ ...on, [k]: !on[k] })}>{on[k] && <I.check size={14} />}</button>;
  return (
    <SheetFrame title="Disclosure and ads setting" full footer={<><div className="info-text small" style={{ padding: '0 0 10px' }}>By posting, you agree to our Branded Content Policy and Music Usage Confirmation.</div><button className="btn-primary block" data-act="disclosure-save" onClick={() => { close(); showToast('Saved'); }}>Save</button></>}>
      <div className="dc-group">Content disclosure settings</div>
      <div className="opt-row"><span>Disclose commercial content<small>Let others know this post promotes a brand or business.</small></span>{T('disclose')}</div>
      {on.disclose && <>
        <div className="opt-row"><span>Your brand<small>You are promoting yourself or your own business.</small></span>{C('brand')}</div>
        <div className="opt-row"><span>Branded content<small>You are promoting another brand or third-party.</small></span>{C('branded')}</div>
      </>}
      <button className="opt-row" data-act="disclosure-partnership" onClick={() => showToast('Brand partnership linked')}><span>Brand partnership<small>Link a brand partner to share post analytics and show your post to relevant audiences.</small></span><I.right size={16} /></button>
      <div className="dc-group">Ad settings</div>
      <div className="opt-row"><span>Ad authorization<small>By enabling ad authorization, you permit the authorized party to use this video as ad creative.</small></span>{T('ad')}</div>
      <div className="dc-group">Display settings</div>
      <div className="opt-row"><span>Show through ads only</span>{T('adsOnly')}</div>
    </SheetFrame>
  );
}
const MoreOptionsSheet = () => <ToggleList title="More options" rows={[['Allow comments', true], ['Allow reuse of content', true], ['Upload with high quality', true]]} />;

function SoundSheet({ onPick }) {
  const close = useApp((s) => s.closeSheet);
  const sounds = ['Coast drive - Lofi Travel', 'Sunday morning - Café Sounds', 'Night train - Studio Loops', 'original sound - miralane.travels'];
  return (
    <SheetFrame title="Sounds">
      {sounds.map((s) => <button key={s} className="opt-row" data-act="sound-pick" onClick={() => { onPick(s); close(); }}><span><I.music size={16} /> {s}</span></button>)}
    </SheetFrame>
  );
}

function ActionList({ title, actions }) {
  const close = useApp((s) => s.closeSheet);
  return (
    <SheetFrame title={title}>
      {actions.map((a) => <button key={a.label} className={`opt-row ${a.danger ? 'danger' : ''}`} data-act={`action-${a.label}`} onClick={() => { close(); a.on?.(); }}><span>{a.icon} {a.label}</span></button>)}
    </SheetFrame>
  );
}
function DraftActionsSheet({ draftId }) {
  const removeDraft = useApp((s) => s.removeDraft); const openModal = useApp((s) => s.openModal); const showAlert = useApp((s) => s.showAlert);
  return <ActionList title="Draft" actions={[
    { label: 'Edit', icon: <I.edit size={18} />, on: () => openModal('composer', { draftId }) },
    { label: 'Delete', danger: true, icon: <I.trash size={18} />, on: () => showAlert({ title: 'Delete this draft?', message: 'This can’t be undone.', actions: [{ label: 'Cancel' }, { label: 'Delete', bold: true, destructive: true, onPress: () => removeDraft(draftId) }] }) },
  ]} />;
}
function FeedMoreSheet({ own }) {
  const showToast = useApp((s) => s.showToast);
  return <ActionList title="" actions={own ? [{ label: 'Privacy settings', icon: <I.lock size={18} />, on: () => useApp.getState().openSheet('postPrivacy', { value: 'everyone', onPick: () => useApp.getState().showToast('Privacy updated') }) }, { label: 'Download', icon: <I.down size={18} />, on: () => showToast('Updated') }] : [
    { label: 'Not interested', icon: <I.close size={18} />, on: () => showToast('We’ll show fewer posts like this') },
    { label: 'Open in TikTok', icon: <I.share size={18} />, on: () => useApp.getState().showAlert({ title: 'Continue to TikTok app?', actions: [{ label: 'Cancel' }, { label: 'Continue', bold: true }] }) },
  ]} />;
}
function InboxMoreSheet({ id }) {
  const markRead = useApp((s) => s.markRead); const showToast = useApp((s) => s.showToast);
  return <ActionList title="" actions={[{ label: 'Mark as read', icon: <I.check size={18} />, on: () => markRead(id) }, { label: 'Turn off this type of notification', icon: <I.bell size={18} />, on: () => showToast('Updated') }]} />;
}
function PostActionsSheet() {
  const showToast = useApp((s) => s.showToast);
  return <ActionList title="" actions={[{ label: 'Privacy settings', icon: <I.lock size={18} />, on: () => showToast('Updated') }, { label: 'Delete', danger: true, icon: <I.trash size={18} />, on: () => showToast('Post deleted') }]} />;
}
function SwitchAccountSheet() {
  const close = useApp((s) => s.closeSheet);
  return (
    <SheetFrame title="Switch account">
      <button className="opt-row" onClick={close} data-act="switch-current"><span className="row-av"><Avatar size={36} label="ML" /> {ACCOUNT.handle}</span><I.check size={18} /></button>
      <button className="opt-row" onClick={close} data-act="switch-add"><span className="row-av"><span className="add-av"><I.plus size={18} /></span> Add account</span></button>
    </SheetFrame>
  );
}

// iOS 动作表（7m2O_0228：草稿 … → Delete（红）/ Cancel）
function IOSActionSheet({ actions }) {
  const close = useApp((s) => s.closeSheet);
  return (
    <>
      <motion.div className="sheet-scrim" data-act="sheet-scrim-close" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="ios-actions" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 380 }}>
        {actions.map((a) => <button key={a.label} data-act={a.act || `action-${a.label}`} className={a.destructive ? 'destructive' : ''} onClick={() => { close(); a.on?.(); }}>{a.label}</button>)}
        <div className="ia-gap" />
        <button data-act="action-cancel" onClick={close}>Cancel</button>
      </motion.div>
    </>
  );
}
function PlaylistSheet() {
  const close = useApp((s) => s.closeSheet);
  const lists = ['Weekend trips', 'Kyoto series', 'Packing'];
  return (
    <SheetFrame title="Add to playlist">
      {lists.map((l) => <button key={l} className="opt-row" data-act="playlist-pick" onClick={() => { window.dispatchEvent(new CustomEvent('pick-playlist', { detail: l })); close(); }}><span>{l}</span></button>)}
    </SheetFrame>
  );
}

export const SHEETS = {
  iosActions: IOSActionSheet, playlist: PlaylistSheet,
  sort: SortSheet, privacy: PrivacySheet, views: ViewsSheet, replies: RepliesSheet, postedBy: PostedBySheet, followerCount: FollowerCountSheet,
  info: InfoSheet, customRange: CustomRangeSheet, schedule: ScheduleSheet, reply: ReplySheet, insights: InsightsSheet,
  postPrivacy: PostPrivacySheet, disclosure: DisclosureSheet, moreOptions: MoreOptionsSheet, sound: SoundSheet,
  draftActions: DraftActionsSheet, feedMore: FeedMoreSheet, inboxMore: InboxMoreSheet, postActions: PostActionsSheet, switchAccount: SwitchAccountSheet,
};
