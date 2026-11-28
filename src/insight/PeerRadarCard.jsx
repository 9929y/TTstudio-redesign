// Shared radar treatment for Performance summary and Post summary.
// Original roles only (ref NEW_ELEMENT_MAPPING): page tabs, Key metrics tiles, delta chip, chart tooltip box.
// Numbers come from build.js (accountRadar / postRadar) and radarStats.js; colours from PeerRadarCard.css.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CardHead, CARD_STYLE, KeyBlock } from './CardParts.jsx';
import { TopTabs } from '../ui/kit.jsx';
import { AskRow } from './AskAssistant.jsx';
import { CaIcon } from '../screens/Subflows.jsx';
import { useChartWidth } from './chartLayout.js';
import { withRadarStats, rewardsBreakdown } from './radarStats.js';
import { useEntering, segIn, labDelay, ENTER_EASE } from './entrance.js';
import './PeerRadarCard.css';

// Monochrome blue (2026-11-28 Yanice, structure of the Xiaohongshu reference in our theme colour):
// own = deep theme blue line + light blue fill, peer = a lighter tint of the same blue. All resolve in PeerRadarCard.css.
const C = { own: 'var(--radar-own)', ownFill: 'var(--radar-own-fill)', peer: 'var(--radar-peer)', peerFill: 'var(--radar-peer-fill)' };
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

// ---- Axis label placement (2026-11-28 Yanice, same rule as the rose chart's labelFit.js) ----
// Every label block (its selected outline box included) keeps the same GAP from the outer ring in every direction,
// so no label can touch the rings, spokes, polygon or points (points never go past the rim).
//  - Top label: centred on its axis, bottom edge on ring + GAP.
//  - Side pair and bottom pair: one shared row height per pair (taken from a block centred on the axis direction),
//    then each block's nearest edge or corner is moved to exactly ring + GAP. The two blocks of a pair therefore sit
//    on the same row with mirrored inner edges, whatever their widths.
//  - If a pair does not fit inside the 345pt chart it slides along the arc away from the horizontal (the gap never
//    shrinks). The radius is the largest that keeps all five blocks inside, preferring no slide.
// 2026-11-28 (reference breathing room): the gap is 14pt; the radius shrinks before a label would leave the chart.
const GAP = 8; // labels sit close to their corner, as in the reference
const R_MAX = 92, R_MIN = 40, SLIDE_MAX = 0, SLIDE_COST = 0.5; // no slide: every label sits on its own corner of the pentagon, like the rose chart (Yanice); the radius shrinks instead
const EDGE = 8; // labels may use 8pt of the card's 16pt padding
const AXIS_DEG = [-90, -18, 54, 126, 198];
const PAIRS = [[1, 4, -1], [2, 3, 1]]; // [right axis, left axis, slide step for the right one (towards the vertical)]
const EST = { w: 96, h: 48 }; // before the first measurement (layout effect replaces it before paint)
// Distance from the centre to a w×h box whose centre is t along (c, s).
const boxDist = (t, c, s, w, h) => Math.hypot(Math.max(0, Math.abs(t * c) - w / 2), Math.max(0, Math.abs(t * s) - h / 2));
function centreDist(d, c, s, w, h) {
  let lo = 0, hi = d + w + h;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (boxDist(m, c, s, w, h) < d) lo = m; else hi = m; }
  return hi;
}
function placeLabels(sizes, W, R) {
  const d = R + GAP, cx = W / 2, cy = d + sizes[0].h; // top block touches the top of the chart
  const boxes = [];
  boxes[0] = { x: cx - sizes[0].w / 2, y: 0, ...sizes[0] };
  if (boxes[0].x < -EDGE) return null;
  let slide = 0;
  for (const [ri, li, step] of PAIRS) {
    const a = sizes[ri], b = sizes[li], w = (a.w + b.w) / 2, h = Math.max(a.h, b.h);
    let done = false;
    for (let k = 0; k <= SLIDE_MAX && !done; k++) {
      const m = (AXIS_DEG[ri] + k * step) * Math.PI / 180, c = Math.cos(m), s = Math.sin(m);
      const yc = cy + centreDist(d, c, s, w, h) * s, y = yc - h / 2;
      const dy = Math.max(0, y - cy, cy - (y + h));
      if (dy >= d) break;
      const dx = Math.sqrt(d * d - dy * dy);
      const R1 = { x: cx + dx, y, ...a }, L1 = { x: cx - dx - b.w, y, ...b };
      if (R1.x + R1.w <= W + EDGE && L1.x >= -EDGE) { boxes[ri] = R1; boxes[li] = L1; slide = Math.max(slide, k); done = true; }
    }
    if (!done) return null;
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.x < b.x + b.w + 5 && b.x < a.x + a.w + 5 && a.y < b.y + b.h + 5 && b.y < a.y + a.h + 5) return null;
  }
  return { R, cx, cy, H: Math.ceil(Math.max(...boxes.map(b => b.y + b.h))), boxes, slide };
}
function layoutRadar(sizes, W) {
  let best = null;
  for (let R = R_MAX; R >= R_MIN; R--) {
    const L = placeLabels(sizes, W, R);
    if (L && (!best || R - SLIDE_COST * L.slide > best.R - SLIDE_COST * best.slide)) best = L;
  }
  return best || placeLabels(sizes.map(() => ({ w: 0, h: sizes[0].h })), W, R_MIN);
}

