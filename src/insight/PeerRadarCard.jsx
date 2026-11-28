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

// Monochrome blue (2026-11-28 Yanice, structure of the Xiaohongshu reference): one deep blue (--c-blue-selected) for
// both series, my line full strength, similar at 50%, fills 50% / 25%. All resolve in PeerRadarCard.css.
const C = { own: 'var(--radar-own)', ownFill: 'var(--radar-own-fill)', peer: 'var(--radar-peer)', peerFill: 'var(--radar-peer-fill)' };
const LABELS = {
  account: { selfLabel: 'My account', peerLabel: 'Similar creators', group: 'of similar creators' },
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
const Arrow = ({ up, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" style={{ transform: up ? 'rotate(180deg)' : 'none' }}>
    <path d="M6 2.2v7.4M3 6.7l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Entrance (same family as the rose chart in main, entrance.js): your polygon grows out of the centre with the
// sector easing/duration, the peer dashed polygon a beat later, points pop in per axis, labels fade with labDelay.
// Scaling a polygon about the centre moves every vertex along its spoke, so it is the same growth as a vertex morph.
const PT_DELAY = 0.3; // points land as the polygon reaches them
const ptIn = (i) => ({ duration: 0.26, ease: ENTER_EASE, delay: PT_DELAY + i * 0.05 });

// ---- Axis label placement (2026-11-28 Yanice: smaller rings, labels evenly spaced around the pentagon) ----
// Every label is anchored to its own corner of the pentagon (the axis end on the outer ring) and keeps the same GAP
// from that corner:
//  - Top: centred on the axis, bottom edge GAP above the corner.
//  - Sides: vertically centred on the corner's height (not pushed up along the axis), inner edge GAP beyond the corner.
//  - Bottom pair: moved out along its axis until the block is GAP past the corner (support distance of the block in the
//    axis direction), then both share the lower of the two rows. Their x follows each one's own axis.
// Each block also keeps CLEAR from the outer ring, so no label touches the rings, spokes, polygon or points.
// Rings vs data (2026-11-28 Yanice): the polygons keep their drawn scale (S = 92pt for a 4× ratio); only the rings and
// spokes shrink, so the outer ring sits RING_PAD outside the farthest point (room for the selected point and its stroke)
// and the labels come in with it. S only shrinks if the five blocks would not otherwise fit inside the chart.
const GAP = 12, CLEAR = 6, RING_PAD = 8;
const S_MAX = 92, S_MIN = 40;
const EDGE = 8; // labels may use 8pt of the card's 16pt padding
const AXIS_DEG = [-90, -18, 54, 126, 198];
const EST = { w: 96, h: 48 }; // before the first measurement (layout effect replaces it before paint)
function placeLabels(sizes, W, R) {
  const rad = AXIS_DEG.map(a => a * Math.PI / 180), cx = W / 2;
  const top = sizes[0], cy = top.h + GAP + R; // top block touches the top of the chart
  const V = rad.map(a => [cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  const boxes = [];
  boxes[0] = { x: cx - top.w / 2, y: 0, ...top };
  // sides: right = axis 1, left = axis 4 (mirrored inner edges, same row)
  const hs = Math.max(sizes[1].h, sizes[4].h), ys = V[1][1] - hs / 2;
  boxes[1] = { x: V[1][0] + GAP, y: ys, ...sizes[1] };
  boxes[4] = { x: V[4][0] - GAP - sizes[4].w, y: ys, ...sizes[4] };
  // bottom pair: axes 2 (right) and 3 (left)
  const out = i => { const c = Math.abs(Math.cos(rad[i])), sn = Math.abs(Math.sin(rad[i])); return R + GAP + (sizes[i].w / 2) * c + (sizes[i].h / 2) * sn; };
  const centre = i => [cx + Math.cos(rad[i]) * out(i), cy + Math.sin(rad[i]) * out(i)];
  const yb = Math.max(...[2, 3].map(i => centre(i)[1] - sizes[i].h / 2));
  for (const i of [2, 3]) boxes[i] = { x: centre(i)[0] - sizes[i].w / 2, y: yb, ...sizes[i] };
  for (const b of boxes) {
    if (b.x < -EDGE || b.x + b.w > W + EDGE) return null;
    const dx = Math.max(b.x - cx, 0, cx - (b.x + b.w)), dy = Math.max(b.y - cy, 0, cy - (b.y + b.h));
    if (Math.hypot(dx, dy) < R + CLEAR) return null;
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.x < b.x + b.w + 5 && b.x < a.x + a.w + 5 && a.y < b.y + b.h + 5 && b.y < a.y + a.h + 5) return null;
  }
  return { R, cx, cy, H: Math.ceil(Math.max(...boxes.map(b => b.y + b.h))), boxes };
}
// reach = the farthest point as a share of S (the peer ring sits at MID, own points at axisRadius).
function layoutRadar(sizes, W, reach) {
  for (let S = S_MAX; S >= S_MIN; S--) { const L = placeLabels(sizes, W, S * reach + RING_PAD); if (L) return { ...L, S }; }
  return { ...placeLabels(sizes.map(() => ({ w: 0, h: sizes[0].h })), W, S_MIN * reach + RING_PAD), S: S_MIN };
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
  const reach = Math.max(MID, ...areas.map(a => axisRadius(a.own, a.peer)));
  const G = useMemo(() => layoutRadar(sizes || areas.map(() => EST), W, reach), [sizes, W, areas.length, reach]);
  const { R: radius, S, cx, cy, H } = G; // radius = outer ring, S = data scale
  const L = LABELS[scope];
  const xy = (r, i) => {
    const a = AXIS_DEG[i] * Math.PI / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const ownR = a => S * axisRadius(a.own, a.peer);
  const peerR = S * MID;
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
      <motion.polygon className="peer-radar-peer" points={points(() => peerR)} style={{ fill: C.peerFill, stroke: C.peer, ...grow }} strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={entering ? { scale: 0, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={segIn(0, 0.08)}/>
      <motion.polygon className="peer-radar-own" points={points(ownR)} style={{ fill: C.ownFill, stroke: C.own, ...grow }} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={entering ? { scale: 0 } : false} animate={{ scale: 1 }} transition={segIn(0)}/>
      {areas.map((a,i) => { const [x,y] = xy(peerR,i); return <circle key={a.name} className={`peer-radar-peer-pt${dim(i)}${entering ? ' enter-fade' : ''}`} cx={x} cy={y} r="3" style={{ fill: 'var(--c-white, #fff)', stroke: C.peer, animationDelay: entering ? `${PT_DELAY + 0.08 + i * 0.05}s` : undefined }} strokeWidth="1.4"/>; })}
      {/* Own points: solid blue with a white ring. Default: every point at full strength. User selection: that axis's
          point grows, the others dim. */}
      {areas.map((a,i) => { const [x,y] = xy(ownR(a),i), on = selected === i; return <motion.circle key={a.name} className={`peer-radar-own-pt${dim(i)}`} cx={x} cy={y} r={on ? 4.6 : 3.4} style={{ fill: 'var(--c-white, #fff)', stroke: C.own, transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }} strokeWidth="2"
        initial={entering ? { scale: 0 } : false} animate={{ scale: 1 }} transition={ptIn(i)}/>; })}
      {/* Points select too (14pt hit circle); the label button below is the accessible control. */}
      {areas.map((a,i) => { const [x,y] = xy(ownR(a),i); return <circle key={a.name} className="peer-radar-pt-hit" cx={x} cy={y} r="14" fill="transparent" data-act={`${act}-point-${i}`} aria-hidden="true" onClick={e => { e.stopPropagation(); onPick(a.key); }}/>; })}
    </svg>
    {areas.map((a, i) => {
      const b = G.boxes[i], on = selected === i;
      return <button key={a.name} type="button" className={`peer-radar-hit${entering ? ' enter-fade' : ''}`} aria-pressed={on}
        aria-label={`${a.name} ${a.ownText}`}
        data-act={`${act}-axis-${i}`} style={{ left: b.x, top: b.y, visibility: sizes ? undefined : 'hidden', animationDelay: entering ? labDelay(i) : undefined }} onClick={e => { e.stopPropagation(); onPick(a.key); }}>
        <span ref={el => { labRefs.current[i] = el; }} className={`peer-radar-label${dim(i)}`}>
          {/* Two centred lines: metric name (.kpi-label) + trend arrow (vs the previous 7 days / my typical post, the
              tile-1 baseline, in the Key metrics up / down colour; none when flat) over the absolute value. */}
          <span className="kpi-label prl-name">{a.line1}{a.trend !== 'flat' && <span className={`prl-arrow ${a.trend}`}><Arrow up={a.trend === 'up'} size={9}/></span>}</span>
          <span className="prl-val">{a.line2}</span>
        </span>
      </button>;
    })}
  </div>;
}

export function PeerRadarCard({ scope, insight, areas: rawAreas, ca='row', act, cardAct=act, onAsk, onSelect, syncTo, initialArea, resetToken, ask, askAct, children }) {
  const areas = withRadarStats(rawAreas, scope);
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
  // Rewards (account) shows where the money comes from instead of the two comparison tiles.
  const split = scope === 'account' ? rewardsBreakdown(area) : null;
  const tiles = split || area.tiles;
  return <div data-insight={cardAct} data-tip={sel ?? -1} className={entering ? 'enter-card' : undefined} style={CARD_STYLE} onClick={onBlank}>
    <CardHead title={insight.cardTitle || (scope==='post'?'Post summary':'Performance summary')} infoLabel="About this comparison" act={`${act}-info`} onInfo={()=>setOpen(true)}/>
    <KeyBlock k={insight.key} rest={insight.rest} bullets={insight.bullets} next={insight.next}/>
    <div className="peer-radar" data-peer-radar data-state={sel == null ? 'default' : 'selected'}>
      <Radar areas={areas} scope={scope} selected={sel} act={act} onPick={pick} entering={entering}/>
      <div className={`peer-radar-legend${entering ? ' enter-fade' : ''}`} style={entering ? { animationDelay: labDelay(5) } : undefined}>
        {/* Legend dots drawn like the chart points: solid blue with a white ring | white ringed in light blue. */}
        <span><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3.5" style={{ fill: 'var(--c-white, #fff)', stroke: C.own }} strokeWidth="2"/></svg>{L.selfLabel}</span>
        <span><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3.6" style={{ fill: 'var(--c-white, #fff)', stroke: C.peer }} strokeWidth="1.6"/></svg>{L.peerLabel}</span>
      </div>
      <TopTabs id={`${act}-metrics`} tabs={tabs} value={area.key} onChange={pick} equal={false} className="a-tabs peer-radar-tabs" actPrefix={`${act}-area`}/>
      {/* Shown area: two tiles in the exact Key metrics tile markup (kit.jsx KpiCard + Delta): label / value / change
          pill + grey difference. Comparison: the baseline as the value and your change against it. Rewards: Gifts and
          Creator Rewards in $, with each part's share of the total in the row. */}
      <div className={`kpi-grid peer-radar-kpis${entering ? ' enter-card' : ''}`} style={entering ? { animationDelay: '0.3s' } : undefined} aria-live="polite">
        {tiles.map(t => <div key={t.key} className="kpi peer-radar-tile" data-tile={t.key}>
          <div className="kpi-label">{t.label}</div>
          <div className="kpi-val">{t.money != null ? <><small>$</small>{t.money}</> : t.value}</div>
          <div className="kpi-delta">
            {t.pill && <span className={`kd-pill ${t.tone}`}>{t.tone !== 'flat' && <Arrow up={t.tone === 'up'}/>}{t.pill}</span>}
            <span className="kd-abs">{t.abs}</span>
          </div>
        </div>)}
      </div>
    </div>
    {ca==='row'&&<AskRow act={askAct} seenKey={`peer-${scope}`} prompts={ask?.prompts||['Ask Creator Assistant']} fixed={askText} onAsk={q=>onAsk?.(q)} icon={<CaIcon size={22}/>}/>}
    {open&&children?.(()=>setOpen(false))}
  </div>;
}
