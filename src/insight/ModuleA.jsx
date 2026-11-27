// 模块 A：Analytics › Overview 的洞察卡（五区玫瑰图，蓝色版）
// 设计源：design_final/analytics/project/IMO-Rose-Blue.dc.html（行内样式数值即规格，逐项照搬）
// 本文件同时导出 RoseCard —— 模块 B（半圆）用同一套标记，只换几何参数，见 ModuleB.jsx。
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { buildModuleA, askA, askB } from './build.js';
import { AskRow } from './AskAssistant.jsx';
import { CardHead, KeyBlock, CARD_STYLE } from './CardParts.jsx';
import './ModuleA.css';

const FONT = "var(--font, 'TikTok Sans', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif)";
const BTN = { appearance: 'none', border: 0, margin: 0, padding: 0, background: 'transparent', font: 'inherit', color: 'inherit', textAlign: 'inherit', cursor: 'pointer' };
const r2 = (n) => Math.round(n * 100) / 100;
// 动效（2026-11-26 精修）：选中/切换是页面里的状态变化，按 Emil 的规则用强 ease-out、220–240ms；离场更快（120–160ms）
const EASE_OUT = [0.23, 1, 0.32, 1];
const T_GROW = { duration: 0.24, ease: EASE_OUT };

// ---------- 几何（dc 脚本 renderVals 里的同名函数） ----------
function geometry(G) {
  const { CX, CY } = G;
  const P = (r, a) => [r2(CX + r * Math.cos(a * Math.PI / 180)), r2(CY + r * Math.sin(a * Math.PI / 180))];
  const arc = (r, a0, a1) => { const s = P(r, a0), e = P(r, a1); return 'M ' + s[0] + ' ' + s[1] + ' A ' + r + ' ' + r + ' 0 0 1 ' + e[0] + ' ' + e[1]; };
  const sector = (ri, ro, a0, a1) => {
    const a = P(ri, a0), b = P(ro, a0), c = P(ro, a1), d = P(ri, a1);
    return 'M ' + a[0] + ' ' + a[1] + ' L ' + b[0] + ' ' + b[1] + ' A ' + ro + ' ' + ro + ' 0 0 1 ' + c[0] + ' ' + c[1] + ' L ' + d[0] + ' ' + d[1] + ' A ' + ri + ' ' + ri + ' 0 0 0 ' + a[0] + ' ' + a[1] + ' Z';
  };
  return { P, arc, sector };
}

// 模块 A：整圆，从 12 点起顺时针，每区 360/n 度；标签贴在各区外沿
export const GEO_FULL = {
  CX: 172.5, CY: 126, H: 258, RI: 54, RO: 86,
  span: (i, n, gap) => { const step = 360 / n; return [-90 + step * i + gap, -90 + step * (i + 1) - gap]; },
  // Final：名称行在上、分数在名称文字正下方居中；块挨着扇区外沿、按块中心对齐锚点；选中的扇区外扩 1.1 倍，标签跟着外移
  labelAt: (i, n, G, P, on) => {
    const step = 360 / n, r = on ? G.RO * 1.1 + 6 : G.RO + 4;
    const m = -90 + step * i + step / 2, q = P(r, m), c = Math.cos(m * Math.PI / 180);
    if (Math.abs(c) < 0.2) return { left: (q[0] - 60) + 'px', width: '120px', top: q[1] + 'px', tf: 'none', items: 'center' };
    if (c > 0) return { left: q[0] + 'px', width: (2 * G.CX - q[0]) + 'px', top: q[1] + 'px', tf: 'translateY(-50%)', items: 'flex-start' };
    return { left: '0px', width: q[0] + 'px', top: q[1] + 'px', tf: 'translateY(-50%)', items: 'flex-end' };
  },
  firstSep: true,
  labelValue: (x) => x.you,
  centerTop: 126, centerTf: 'translateY(-50%)', centerFont: 48, centerLine: 52, centerPad: '8px',
};

