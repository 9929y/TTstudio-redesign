// Shared radar treatment for Performance summary and Post summary.
// Original roles only (ref NEW_ELEMENT_MAPPING): page tabs, Key metrics tiles, delta chip, chart tooltip box.
// Numbers come from build.js (accountRadar / postRadar) and radarStats.js; colours from PeerRadarCard.css.
import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CardHead, CARD_STYLE, KeyBlock } from './CardParts.jsx';
import { TopTabs } from '../ui/kit.jsx';
import { AskRow } from './AskAssistant.jsx';
import { CaIcon } from '../screens/Subflows.jsx';
import { useChartWidth } from './chartLayout.js';
import { withRadarStats } from './radarStats.js';
import { useEntering, segIn, labDelay, ENTER_EASE } from './entrance.js';
import './PeerRadarCard.css';

// Own = original chart blue (--c-blue), peer = the existing peer orange. Both resolve in PeerRadarCard.css.
const C = { own: 'var(--radar-own)', peer: 'var(--radar-peer)' };
const LABELS = {
  account: { selfLabel: 'Your account', peerLabel: 'Similar creators', group: 'of similar creators' },
  post: { selfLabel: 'This video', peerLabel: 'Similar videos', group: 'of similar videos' },
};

// Each axis is the ratio own / typical peer on a capped log scale: the typical peer sits on a fixed
// middle ring, 4× above reaches the rim, 4× below sits on a small inner ring. One spike can no longer
// squash the other axes, and no axis falls into the centre.
const RATIO_CAP = 4, MID = 0.5, MIN = 0.15;
export function axisRadius(own, peer) {
  const ratio = peer > 0 ? own / peer : own > 0 ? RATIO_CAP : 1;
  const t = ratio > 0 ? Math.max(-1, Math.min(1, Math.log(ratio) / Math.log(RATIO_CAP))) : -1;
  return t >= 0 ? MID + (1 - MID) * t : MID + (MID - MIN) * t;
}

// Delta-chip arrow, same drawing as kit.jsx Delta.
const Arrow = ({ up }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ transform: up ? 'rotate(180deg)' : 'none' }}>
    <path d="M6 2.2v7.4M3 6.7l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Entrance (same family as the rose chart in main, entrance.js): your polygon grows out of the centre with the
// sector easing/duration, the peer dashed polygon a beat later, points pop in per axis, labels fade with labDelay.
// Scaling a polygon about the centre moves every vertex along its spoke, so it is the same growth as a vertex morph.
const PT_DELAY = 0.3; // points land as the polygon reaches them
const ptIn = (i) => ({ duration: 0.26, ease: ENTER_EASE, delay: PT_DELAY + i * 0.05 });

