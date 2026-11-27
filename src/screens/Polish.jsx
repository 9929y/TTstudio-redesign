// V4 精修：替换掉界面里的「原型」提示，换成真实 App 式的面板与反馈
import { useState } from 'react';
import { useApp } from '../store.js';
import { SheetFrame } from '../shell/Overlays.jsx';
import { Avatar } from '../ui/kit.jsx';
import { I } from '../ui/Icons.jsx';
import { INSPIRATION } from '../data/seed.js';
import { fmt } from '../data/agg.js';

// 筛选胶囊的选项（选中后写入 store.chipSel，胶囊显示所选值）
export const CHIP_OPTIONS = {
  'Follower count': ['All', 'Under 10K', '10K–100K', '100K–1M', 'Over 1M'],
  'Video views': ['All', 'Over 10K', 'Over 100K', 'Over 1M'],
  Region: ['All regions', 'United States', 'United Kingdom', 'Canada', 'Australia'],
  'Date posted': ['All time', 'Last 24 hours', 'This week', 'This month', 'Last 3 months'],
  'Account type': ['All', 'Creators', 'Businesses'],
  'Other preferences': ['All', 'Verified accounts', 'Accounts I don’t follow'],
  Program: ['All programs', 'Creator Rewards Program', 'TikTok Shop for Sellers'],
  'Date range': ['Last 7 days', 'Last 28 days', 'Last 60 days'],
  'Publish date': ['Newest', 'Oldest'],
};
export function OptionListSheet({ title }) {
  const close = useApp((s) => s.closeSheet);
  const sel = useApp((s) => s.chipSel[title]);
  const opts = CHIP_OPTIONS[title] || ['All'];
  return (
    <SheetFrame title={title}>
      {opts.map((o, i) => (
        <button key={o} className="opt-row" data-act={`chip-opt-${i}`} onClick={() => { useApp.setState((s) => ({ chipSel: { ...s.chipSel, [title]: i === 0 ? undefined : o } })); setTimeout(close, 140); }}>
          <span>{o}</span><span className={`radio ${(sel || opts[0]) === o ? 'on' : ''}`}><i /></span>
        </button>
      ))}
    </SheetFrame>
  );
}

const TRAYS = {
  stickers: { title: 'Stickers', items: ['😂', '🔥', '❤️', '✨', '👏', '🥹', '😍', '💯', '🙌', '📍', '⏰', '🗳️'] },
  effects: { title: 'Effects', items: ['Green screen', 'Slow zoom', 'Blur', 'Retro', 'Glow', 'Split', 'Mirror', 'Flash', 'Shake'] },
  filters: { title: 'Filters', items: ['Normal', 'Vivid', 'Warm', 'Cool', 'Mono', 'Film', 'Soft', 'Fade', 'Pop'] },
};
export function ToolTraySheet({ kind }) {
  const close = useApp((s) => s.closeSheet); const toast = useApp((s) => s.showToast);
  const t = TRAYS[kind] || TRAYS.stickers;
  const [on, setOn] = useState(kind === 'filters' ? 0 : -1);
  return (
    <SheetFrame title={t.title}>
      <div className={`tray ${kind}`}>
        {t.items.map((x, i) => (
          <button key={x} data-act={`tray-${kind}-${i}`} className={`tray-it ${on === i ? 'on' : ''}`} onClick={() => { setOn(i); if (kind !== 'filters') { close(); toast(kind === 'stickers' ? 'Sticker added' : `${x} applied`); } }}>
            {kind === 'stickers' ? <span className="tray-emoji">{x}</span> : <><span className="tray-prev" style={{ filter: kind === 'filters' ? ['none', 'saturate(1.6)', 'sepia(.35)', 'hue-rotate(180deg)', 'grayscale(1)', 'contrast(1.2) sepia(.2)', 'brightness(1.1) blur(.4px)', 'opacity(.75)', 'saturate(2) contrast(1.1)'][i] : undefined }} /><small>{x}</small></>}
          </button>
        ))}
      </div>
      {kind === 'filters' && <div style={{ padding: '8px 16px 0' }}><button className="btn-primary block" data-act="tray-filters-done" onClick={() => { close(); toast(`${t.items[on]} filter applied`); }}>Done</button></div>}
    </SheetFrame>
  );
}

// 他人作品的评论面板（视频流里点评论）
export function FeedCommentsSheet({ id }) {
  const item = INSPIRATION.find((x) => x.id === id) || INSPIRATION[0];
  const [text, setText] = useState(''); const [mine, setMine] = useState([]);
  const rows = [['jasmyntravels', 'Did this route last week and it was perfect', '2d', 482], ['map.nerd', 'The way you explained this 👏', '3d', 211], ['carryonkatie', 'Saving this for the weekend', '4d', 96], ['the_slow_route', 'Need part 2!!', '5d', 64]];
  return (
    <SheetFrame title={`${fmt(item.comments)} comments`} height="70%">
      <div className="fc-list">
        {[...mine.map((t) => ['you', t, 'now', 0]), ...rows].map(([u, t, d, l], i) => (
          <div key={i} className="fc-row"><Avatar hue={(i * 70 + 30) % 360} size={34} label={u[0].toUpperCase()} /><div className="fc-t"><div className="fc-u">{u}</div><div className="fc-b">{t}</div><div className="fc-d">{d} · Reply</div></div><div className="fc-l"><I.heart size={16} /><span>{l}</span></div></div>
        ))}
      </div>
      <div className="vc-input" style={{ paddingBottom: 8 }}><Avatar size={30} label="1" /><div className="vc-field"><input data-act="feed-comment-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add comment..." onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { setMine([text.trim(), ...mine]); setText(''); } }} />{text ? <button className="vc-send" data-act="feed-comment-send" onClick={() => { setMine([text.trim(), ...mine]); setText(''); }}>Post</button> : <><I.at size={20} /><I.emoji size={20} /></>}</div></div>
    </SheetFrame>
  );
}

export function LoginMethodsSheet() {
  const close = useApp((s) => s.closeSheet); const boot = useApp((s) => s.boot);
  return (
    <SheetFrame title="Log in to TikTok Studio">
      {['Use phone / email / username', 'Continue with Apple', 'Continue with Google', 'Continue with Facebook'].map((l, i) => (
        <button key={l} className="opt-row login-row" data-act={`login-${i}`} onClick={() => { close(); setTimeout(boot, 250); }}><span>{l}</span><I.right size={16} /></button>
      ))}
    </SheetFrame>
  );
}

export const POLISH_SHEETS = { optionList: OptionListSheet, toolTray: ToolTraySheet, feedComments: FeedCommentsSheet, loginMethods: LoginMethodsSheet };