// ---------- 图标（dc 抽屉里的 10 个，20×20 描边 1.8） ----------
const DRAWER_ICONS = {
  star: <path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" />,
  play: <path d="M7.5 5.5v13l10.5-6.5z" />,
  heart: <path d="M12 19.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z" />,
  comment: <path d="M4.5 12a7.5 7 0 1 1 3.6 6l-3.6 1.2 1-3.2A7 7 0 0 1 4.5 12z" />,
  share: <path d="M13.5 5.5 20 11.5l-6.5 6v-3.6c-4.5 0-7.4 1.4-9.5 4.6.6-5.1 3.3-8.6 9.5-9.4z" />,
  people: <><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 6.2a3 3 0 0 1 0 5.6M17 14.3c2 .6 3.2 2.2 3.5 4.7" /></>,
  dollar: <path d="M15.5 8c-.5-1.2-1.8-2-3.5-2-2 0-3.5 1-3.5 2.6s1.4 2.2 3.5 2.7 3.7 1.1 3.7 2.8-1.6 2.7-3.7 2.7c-1.8 0-3.2-.8-3.8-2.1M12 4v16" />,
  plus: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8.5v7M8.5 12h7" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.2M12 7.8v.2" /></>,
  insights: <path d="m4.5 15.5 4.5-5 3.5 3 7-7.5M14.5 6h5v5" />,
};
const DrawerIcon = ({ name }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {DRAWER_ICONS[name] || DRAWER_ICONS.insights}
  </svg>
);

const SparkMark = () => (
  <svg width="16" height="16" viewBox="0 0 256 256" fill="#1e7ce8" aria-hidden="true" style={{ flex: 'none' }}>
    <path d="M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z" />
  </svg>
);