function Radar({ areas, scope, selected, act, onPick, entering }) {
  const [ref, measured] = useChartWidth();
  const W = Math.min(345, measured || 345);
  // Label sizes come from the rendered blocks (same font, chip padding and outline box as on screen).
  const labRefs = useRef([]);
  const [sizes, setSizes] = useState(null);
  useLayoutEffect(() => {
    const next = areas.map((_, i) => { const el = labRefs.current[i]; return el ? { w: Math.ceil(el.offsetWidth), h: Math.ceil(el.offsetHeight) } : EST; });
    if (!sizes || next.some((n, i) => n.w !== sizes[i]?.w || n.h !== sizes[i]?.h)) setSizes(next);
  });
  const G = useMemo(() => layoutRadar(sizes || areas.map(() => EST), W), [sizes, W, areas.length]);
  const { R: radius, cx, cy, H } = G;
  const L = LABELS[scope];
  const xy = (r, i) => {
    const a = AXIS_DEG[i] * Math.PI / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const ownR = a => radius * axisRadius(a.own, a.peer);
  const peerR = radius * MID;
  const points = f => areas.map((a, i) => xy(f(a), i).map(v => v.toFixed(2)).join(',')).join(' ');
  const grow = { transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' };
  // No user selection (default state) = nothing dims; otherwise the non-selected axes recede.
  const dim = i => (selected == null ? '' : selected === i ? ' is-on' : ' is-dim');
  return <div ref={ref} className="peer-radar-chart" style={{ height: H }}>
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${L.selfLabel} and ${L.peerLabel} across five performance areas`}
      data-cx={cx} data-cy={cy} data-r={radius}>
      {/* Rings: thin grey dashed circles. */}
      {[.25,.5,.75,1].map(f => <circle key={f} className="peer-radar-ring" cx={cx} cy={cy} r={radius*f} fill="none" strokeWidth=".75" strokeDasharray="2 3"/>)}
      {areas.map((a,i) => { const [x,y] = xy(radius, i); return <line key={a.name} className={`peer-radar-spoke${selected === i ? ' is-on' : ''}`} x1={cx} y1={cy} x2={x} y2={y} strokeDasharray="2 3" strokeWidth=".75"/>; })}
      <motion.polygon className="peer-radar-peer" points={points(() => peerR)} style={{ fill: C.peerFill, stroke: C.peer, ...grow }} strokeWidth="1.4" strokeDasharray="3 2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={entering ? { scale: 0, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={segIn(0, 0.08)}/>
      <motion.polygon className="peer-radar-own" points={points(ownR)} style={{ fill: C.ownFill, stroke: C.own, ...grow }} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={entering ? { scale: 0 } : false} animate={{ scale: 1 }} transition={segIn(0)}/>
      {areas.map((a,i) => { const [x,y] = xy(peerR,i); return <circle key={a.name} className={`peer-radar-peer-pt${dim(i)}${entering ? ' enter-fade' : ''}`} cx={x} cy={y} r="2.6" style={{ fill: 'var(--c-white, #fff)', stroke: C.peer, animationDelay: entering ? `${PT_DELAY + 0.08 + i * 0.05}s` : undefined }} strokeWidth="1.4"/>; })}
      {/* Own points: solid blue with a white ring. Default: every point at full strength. User selection: that axis's
          point grows, the others dim. */}
      {areas.map((a,i) => { const [x,y] = xy(ownR(a),i), on = selected === i; return <motion.circle key={a.name} className={`peer-radar-own-pt${dim(i)}`} cx={x} cy={y} r={on ? 5 : 3.6} style={{ fill: C.own, stroke: 'var(--c-white, #fff)', transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }} strokeWidth="1.5"
        initial={entering ? { scale: 0 } : false} animate={{ scale: 1 }} transition={ptIn(i)}/>; })}
      {/* Points select too (14pt hit circle); the label button below is the accessible control. */}
      {areas.map((a,i) => { const [x,y] = xy(ownR(a),i); return <circle key={a.name} className="peer-radar-pt-hit" cx={x} cy={y} r="14" fill="transparent" data-act={`${act}-point-${i}`} aria-hidden="true" onClick={e => { e.stopPropagation(); onPick(a.key); }}/>; })}
    </svg>
    {areas.map((a, i) => {
      const b = G.boxes[i], on = selected === i;
      return <button key={a.name} type="button" className={`peer-radar-hit${entering ? ' enter-fade' : ''}`} aria-pressed={on}
        aria-label={`${a.name} ${a.ownText}, ahead of ${a.rankText} ${L.group}`}
        data-act={`${act}-axis-${i}`} style={{ left: b.x, top: b.y, visibility: sizes ? undefined : 'hidden', animationDelay: entering ? labDelay(i) : undefined }} onClick={e => { e.stopPropagation(); onPick(a.key); }}>
        <span ref={el => { labRefs.current[i] = el; }} className={`peer-radar-label${dim(i)}`}>
          {/* Two balanced lines, both centred (Xiaohongshu reference): name + value (.kpi-label) over the percentile. */}
          <span className="kpi-label prl-name">{a.line1}</span>
          <span className="prl-rank">{a.line2}</span>
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
  //  Deselect (2026-11-28 Yanice, the rose chart rule): tapping the selected tab / point / label again, tapping blank
  //  space in the card, or tapping the synced Key metrics tile again (syncTo key null) returns to the default state.
  //  In the default state the first tab is only shown, not selected: tapping it selects that axis.
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
    selectRef.current?.(sel != null ? areas[sel].key : null); // null = back to default, the page clears its tile
  }, [sel]); // Same KPI linkage as the previous Overview card.
  // Selection made below the card (a Key metrics tile): a user selection too, without echoing back.
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) { firstSync.current = false; return; }
    // key null = the synced tile was tapped again: back to the default state.
    const i = syncTo?.key == null ? null : indexOf(syncTo.key);
    if (i !== -1 && i !== selRef.current) { silent.current = true; setSel(i); }
  }, [syncTo?.n]);
  // Back to the default state when the data changes (date range / post) or the page asks for a reset.
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) { firstReset.current = false; return; }
    if (selRef.current != null) { silent.current = true; setSel(null); }
  }, [insight?.key, insight?.period, resetToken]); // by content, so a wrapped insight object ({...insight, cardTitle}) does not reset on every render
  // Same control again = deselect (sel is null in the default state, so the shown first tab selects on tap).
  const pick = key => {
    const i = areas.findIndex(a => a.key === key);
    if (i >= 0) setSel(i === selRef.current ? null : i);
  };
  // Blank space in the card (chart background, insight text, legend) = back to default. Controls, the tiles and
  // the Ask row keep their own meaning; taps inside the ⓘ sheet (a portal) are not in this card's DOM.
  const onBlank = e => {
    if (selRef.current == null || !e.currentTarget.contains(e.target)) return;
    if (e.target.closest('button, a, input, [data-act], [role="tab"], .peer-radar-kpis')) return;
    setSel(null);
  };
  const L = LABELS[scope];
  const tabs = areas.map(a => ({key:a.key,label:a.name}));
  const askText = sel != null ? (ask?.byArea?.[area.key] || null) : null;
  const vs = area.vs;
  const split = scope === 'account' ? rewardsBreakdown(area) : null;
  return <div data-insight={cardAct} data-tip={sel ?? -1} className={entering ? 'enter-card' : undefined} style={CARD_STYLE} onClick={onBlank}>
    <CardHead title={insight.cardTitle || (scope==='post'?'Post summary':'Performance summary')} infoLabel="About this comparison" act={`${act}-info`} onInfo={()=>setOpen(true)}/>
    <KeyBlock k={insight.key} rest={insight.rest} bullets={insight.bullets} next={insight.next}/>
    <div className="peer-radar" data-peer-radar data-state={sel == null ? 'default' : 'selected'}>
      <Radar areas={areas} scope={scope} selected={sel} act={act} onPick={pick} entering={entering}/>
      <div className={`peer-radar-legend${entering ? ' enter-fade' : ''}`} style={entering ? { animationDelay: labDelay(5) } : undefined}>
        {/* Legend dots drawn like the chart points: solid blue with a white ring | white ringed in light blue. */}
        <span><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4" style={{ fill: C.own, stroke: C.ownFill }} strokeWidth="1.5"/></svg>{L.selfLabel}</span>
        <span><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3.6" style={{ fill: 'var(--c-white, #fff)', stroke: C.peer }} strokeWidth="1.6"/></svg>{L.peerLabel}</span>
      </div>
      <TopTabs id={`${act}-metrics`} tabs={tabs} value={area.key} onChange={pick} equal={false} className="a-tabs peer-radar-tabs" actPrefix={`${act}-area`}/>
      {/* Shown area: one Key metrics tile across the row (your value + delta chip). The percentile is already on the
          axis label, so the old "Ahead of" tile is gone (2026-11-28 Yanice). Rewards adds its split in the value row. */}
      <div className={`kpi-grid peer-radar-kpis${entering ? ' enter-card' : ''}`} style={entering ? { animationDelay: '0.3s' } : undefined} aria-live="polite">
        <div className="kpi sel peer-radar-tile" data-tile="self">
          <div className="kpi-label">{area.label}</div>
          <div className="prt-row">
            <div className="kpi-val">{area.ownText}</div>
            {split && <div className="prt-split" data-split>{split.text}</div>}
          </div>
          <div className="kpi-delta"><span className={`kd-pill ${vs.tone}`}>{vs.tone !== 'flat' && <Arrow up={vs.tone === 'up'}/>}{vs.text}</span><span className="kd-abs">vs typical</span></div>
        </div>
      </div>
    </div>
    {ca==='row'&&<AskRow act={askAct} seenKey={`peer-${scope}`} prompts={ask?.prompts||['Ask Creator Assistant']} fixed={askText} onAsk={q=>onAsk?.(q)} icon={<CaIcon size={22}/>}/>}
    {open&&children?.(()=>setOpen(false))}
  </div>;
}