function Radar({ areas, scope, selected, act, onPick, entering }) {
  const [ref, measured] = useChartWidth();
  const W = Math.min(345, measured || 345), H = 266, cx = W / 2, cy = 142;
  const radius = Math.min(92, Math.max(55, (W - 132) / 2));
  const L = LABELS[scope];
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const xy = (r, i) => {
    const a = (-90 + i * 72) * Math.PI / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const ownR = a => radius * axisRadius(a.own, a.peer);
  const peerR = radius * MID;
  const points = f => areas.map((a, i) => xy(f(a), i).map(v => v.toFixed(2)).join(',')).join(' ');
  const grow = { transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' };
  // No user selection (default state) = nothing dims; otherwise the non-selected axes recede.
  const dim = i => (selected == null ? '' : selected === i ? ' is-on' : ' is-dim');
  // Label boxes (name + value · status), anchored outside the rim: top, two sides above their vertex, two bottom.
  const labels = [
    { x: cx, y: 0, align: 'middle' }, { x: W, y: cy - radius * 0.31 - 50, align: 'end' },
    { x: W - 54, y: H - 44, align: 'middle' }, { x: 54, y: H - 44, align: 'middle' },
    { x: 0, y: cy - radius * 0.31 - 50, align: 'start' },
  ];
  return <div ref={ref} className="peer-radar-chart" style={{ height: H }}>
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${L.selfLabel} and ${L.peerLabel} across five performance areas`}
      data-cx={cx} data-cy={cy} data-r={radius}>
      <defs>
        <radialGradient id={`${gid}-peer`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={radius}>
          <stop offset="0%" style={{ stopColor: C.peer, stopOpacity: 0 }}/><stop offset="100%" style={{ stopColor: C.peer, stopOpacity: .13 }}/>
        </radialGradient>
        <radialGradient id={`${gid}-own`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={radius}>
          <stop offset="0%" style={{ stopColor: C.own, stopOpacity: .02 }}/><stop offset="100%" style={{ stopColor: C.own, stopOpacity: .2 }}/>
        </radialGradient>
      </defs>
      {[.25,.5,.75,1].map(f => <circle key={f} cx={cx} cy={cy} r={radius*f} fill="none" stroke="var(--c-line)" strokeWidth=".75"/>)}
      {areas.map((a,i) => { const [x,y] = xy(radius, i); return <line key={a.name} className={`peer-radar-spoke${selected === i ? ' is-on' : ''}`} x1={cx} y1={cy} x2={x} y2={y} strokeDasharray="2 3" strokeWidth=".75"/>; })}
      <motion.polygon className="peer-radar-peer" points={points(() => peerR)} fill={`url(#${gid}-peer)`} style={{ stroke: C.peer, ...grow }} strokeWidth="1.6" strokeDasharray="3 2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={entering ? { scale: 0, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={segIn(0, 0.08)}/>
      <motion.polygon className="peer-radar-own" points={points(ownR)} fill={`url(#${gid}-own)`} style={{ stroke: C.own, ...grow }} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={entering ? { scale: 0 } : false} animate={{ scale: 1 }} transition={segIn(0)}/>
      {areas.map((a,i) => { const [x,y] = xy(peerR,i); return <circle key={a.name} className={`peer-radar-peer-pt${dim(i)}${entering ? ' enter-fade' : ''}`} cx={x} cy={y} r="2.4" fill="white" style={{ stroke: C.peer, animationDelay: entering ? `${PT_DELAY + 0.08 + i * 0.05}s` : undefined }} strokeWidth="1.4"/>; })}
      {/* Default: every point at full strength. User selection: larger filled point on that axis, the others dim. */}
      {areas.map((a,i) => { const [x,y] = xy(ownR(a),i), on = selected === i; return <motion.circle key={a.name} className={`peer-radar-own-pt${dim(i)}`} cx={x} cy={y} r={on ? 4.5 : 2.8} style={{ fill: on ? C.own : 'white', stroke: C.own, transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }} strokeWidth="1.6"
        initial={entering ? { scale: 0 } : false} animate={{ scale: 1 }} transition={ptIn(i)}/>; })}
      {/* Points select too (14pt hit circle); the label button below is the accessible control. */}
      {areas.map((a,i) => { const [x,y] = xy(ownR(a),i); return <circle key={a.name} className="peer-radar-pt-hit" cx={x} cy={y} r="14" fill="transparent" data-act={`${act}-point-${i}`} aria-hidden="true" onClick={e => { e.stopPropagation(); onPick(a.key); }}/>; })}
    </svg>
    {areas.map((a, i) => {
      const l = labels[i], on = selected === i;
      return <button key={a.name} type="button" className={`peer-radar-hit is-${l.align}${entering ? ' enter-fade' : ''}`} aria-pressed={on}
        aria-label={`${a.name}: ${a.ownText}, ${a.status.word}, ahead of ${a.rankText} ${L.group}`}
        data-act={`${act}-axis-${i}`} style={{ left: l.x, top: l.y, animationDelay: entering ? labDelay(i) : undefined }} onClick={e => { e.stopPropagation(); onPick(a.key); }}>
        <span className={`peer-radar-label${dim(i)}`}>
          {/* Same classes as a Key metrics tile: .kpi-label, then the .kpi-delta row (.kd-abs number + .kd-pill chip). */}
          <span className="kpi-label prl-name">{a.name}</span>
          <span className="kpi-delta prl-sub"><span className="kd-abs prl-val">{a.ownText}</span><span className={`kd-pill ${a.status.tone} prl-status`} data-status={a.status.key}>{a.status.word}</span></span>
        </span>
      </button>;
    })}
  </div>;
}

export function PeerRadarCard({ scope, insight, areas: rawAreas, ca='row', act, cardAct=act, onAsk, onSelect, syncTo, initialArea, resetToken, ask, askAct, children }) {
  const areas = withRadarStats(rawAreas);
  const entering = useEntering(1100); // first entry only (entrance.js); later re-renders keep the plain transitions
  // Two states (2026-11-28 Yanice):
  //  - default (sel = null): first render and after a date-range change. All five axes at full strength, the tabs
  //    show the first area with its tiles, the Ask row keeps rotating the page-level questions.
  //  - user-selected (sel = index): a tab, radar point, axis label, or a Key metrics tile passed in as syncTo /
  //    initialArea. That axis gets the box, the others dim, the Ask row shows that area's fixed question.
  //  Tapping the selected tab keeps it; blank space does nothing.
  const indexOf = key => areas.findIndex(a => a.key === key || a.name === key);
  const [sel, setSel] = useState(() => { const i = initialArea != null ? indexOf(initialArea) : -1; return i >= 0 ? i : null; });
  const [open, setOpen] = useState(false);
  const shown = sel ?? 0;
  const area = areas[shown] || areas[0];
  const selRef = useRef(sel); selRef.current = sel;
  const silent = useRef(true); // the initial state and resets do not echo to the page below
  const selectRef = useRef(onSelect); selectRef.current = onSelect;
  useEffect(() => {
    if (silent.current) { silent.current = false; return; }
    if (sel != null) selectRef.current?.(areas[sel].key);
  }, [sel]); // Same KPI linkage as the previous Overview card.
  // Selection made below the card (a Key metrics tile): a user selection too, without echoing back.
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) { firstSync.current = false; return; }
    const i = indexOf(syncTo?.key);
    if (i >= 0 && i !== selRef.current) { silent.current = true; setSel(i); }
  }, [syncTo?.n]);
  // Back to the default state when the data changes (date range / post) or the page asks for a reset.
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) { firstReset.current = false; return; }
    if (selRef.current != null) { silent.current = true; setSel(null); }
  }, [insight?.key, insight?.period, resetToken]); // by content, so a wrapped insight object ({...insight, cardTitle}) does not reset on every render
  const pick = key => {
    const i = areas.findIndex(a => a.key === key);
    if (i >= 0) setSel(i);
  };
  const L = LABELS[scope];
  const tabs = areas.map(a => ({key:a.key,label:a.name}));
  const askText = sel != null ? (ask?.byArea?.[area.key] || null) : null;
  const vs = area.vs;
  return <div data-insight={cardAct} data-tip={sel ?? -1} className={entering ? 'enter-card' : undefined} style={CARD_STYLE}>
    <CardHead title={insight.cardTitle || (scope==='post'?'Post summary':'Performance summary')} infoLabel="About this comparison" act={`${act}-info`} onInfo={()=>setOpen(true)}/>
    <KeyBlock k={insight.key} rest={insight.rest} bullets={insight.bullets} next={insight.next}/>
    <div className="peer-radar" data-peer-radar data-state={sel == null ? 'default' : 'selected'}>
      <Radar areas={areas} scope={scope} selected={sel} act={act} onPick={pick} entering={entering}/>
      <div className={`peer-radar-legend${entering ? ' enter-fade' : ''}`} style={entering ? { animationDelay: labDelay(5) } : undefined}>
        <span><svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true"><path d="M0 2H14" style={{ stroke: C.own }} strokeWidth="2"/></svg>{L.selfLabel}</span>
        <span><svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true"><path d="M0 2H14" style={{ stroke: C.peer }} strokeWidth="1.6" strokeDasharray="3 2"/></svg>{L.peerLabel}</span>
      </div>
      <TopTabs id={`${act}-metrics`} tabs={tabs} value={area.key} onChange={pick} equal={false} className="a-tabs peer-radar-tabs" actPrefix={`${act}-area`}/>
      {/* Shown area, Key metrics tiles in the original 2-column grid: your value + delta chip | ahead of. */}
      <div className={`kpi-grid peer-radar-kpis${entering ? ' enter-card' : ''}`} style={entering ? { animationDelay: '0.3s' } : undefined} aria-live="polite">
        <div className="kpi sel" data-tile="self">
          <div className="kpi-label">{area.label}</div>
          <div className="kpi-val">{area.ownText}</div>
          <div className="kpi-delta"><span className={`kd-pill ${vs.tone}`}>{vs.tone !== 'flat' && <Arrow up={vs.tone === 'up'}/>}{vs.text}</span><span className="kd-abs">vs typical</span></div>
        </div>
        <div className="kpi peer-radar-rank" data-tile="rank">
          <div className="kpi-label">Ahead of</div>
          <div className="kpi-val">{area.rankText}</div>
          <div className="kpi-sub">{L.group}</div>
        </div>
      </div>
    </div>
    {ca==='row'&&<AskRow act={askAct} seenKey={`peer-${scope}`} prompts={ask?.prompts||['Ask Creator Assistant']} fixed={askText} onAsk={q=>onAsk?.(q)} icon={<CaIcon size={22}/>}/>}
    {open&&children?.(()=>setOpen(false))}
  </div>;
}
