// Shared approved radar treatment for Performance summary and Post summary.
// Existing TopTabs and KpiCard are reused: no page-specific type/spacing scale.
import { useEffect, useId, useRef, useState } from 'react';
import { CardHead, CARD_STYLE, KeyBlock } from './CardParts.jsx';
import { TopTabs, KpiCard } from '../ui/kit.jsx';
import { AskRow } from './AskAssistant.jsx';
import { CaIcon } from '../screens/Subflows.jsx';
import { useChartWidth } from './chartLayout.js';
import './PeerRadarCard.css';

const PALETTE = {
  account: { own: '#0d4a96', peer: '#e4a477', peerText: '#a84c1e', selfLabel: 'Your account', peerLabel: 'Similar creators' },
  post: { own: '#0d4a96', peer: '#5a9ff0', peerText: '#367cba', selfLabel: 'This video', peerLabel: 'Similar videos' },
};

function Radar({ areas, scope, selected }) {
  const [ref, measured] = useChartWidth();
  const W = Math.min(345, measured || 345), H = 252, cx = W / 2, cy = 136;
  const radius = Math.min(92, Math.max(55, (W - 132) / 2));
  const c = PALETTE[scope];
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  // Each axis is a ratio to its typical comparable value, so unlike mixed
  // raw units the geometry has one common scale. Large ratios extend the scale.
  const maxRatio = Math.max(92 / 70, ...areas.map(a => a.peer > 0 ? a.own / a.peer : 0));
  const base = radius / maxRatio;
  const xy = (r, i) => {
    const a = (-90 + i * 72) * Math.PI / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const ownR = a => a.peer > 0 ? base * a.own / a.peer : 0;
  const points = f => areas.map((a, i) => xy(f(a), i).join(',')).join(' ');
  const labels = [
    { x: cx, y: 17, align: 'middle' }, { x: W - 6, y: 81, align: 'end' },
    { x: W - 54, y: 229, align: 'middle' }, { x: 54, y: 229, align: 'middle' },
    { x: 6, y: 81, align: 'start' },
  ];
  return <div ref={ref} className="peer-radar-chart">
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${c.selfLabel} and ${c.peerLabel} across five performance areas`}>
      <defs>
        <radialGradient id={`${gid}-peer`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={radius}>
          <stop offset="0%" stopColor={c.peer} stopOpacity="0"/><stop offset="100%" stopColor={c.peer} stopOpacity=".13"/>
        </radialGradient>
        <radialGradient id={`${gid}-own`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={radius}>
          <stop offset="0%" stopColor={c.own} stopOpacity=".015"/><stop offset="100%" stopColor={c.own} stopOpacity=".22"/>
        </radialGradient>
      </defs>
      {[.25,.5,.75,1].map(f => <circle key={f} cx={cx} cy={cy} r={radius*f} fill="none" stroke="var(--c-line)" strokeWidth=".75"/>)}
      {areas.map((a,i) => { const [x,y] = xy(radius, i); return <line key={a.name} x1={cx} y1={cy} x2={x} y2={y} stroke="#cfd0d4" strokeDasharray="2 3" strokeWidth=".75"/>; })}
      <polygon points={points(() => base)} fill={`url(#${gid}-peer)`} stroke={c.peer} strokeWidth="1.6" strokeDasharray="3 2" strokeLinejoin="round"/>
      <polygon points={points(ownR)} fill={`url(#${gid}-own)`} stroke={c.own} strokeWidth="2" strokeLinejoin="round"/>
      {areas.map((a,i) => { const [x,y] = xy(base,i); return <circle key={a.name} cx={x} cy={y} r="2.4" fill="white" stroke={c.peer} strokeWidth="1.4"/>; })}
      {areas.map((a,i) => { const [x,y] = xy(ownR(a),i); return <circle key={a.name} cx={x} cy={y} r="2.8" fill="white" stroke={c.own} strokeWidth="1.6"/>; })}
      {areas.map((a,i) => { const l = labels[i]; return <g key={a.name} className="peer-radar-label">
        <text x={l.x} y={l.y} textAnchor={l.align} fontSize="13" fontWeight={selected === i ? 600 : 500} fill="var(--c-text)">{a.name}</text>
        <text x={l.x} y={l.y+18} textAnchor={l.align} fontSize="12" fontWeight="500"><tspan fill="#1765c4">{a.ownText}</tspan><tspan fill="var(--c-text-3)"> / </tspan><tspan fill={c.peerText}>{a.peerText}</tspan></text>
      </g>; })}
    </svg>
    <div className="peer-radar-legend">
      <span><svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true"><path d="M0 2H14" stroke={c.own} strokeWidth="2"/></svg>{c.selfLabel}</span>
      <span><svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true"><path d="M0 2H14" stroke={c.peer} strokeWidth="1.6" strokeDasharray="3 2"/></svg>{c.peerLabel}</span>
    </div>
  </div>;
}

export function PeerRadarCard({ scope, insight, areas, ca='row', act, cardAct=act, onAsk, onSelect, clearToken, ask, askAct, children }) {
  const [tip, setTip] = useState(-1), [open, setOpen] = useState(false);
  const active = tip < 0 ? 0 : tip;
  const area = areas[active];
  const first = useRef(true), silent = useRef(false), firstClear = useRef(true);
  const selectRef = useRef(onSelect); selectRef.current = onSelect;
  useEffect(() => {
    if (first.current) { first.current=false; return; }
    if (silent.current) { silent.current=false; return; }
    selectRef.current?.(tip >= 0 ? areas[tip].key : null);
  }, [tip]); // Same KPI linkage as the previous Overview card.
  useEffect(() => {
    if (firstClear.current) { firstClear.current=false; return; }
    setTip(t => { if (t>=0) silent.current=true; return -1; });
  }, [clearToken]);
  const rootRef = useRef(null);
  const pick = key => {
    const i = areas.findIndex(a => a.key===key);
    if(i>=0)setTip(t=>t===i?-1:i);
  };
  const tabs = areas.map(a => ({key:a.key,label:a.name}));
  const askText = tip >= 0 ? ask?.byArea?.[area.key] : null;
  return <div ref={rootRef} data-insight={cardAct} data-tip={tip} style={CARD_STYLE}
      onClick={e=>{if(tip>=0&&rootRef.current?.contains(e.target)&&!e.target.closest('button, a, [data-peer-radar]'))setTip(-1);}}>
    <CardHead title={insight.cardTitle || (scope==='post'?'Post summary':'Performance summary')} infoLabel="About this comparison" act={`${act}-info`} onInfo={()=>setOpen(true)}/>
    <KeyBlock k={insight.key} rest={insight.rest} bullets={insight.bullets} next={insight.next}/>
    <div className="peer-radar" data-peer-radar>
      <Radar areas={areas} scope={scope} selected={active}/>
      <TopTabs id={`${act}-metrics`} tabs={tabs} value={area.key} onChange={pick} equal={false} className="a-tabs peer-radar-tabs" actPrefix={`${act}-area`}/>
      <div className="kpi-grid peer-radar-kpis" aria-live="polite">
        <KpiCard k={{key:'peer-self',label:area.label,text:area.ownText}} selected readOnly/>
        <KpiCard k={{key:'peer-rank',label:scope==='post'?'Outperformed videos':'Outperformed peers',text:area.rankText}} readOnly/>
      </div>
    </div>
    {ca==='row'&&<AskRow act={askAct} seenKey={`peer-${scope}`} prompts={ask?.prompts||['Ask Creator Assistant']} fixed={askText} onAsk={q=>onAsk?.(q)} icon={<CaIcon size={22}/>}/>}
    {open&&children?.(()=>setOpen(false))}
  </div>;
}
