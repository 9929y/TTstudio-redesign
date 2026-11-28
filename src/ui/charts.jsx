// 手写 SVG 图表：趋势面积图（拖动 tooltip）、柱状图、留存曲线 + 滑杆
import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fmt, fmtStat, monDay, monDayYear, secToClock } from '../data/agg.js';
import { useChartWidth } from '../insight/chartLayout.js';

function niceMax(v) {
  if (v <= 0) return 3;
  const raw = v * 1.08;
  const p = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.ceil(raw / p / 3) * 3 * p;
}

// 趋势图：o1g_0036（7 天带点 + 末日斜线阴影）、o1g_0045（28 天）、o1g_0104（拖动 tooltip）
export function TrendChart({ data, height = 150, hatchLast = true, fmtValue = fmtStat, xLabel = (d) => monDay(d.date), tooltipLabel, minZero = true, animKey }) {
  const [chartRef, W] = useChartWidth(330);
  const PR = 44, PT = 10, PB = 22;
  const iw = W - PR, ih = height - PT - PB;
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const n = data.length;
  const { max, min, pts, path, area } = useMemo(() => {
    const vals = data.map((d) => d.value);
    let mx = Math.max(...vals), mn = minZero ? 0 : Math.min(...vals);
    if (!minZero) { const pad = (mx - mn) * 0.2 || 1; mn = Math.max(0, mn - pad); mx = mx + pad; }
    const max = minZero ? niceMax(mx) : mx; const min = mn;
    const x = (i) => (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
    const y = (v) => PT + ih - ((v - min) / (max - min || 1)) * ih;
    const pts = data.map((d, i) => [x(i), y(d.value)]);
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
    const area = `${path}L${iw},${PT + ih}L0,${PT + ih}Z`;
    return { max, min, pts, path, area };
  }, [data, height, W, minZero]);

  const pick = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round((px / iw) * (n - 1))));
    setHover(i);
  };
  const ticks = [1, 2 / 3, 1 / 3].map((f) => min + (max - min) * f);
  const hx = hover != null ? pts[hover][0] : 0;
  return (
    <div ref={chartRef} className="trend" data-act="chart-drag">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${height}`} width="100%" height={height} style={{ touchAction: 'none' }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') pick(e); }}>
        <defs>
          <linearGradient id="tfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--c-chart)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--c-chart)" stopOpacity="0.03" />
          </linearGradient>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#c9c9cc" strokeWidth="1.2" />
          </pattern>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1="0" x2={iw} y1={PT + ih - ((t - min) / (max - min || 1)) * ih} y2={PT + ih - ((t - min) / (max - min || 1)) * ih} stroke="#e6e6e8" strokeDasharray="3 3" />
            <text x={W - 2} y={PT + ih - ((t - min) / (max - min || 1)) * ih + 4} textAnchor="end" className="ax">{fmtValue(t)}</text>
          </g>
        ))}
        <line x1="0" x2={iw} y1={PT + ih} y2={PT + ih} stroke="#e6e6e8" />
        {n > 1 && <motion.path key={`a${animKey}`} d={area} fill="url(#tfill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, delay: 0.3, ease: 'easeOut' }} />}
        {hatchLast && n > 2 && <rect x={pts[n - 2][0]} y={PT} width={iw - pts[n - 2][0]} height={ih} fill="url(#hatch)" opacity="0.9" />}
        {n > 1 && <motion.path key={`l${animKey}`} d={path} fill="none" stroke="var(--c-chart)" strokeWidth="1.6" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.08 }} />}
        {/* 数据点跟着线画到哪里出现到哪里（2026-11-27），不再在线画出来之前先跳出来 */}
        {n <= 10 && pts.map((p, i) => <motion.circle key={`${animKey}-${i}`} cx={p[0]} cy={p[1]} r="2.6" fill="#fff" stroke="var(--c-chart)" strokeWidth="1.4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, delay: 0.08 + 0.7 * (1 - Math.pow(1 - i / Math.max(1, n - 1), 0.2)) }} />)}
        {hover != null && (
          <g>
            <line x1={hx} x2={hx} y1={PT} y2={PT + ih} stroke="#8a8b91" strokeWidth="1" />
            <circle cx={hx} cy={pts[hover][1]} r="4" fill="#fff" stroke="var(--c-chart)" strokeWidth="2" />
          </g>
        )}
        {n === 1 && data[0].date ? <text x={iw / 2} y={height - 4} textAnchor="middle" className="ax">{monDayYear(data[0].date)}</text> : <>
        <text x="0" y={height - 4} className="ax">{xLabel(data[0])}</text>
        <text x={iw} y={height - 4} textAnchor="end" className="ax">{xLabel(data[n - 1])}</text></>}
      </svg>
      {hover != null && (
        <div className="tt-box" style={{ left: `${Math.min(70, Math.max(2, (hx / W) * 100 - (hx / W > 0.6 ? 26 : -3)))}%`, top: Math.max(4, pts[hover][1] + 8) }}>
          <div>{tooltipLabel ? tooltipLabel(data[hover]) : monDay(data[hover].date)}</div>
          <b>{fmtValueFull(data[hover].value, fmtValue)}</b>
        </div>
      )}
    </div>
  );
}
const fmtValueFull = (v, f) => (f === fmt ? Math.round(v).toLocaleString('en-US') : f(v));

// 柱状图（Most active times，o1g_0117：选中柱 + tooltip「12am / 914」）
export function BarChart({ values, labels, tickEvery = 4, selected, onSelect, height = 130 }) {
  const [chartRef, W] = useChartWidth(330);
  const PR = 40, ih = height - 22, iw = W - PR;
  const max = niceMax(Math.max(...values));
  const bw = iw / values.length;
  const sel = selected ?? values.indexOf(Math.max(...values));
  return (
    <div ref={chartRef} className="trend">
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height}>
        {[1, 0.75, 0.5, 0.25, 0].map((f) => (
          <g key={f}>
            <line x1="0" x2={iw} y1={ih * (1 - f) + 2} y2={ih * (1 - f) + 2} stroke="#eee" />
            <text x={W - 2} y={ih * (1 - f) + 6} textAnchor="end" className="ax">{Math.round(max * f).toLocaleString('en-US')}</text>
          </g>
        ))}
        {values.map((v, i) => (
          <motion.rect key={i} data-act={`bar-${i}`} x={i * bw + bw * 0.18} width={bw * 0.64} rx="1.5"
            initial={{ height: 0, y: ih + 2 }} animate={{ height: (v / max) * ih, y: ih + 2 - (v / max) * ih }} transition={{ duration: 0.5, delay: i * 0.012, ease: [0.23, 1, 0.32, 1] }}
            fill={i === sel ? 'var(--c-blue)' : '#c7dcf6'} onClick={() => onSelect?.(i)} style={{ cursor: 'pointer' }} />
        ))}
        {labels.map((l, i) => (i % tickEvery === 0 ? <text key={i} x={i * bw + bw / 2} y={height - 4} textAnchor="middle" className="ax">{l}</text> : null))}
      </svg>
      <div className="tt-box bar" style={{ left: `${Math.min(70, ((sel * bw + bw) / W) * 100 + 1)}%`, top: 20 }}>
        <div>{labels[sel] || ''}</div><b>{values[sel].toLocaleString('en-US')}</b>
      </div>
    </div>
  );
}

// 留存曲线 + 滑杆（v1pC_0034 / 0037：tooltip「0:02 · 26%」、左下标签「00:02 (26%)」、预览帧同步）
export function RetentionChart({ curve, value, onChange }) {
  const [chartRef, W] = useChartWidth(330);
  const H = 70, PR = 30;
  const iw = W - PR; const n = curve.length - 1;
  const x = (s) => (s / n) * iw, y = (v) => 6 + (1 - v) * (H - 12);
  const path = curve.map((v, s) => `${s ? 'L' : 'M'}${x(s).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const trackRef = useRef(null);
  const setFrom = (e) => {
    const r = trackRef.current.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    onChange(Math.round(f * n));
  };
  const cur = curve[value];
  const vx = x(value);
  return (
    <div ref={chartRef} className="retention">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        <defs><linearGradient id="rfill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--c-chart)" stopOpacity="0.22" /><stop offset="1" stopColor="var(--c-chart)" stopOpacity="0.02" /></linearGradient></defs>
        <line x1="0" x2={iw} y1={y(1)} y2={y(1)} stroke="#eee" strokeDasharray="3 3" />
        <line x1="0" x2={iw} y1={y(0.5)} y2={y(0.5)} stroke="#eee" strokeDasharray="3 3" />
        <text x={W - 2} y={y(1) + 4} textAnchor="end" className="ax">100%</text>
        <text x={W - 2} y={y(0.5) + 4} textAnchor="end" className="ax">50%</text>
        <path d={`${path}L${iw},${H}L0,${H}Z`} fill="url(#rfill)" />
        <path d={path} fill="none" stroke="var(--c-chart)" strokeWidth="1.6" />
        <line x1={vx} x2={vx} y1="0" y2={H} stroke="#8a8b91" />
        <circle cx={vx} cy={y(cur)} r="3.5" fill="#fff" stroke="var(--c-chart)" strokeWidth="1.8" />
        <text x={Math.min(vx + 6, iw - 30)} y={y(cur) - 14} className="ax dark">{secToClock(value).replace(/^0/, '')}</text>
        <text x={Math.min(vx + 6, iw - 30)} y={y(cur) - 3} className="ax dark">{Math.round(cur * 100)}%</text>
      </svg>
      <div className="ret-track" ref={trackRef} data-act="retention-scrub" style={{ width: `${(iw / W) * 100}%` }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setFrom(e); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') setFrom(e); }}>
        <div className="ret-fill" style={{ width: `${(value / n) * 100}%` }} />
        <div className="ret-knob" style={{ left: `${(value / n) * 100}%` }} />
      </div>
      <div className="ret-labels" style={{ width: `${(iw / W) * 100}%` }}>
        <span>{secToClock(value)} ({Math.round(cur * 100)}%)</span><span>{secToClock(n)}</span>
      </div>
    </div>
  );
}