function InfoButton({ label, onClick, act }) {
  return (
    <button type="button" className="rose-press" aria-label={label} data-act={act} onClick={onClick}
      style={{ ...BTN, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="#8a8b91" strokeWidth="1.6" />
        <path d="M12 11v5.5M12 7.6v.4" fill="none" stroke="#8a8b91" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ---------- ⓘ 抽屉：盖住手机屏，不是整个浏览器页 ----------
// 现成的 SheetFrame 外观不同（标题栏 44、关闭键位置、没有图标条目），所以照 dc 的做法画在屏幕容器里：
// 用 portal 挂到最近的 .screen-root（#phone-screen），absolute + z-index 600/601，与现有弹层同层级。
function InfoDrawer({ host, title, items, onClose, act }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const node = (
    <>
      <div className="rose-scrim" data-act={`${act}-drawer-scrim`} onClick={onClose}
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 600 }} />
      <div className="rose-sheet" role="dialog" aria-modal="true" aria-label={title}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#ffffff', borderRadius: '12px 12px 0px 0px', zIndex: 601, paddingBottom: 34, display: 'flex', flexDirection: 'column', fontFamily: FONT, color: '#161823', textAlign: 'left' }}>
        <div style={{ position: 'relative', height: 54, display: 'grid', placeItems: 'center', borderBottom: '0.5px solid #e8e8ea' }}>
          <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 700 }}>{title}</span>
          <button type="button" aria-label="Close" data-act={`${act}-drawer-close`} onClick={onClose}
            style={{ ...BTN, position: 'absolute', right: 6, top: 5, width: 44, height: 44, display: 'grid', placeItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px 0px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr)', columnGap: 12, alignItems: 'start' }}>
              <span style={{ display: 'flex', height: 21, alignItems: 'center' }}><DrawerIcon name={it.icon} /></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, lineHeight: '21px', fontWeight: 600, color: '#161823' }}>{it.t}</span>
                {(it.lines || []).map((ln, j) => <span key={j} style={{ fontSize: 15, lineHeight: '21px', color: '#8a8b91' }}>{ln}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
  return host ? createPortal(node, host) : node;
}

// 接口对象没带 info 时，按 dc 脚本的 infoDrawer 模板由分数展开
function fallbackInfo(D) {
  return [
    { icon: 'star', t: 'Overall score', lines: [D.total + ' out of ' + (D.max || 100), 'Previous 7 days: ' + D.prevTotal + ' · 14 days ago: ' + D.prev2Total] },
    { icon: 'insights', t: 'Compared with', lines: ['Your own previous 7 days, so you can see whether each area is getting better.'] },
    { icon: 'info', t: 'Area scores', lines: ['Each area is scored from this page’s numbers for the selected days. Tap an area to see how it moved.'] },
  ];
}
const UI_DEFAULT = { hint: 'Tap an area to see how it moved', legend: 'Previous 7 days', ask: 'Ask Creator Assistant', infoLabel: 'How this is worked out', resetLabel: 'Show overall score' };

// ---------- 卡片本体：A、B 共用 ----------
// geo = 几何参数；act = data-act 前缀（insight-a / insight-b）
export function RoseCard({ geo: G, act, ca = 'row', title, insight: D, onAsk, onSelect, askAct = 'assistant-pop-analytics' }) {
  const [tip, setTip] = useState(-1);          // 选中的区，-1 = 总分
  // 评分图联动（2026-11-26）：点扇区或标签选中；再点同一项取消；点卡片里的空白处恢复默认。
  // 选中结果通知页面（onSelect），Overview 用它让下方 Key metrics 选中对应的卡和趋势图。
  const pick = (i) => setTip((t) => (t === i ? -1 : i));
  const reduce = useReducedMotion();
  const tGrow = reduce ? { duration: 0 } : T_GROW;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    onSelectRef.current?.(tip >= 0 ? (D.areas || [])[tip]?.name : null);
  }, [tip]); // eslint-disable-line react-hooks/exhaustive-deps
  const [drawer, setDrawer] = useState(false); // ⓘ 抽屉
  const [host, setHost] = useState(null);
  const rootRef = useRef(null);
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  useEffect(() => {
    const el = rootRef.current;
    setHost((el && el.closest('.screen-root')) || document.getElementById('phone-screen') || null);
  }, []);

  const ui = { ...UI_DEFAULT, ...(D.ui || {}) };
  const areas = D.areas || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ask = useMemo(() => (D.askFor === 'B' ? askB() : askA()), [D.askFor]);
  const n = areas.length;
  const { P, arc, sector } = geometry(G);
  const rad = (v, m) => G.RI + (G.RO - G.RI) * v / (m || 100);

  const sx = tip >= 0 ? areas[tip] : null;
  const cdiff = sx ? sx.you - sx.prev : D.total - D.prevTotal;
  const cval = sx ? sx.you : D.total;
  const cmax = '/' + ((sx ? sx.max : D.max) || 100);
  const chip = (cdiff > 0 ? '↑ ' : cdiff < 0 ? '↓ ' : '') + Math.abs(cdiff);
  // Final 统一涨跌色：升蓝、降橙、持平灰（IMK-Key-Deltas）
  const chipCol = cdiff > 0 ? '#1765c4' : cdiff < 0 ? '#b4400c' : '#57585e';
  const chipBg = cdiff > 0 ? '#e5f0fc' : cdiff < 0 ? '#fdece3' : 'rgba(22, 24, 35, 0.06)';
  const hasTip = tip >= 0;

  const centerScore = (
    <>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontSize: G.centerFont, lineHeight: G.centerLine + 'px', fontWeight: 600, letterSpacing: '-0.02em', color: '#161823' }}>{cval}</span>
        <span style={{ fontSize: 13, lineHeight: '18px', color: '#6d6e73' }}>{cmax}</span>
      </span>
      <span style={{ marginTop: 2, padding: '1px 6px', borderRadius: 999, background: chipBg, fontSize: 12, lineHeight: '16px', fontWeight: 600, color: chipCol }}>{chip}</span>
    </>
  );

  return (
    <div ref={rootRef} data-insight={act} data-tip={tip}
      // 点卡片里的空白处（不是扇区、标签、ⓘ、Ask 行等按钮）恢复默认；抽屉是 portal，事件会冒泡上来，所以只认卡片自己的 DOM
      onClick={(e) => { if (tip >= 0 && rootRef.current?.contains(e.target) && !e.target.closest('button, a, [data-seg]')) setTip(-1); }}
      style={CARD_STYLE}>
      {/* Final：标题 + AI 星形 + ⓘ 一行，洞察放在浅蓝块里 */}
      <CardHead title={title || D.cardTitle} infoLabel={ui.infoLabel} act={`${act}-info`} onInfo={() => setDrawer(true)} />
      <KeyBlock k={D.key} rest={D.rest} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative', height: G.H, width: 345, maxWidth: '100%', alignSelf: 'center' }}>
          <svg width="345" height={G.H} viewBox={`0 0 345 ${G.H}`} style={{ position: 'absolute', left: 0, top: 0 }}>
            {areas.map((x, i) => {
              // Final：选中的扇区只向外长（外径 ×1.1，灰轨一起），带一层阴影；其他扇区 25%；不再整体放大
              const s = G.span(i, n, 0), on = tip === i, mx = x.max || 100;
              const RX = on ? G.RO * 1.1 : G.RO, radX = (v) => G.RI + (RX - G.RI) * v / mx;
              const op = tip < 0 || on ? 1 : 0.25;
              return (
                // 扇区本身也能点（点色块和点标签同效）；0 分也留 6% 的细弧，数字照实显示
                <g key={i} aria-hidden="true" data-seg={i} onClick={(e) => { e.stopPropagation(); pick(i); }} style={{ cursor: 'pointer' }}>
                  {/* 外扩用路径插值，从当前形状长出去，再点或切走时从当前形状缩回（可打断） */}
                  <motion.path initial={false} animate={{ d: sector(G.RI, RX, s[0], s[1]) }} transition={tGrow} fill="#f1f1f2" stroke="none" />
                  <motion.path className="rose-seg" initial={false} animate={{ d: sector(G.RI, radX(Math.max(x.you, mx * 0.06)), s[0], s[1]) }} transition={tGrow} fill={D.colors[i]} stroke="none"
                    style={{ fillOpacity: op, filter: on ? 'drop-shadow(0px 1px 3px rgba(22, 24, 35, 0.28))' : 'drop-shadow(0px 1px 3px rgba(22, 24, 35, 0))' }} />
                </g>
              );
            })}
            {/* 等宽白色分隔线压在最上层（内外缝宽一致） */}
            {areas.map((x, i) => {
              if (i === 0 && !G.firstSep) return null;
              const s = G.span(i, n, 0), a0 = P(G.RI - 2, s[0]), b0 = P(G.RO * 1.12 + 2, s[0]);
              return <path key={`sep${i}`} d={`M ${a0[0]} ${a0[1]} L ${b0[0]} ${b0[1]}`} fill="none" stroke="#ffffff" strokeWidth="3" aria-hidden="true" />;
            })}
            {/* 上期虚线：1.5px 深色，画在填充之上；离本期太近时错开 3px */}
            {sx && (() => {
              const i = tip, s = G.span(i, n, 0), mx = sx.max || 100, radX = (v) => G.RI + (G.RO * 1.1 - G.RI) * v / mx;
              const ry = radX(sx.you), rp = radX(sx.prev), r = Math.abs(rp - ry) < 3 ? ry + (sx.prev >= sx.you ? 3 : -3) : rp;
              return <motion.path key={`prev${i}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, delay: 0.1, ease: 'easeOut' }} d={arc(r, s[0] + 2, s[1] - 2)} fill="none" stroke="#161823" strokeWidth="1.5" strokeDasharray="3 2.5" strokeLinecap="round" aria-hidden="true" />;
            })()}
          </svg>
          <div style={{ position: 'absolute', left: 0, right: 0, top: G.centerTop, transform: G.centerTf, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            {/* 中央始终是同一个按钮（未选中时不可点）；数字换的时候用 2px 模糊交叉淡入，旧数字 120ms 先走 */}
            <button type="button" className="rose-center" aria-label={ui.resetLabel} aria-hidden={!hasTip} tabIndex={hasTip ? 0 : -1} data-act={`${act}-center`}
              onClick={(e) => { e.stopPropagation(); setTip(-1); }}
              style={{ ...BTN, pointerEvents: hasTip ? 'auto' : 'none', cursor: hasTip ? 'pointer' : 'default', display: 'grid', placeItems: 'center', padding: hasTip ? G.centerPad : 0 }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={tip} style={{ gridArea: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(2px)', transform: 'scale(0.97)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, filter: 'blur(2px)', transform: 'scale(0.97)', transition: { duration: 0.12, ease: 'easeIn' } }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}>
                  {centerScore}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
          {areas.map((x, i) => {
            const on = i === tip;
            const l = G.labelAt(i, n, G, P, on);
            return (
              <button key={i} type="button" className="rose-press rose-lab" aria-pressed={on} data-act={`${act}-area-${i}`}
                onClick={(e) => { e.stopPropagation(); pick(i); }}
                style={{ ...BTN, position: 'absolute', left: l.left, width: l.width, top: l.top, transform: l.tf, boxSizing: 'border-box', minHeight: 44, padding: '2px 0px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: l.items, textAlign: 'center' }}>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="rose-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, lineHeight: '18px', fontWeight: on ? 600 : 400, color: tip < 0 ? '#57585e' : (on ? '#161823' : '#6d6e73') }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: D.colors[i], opacity: tip < 0 || on ? 1 : 0.25, transition: 'opacity 200ms ease' }} />{x.name}
                  </span>
                  <span className="rose-fade" style={{ paddingLeft: 13, fontSize: 15, lineHeight: '20px', fontWeight: 600, color: tip < 0 || on ? '#161823' : '#6d6e73' }}>{G.labelValue(x)}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div>
          {/* 图例一行跟着选中长出来 / 收回去：高度 0↔24（16 + 下方 8 间距），卡片和下面的 Ask 行、Key metrics 平滑下移，不再一下跳 24px */}
          <AnimatePresence initial={false}>
            {hasTip && (
              <motion.div key="legend" style={{ overflow: 'hidden' }}
                initial={{ height: 0, opacity: 0 }} animate={{ height: 24, opacity: 1 }}
                exit={{ height: 0, opacity: 0, transition: { duration: reduce ? 0 : 0.16, ease: EASE_OUT } }}
                transition={{ duration: reduce ? 0 : 0.22, ease: EASE_OUT }}>
                <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, lineHeight: '16px', color: '#6d6e73' }}>
                    <span style={{ display: 'inline-block', width: 14, height: 0, borderTop: '1.5px dashed #161823' }} />{ui.legend}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div aria-live="polite" style={{ position: 'relative', minHeight: 36, display: 'grid', alignItems: 'start', justifyItems: 'center', textAlign: 'center', padding: '0 8px' }}>
            {/* 文字换文字不做交叉淡入（两句叠在一起会重影）：旧句 90ms 先淡出，新句再上浮进来 */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={tip} style={{ gridArea: '1 / 1' }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(4px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transition: { duration: 0.09, ease: 'easeIn' } }}
                transition={{ duration: 0.2, ease: EASE_OUT }}>
                {hasTip ? (
                  <span style={{ fontSize: 13, lineHeight: '18px', color: '#161823' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 6, verticalAlign: '1px', background: D.colors[tip] }} />
                    {/* Final 单句（2026-11-26 确认）：{维度} + 一句话；没有 sentence 的旧数据仍按原来的行显示 */}
                    <span style={{ fontWeight: 600 }}>{sx.name}</span> {sx.sentence || (sx.lines ? sx.lines[0] : sx.note)}
                    {!sx.sentence && sx.lines && sx.lines.slice(1).map((ln) => <span key={ln} style={{ display: 'block', color: '#57585e' }}>{ln}</span>)}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, lineHeight: '16px', color: '#6d6e73' }}>{ui.hint}</span>
                )}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {ca === 'row' && (
        // 入口文案跟着图走：未选中时轮播这张卡相关的问题，选中某一项后停在这一项的问题（飞书《布局与 UI 细节优化方案》C16；评分图联动 2026-11-26）
        <AskRow act={askAct} seenKey={`ask-${D.askFor || 'A'}`} prompts={ask.prompts} fixed={sx ? ask.byArea[sx.name] : null} onAsk={(q) => onAsk?.(q)}
          icon={(
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
              <defs>
                <linearGradient id={`cagr${gid}`} x1="16" y1="4" x2="7" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#4fe3e6" /><stop offset=".45" stopColor="#2f62f2" /><stop offset="1" stopColor="#1d0f8a" />
                </linearGradient>
              </defs>
              <path d="M21 8.9C20.1 6.4 17.9 5 15.2 5H9.6a7 7 0 0 0 0 14h5.6c2.7 0 4.9-1.4 5.8-3.9" fill="#fff" stroke={`url(#cagr${gid})`} strokeWidth="3.2" />
              <circle cx="9.7" cy="12" r="1.55" fill="#1b1470" /><circle cx="14.3" cy="12" r="1.55" fill="#1b1470" />
            </svg>
          )} />
      )}

      {drawer && <InfoDrawer host={host} act={act} title={D.title} items={D.info || fallbackInfo(D)} onClose={() => setDrawer(false)} />}
    </div>
  );
}

// 分数只按 7 天窗口定义：其他区间不显示 7 天样例，换成一句说明（飞书《布局与 UI 细节优化方案》第 4 节「同一数据窗口」）
export function ScoresNeedSevenDays() {
  return (
    <div data-insight="scores-7d" style={{ boxSizing: 'border-box', width: '100%', borderRadius: 8, background: '#ffffff', padding: 16, display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: FONT }}>
      <span style={{ flex: 'none', display: 'flex', height: 20, alignItems: 'center' }}><SparkMark /></span>
      <span style={{ fontSize: 14, lineHeight: '20px', color: '#57585e' }}>Area scores compare one week with the week before. Choose Last 7 days to see them.</span>
    </div>
  );
}

const A7 = buildModuleA({ key: '7' });
export function ModuleA({ ca = 'row', title, insight = A7, onAsk, onSelect }) {
  if (!insight) return <ScoresNeedSevenDays />;
  return <RoseCard geo={GEO_FULL} act="insight-a" ca={ca} title={title} insight={insight} onAsk={onAsk} onSelect={onSelect} />;
}

export default ModuleA;
