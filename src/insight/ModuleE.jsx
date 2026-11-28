// Module E — S6 My post › Video analysis › Overview: five areas against "Your typical post".
// Ported from design_final/post_topic/project/IMS6-Key-Blue.dc.html (inline style values are the spec).
// All content comes from the `insight` prop (default: demo/moduleE.js).
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import demo from './demo/moduleE.js';
import './ModuleE.css';
import { AskRow } from './AskAssistant.jsx';
import { placeLabel, LAB_GAP } from './labelFit.js';
import { CardHead, KeyBlock, CARD_STYLE, AiStar } from './CardParts.jsx';
import { useEntering, segIn, labDelay, isMouse } from './entrance.js';
// 刻度线样式（2026-11-27 方案比较）：'gap' = 白色切缝；'tone' = 同色系加深（色块里用加深一档的蓝，灰底轨上用浅灰）
// 2026-11-27 夜 Yanice：「那三条白线不要了」——刻度线整体关掉（保留代码，改回 true 即恢复）
const SHOW_TIERS = false;
const TIER_STYLE = 'gap';
const shade = (hex, k = 0.72) => '#' + [1, 3, 5].map((j) => Math.round(parseInt(hex.slice(j, j + 2), 16) * k).toString(16).padStart(2, '0')).join('');

export const IM_FONT = "'TikTok Sans', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";
export const IM_BTN = { appearance: 'none', border: 0, margin: 0, padding: 0, background: 'transparent', font: 'inherit', color: 'inherit', textAlign: 'inherit', cursor: 'pointer' };

// AI mark beside the insight sentence
export const AiMark = () => <AiStar />;

export function InfoButton({ label, onClick, act }) {
  return (
    <button type="button" className="ime-press" aria-label={label} data-act={act} onClick={onClick}
      style={{ ...IM_BTN, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#8a8b91" strokeWidth="1.6" /><path d="M12 11v5.5M12 7.6v.4" fill="none" stroke="#8a8b91" strokeWidth="1.8" strokeLinecap="round" /></svg>
    </button>
  );
}

// Drawer row icons (20px, 1.8 stroke) — the union of the sets in the two dc files
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
  flame: <path d="M12 21c-3.6 0-6.5-2.6-6.5-6.2 0-3 2-4.9 3.4-6.4.3 1.4 1.1 2.4 2.1 2.9.2-2.8 1.6-5.3 3.9-7.3-.2 2.6.9 4.2 2.1 5.7 1 1.3 1.5 2.8 1.5 4.4 0 4-3 6.9-6.5 6.9z" />,
};

// ⓘ drawer. Rendered into the phone screen (#phone-screen) so it overlays the phone, not the browser page.
// items: [{ ic, t, lines: [] }]
export function InsightDrawer({ title, items, onClose }) {
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const host = typeof document !== 'undefined' ? (document.getElementById('phone-screen') || document.body) : null;
  if (!host) return null;
  return createPortal(
    <>
      <div className="ime-scrim" data-act="sheet-scrim-close" onClick={onClose} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 600 }} />
      <div className="ime-sheet" role="dialog" aria-modal="true" aria-label={title}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#ffffff', borderRadius: '12px 12px 0px 0px', zIndex: 601, paddingBottom: 34, display: 'flex', flexDirection: 'column', fontFamily: IM_FONT, color: '#161823' }}>
        <div style={{ position: 'relative', height: 54, display: 'grid', placeItems: 'center', borderBottom: '0.5px solid #e8e8ea' }}>
          <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 700 }}>{title}</span>
          <button type="button" aria-label="Close" data-act="sheet-close" onClick={onClose}
            style={{ ...IM_BTN, position: 'absolute', right: 6, top: 5, width: 44, height: 44, display: 'grid', placeItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px 0px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr)', columnGap: 12, alignItems: 'start' }}>
              <span style={{ display: 'flex', height: 21, alignItems: 'center' }}>
                {DRAWER_ICONS[it.ic] && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{DRAWER_ICONS[it.ic]}</svg>}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, lineHeight: '21px', fontWeight: 600, color: '#161823' }}>{it.t}</span>
                {(it.lines || []).map((ln, j) => <span key={j} style={{ fontSize: 15, lineHeight: '21px', color: '#8a8b91' }}>{ln}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    host,
  );
}

// ---- rose geometry (345 × 258 canvas, centre 172.5 / 126, inner radius 54, outer 86) ----
const CX = 172.5, CY = 126, RI = 54, RO = 86;
const r2 = (n) => Math.round(n * 100) / 100;
const P = (r, a) => [r2(CX + r * Math.cos(a * Math.PI / 180)), r2(CY + r * Math.sin(a * Math.PI / 180))];
const arc = (r, a0, a1) => { const s = P(r, a0), e = P(r, a1); return `M ${s[0]} ${s[1]} A ${r} ${r} 0 0 1 ${e[0]} ${e[1]}`; };
const sector = (ri, ro, a0, a1) => {
  const a = P(ri, a0), b = P(ro, a0), c = P(ro, a1), d = P(ri, a1);
  return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} A ${ro} ${ro} 0 0 1 ${c[0]} ${c[1]} L ${d[0]} ${d[1]} A ${ri} ${ri} 0 0 0 ${a[0]} ${a[1]} Z`;
};
const rad = (v, max) => RI + (RO - RI) * v / max;
// Final：块按中心对锚点；名称行在上、分数在名称文字正下方居中；选中的扇区外扩 1.1 倍，标签跟着外移
// 与模块 A 同一套标签规则（labelFit.js）：离圆环外沿固定 12pt，选中外扩时同步外移，放不下就沿圆弧滑
function labelAt(i, r, step, name) {
  const l = placeLabel(-90 + step * i + step / 2, r, CX, CY, 2 * CX, name);
  return { left: l.left, width: l.width, top: l.top, transform: 'translateY(-50%)', alignItems: l.align };
}

function CaLogo({ size, id }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
      <defs><linearGradient id={id} x1="16" y1="4" x2="7" y2="20" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#4fe3e6" /><stop offset=".45" stopColor="#2f62f2" /><stop offset="1" stopColor="#1d0f8a" /></linearGradient></defs>
      <path d="M21 8.9C20.1 6.4 17.9 5 15.2 5H9.6a7 7 0 0 0 0 14h5.6c2.7 0 4.9-1.4 5.8-3.9" fill="#fff" stroke={`url(#${id})`} strokeWidth="3.2" />
      <circle cx="9.7" cy="12" r="1.55" fill="#1b1470" /><circle cx="14.3" cy="12" r="1.55" fill="#1b1470" />
    </svg>
  );
}

export function ModuleE({ ca = 'row', insight = demo, onAsk, askAct = 'assistant-pop-post' }) {
  const D = insight || demo;
  const ui = D.ui || {};
  const areas = D.areas || [];
  const colors = D.colors || [];
  const [tipState, setTip] = useState(-1);
  // 与 Overview / Content 的评分图同一套点选规则：再点同一项取消，点卡片空白处恢复默认（2026-11-26）
  const pick = (i) => setTip((t) => (t === i ? -1 : i));
  const rootRef = useRef(null);
  // 动效与 Overview / Content 的评分图一致（2026-11-26 精修）
  const reduce = useReducedMotion();
  const EASE_OUT = [0.23, 1, 0.32, 1];
  const tGrow = reduce ? { duration: 0 } : { duration: 0.24, ease: EASE_OUT };
  const entering = useEntering(1100); // 首次出现：卡片淡入、扇区从内圈依次长出（entrance.js）
  const [hov, setHov] = useState(-1);  // 鼠标悬停预览
  const [drawer, setDrawer] = useState('');
  const gid = `ime-ca-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const tip = tipState >= 0 && tipState < areas.length ? tipState : -1;
  const hasTip = tip >= 0;
  const step = 360 / Math.max(1, areas.length);

  const sx = hasTip ? areas[tip] : null;
  const cdiff = sx ? sx.you - sx.prev : D.total - D.prevTotal;
  const cval = sx ? sx.you : D.total;
  const cmax = `/${(sx ? sx.max : D.max) || 100}`;
  const chip = `${cdiff > 0 ? '↑ ' : cdiff < 0 ? '↓ ' : ''}${Math.abs(cdiff)}`;
  // Final 统一涨跌色：升蓝、降橙、持平灰（IMK-Key-Deltas）
  const chipCol = cdiff > 0 ? '#1765c4' : cdiff < 0 ? '#b4400c' : '#57585e';
  const chipBg = cdiff > 0 ? '#e5f0fc' : cdiff < 0 ? '#fdece3' : 'rgba(22, 24, 35, 0.06)';

  const infoItems = [{ ic: 'star', t: 'Overall score', lines: [`${D.total} out of ${D.max || 100}`, `${ui.baseline || 'Your typical post'}: ${D.prevTotal}`] }].concat(ui.info || []);

  const centre = (
    <>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontSize: 34, lineHeight: '38px', fontWeight: 600, letterSpacing: '-0.02em', color: '#161823' }}>{cval}</span>
        <span style={{ fontSize: 13, lineHeight: '18px', color: '#6d6e73' }}>{cmax}</span>
      </span>
      <span style={{ marginTop: 2, padding: '1px 6px', borderRadius: 999, background: chipBg, fontSize: 12, lineHeight: '16px', fontWeight: 600, color: chipCol, whiteSpace: 'nowrap' }}>{chip}</span>
    </>
  );

  return (
    <div ref={rootRef} data-insight="E" data-tip={tip} className={entering ? 'enter-card' : undefined} style={CARD_STYLE}
      onClick={(e) => { if (tip >= 0 && rootRef.current?.contains(e.target) && !e.target.closest('button, a, [data-seg]')) setTip(-1); }}>
      {/* Final：标题 Post summary + AI 星形 + ⓘ，洞察在浅蓝块里 */}
      <CardHead title={D.cardTitle || 'Post summary'} infoLabel={ui.infoLabel || 'How this is worked out'} act="insight-e-info" onInfo={() => setDrawer('info')} />
      <KeyBlock k={D.key} rest={D.rest} bullets={D.bullets} next={D.next} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative', height: 258 }}>
          <svg width="345" height="258" viewBox="0 0 345 258" aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0 }}>
            {areas.map((x, i) => {
              const a0 = -90 + step * i, a1 = -90 + step * (i + 1), max = x.max || 100, on = tip === i;
              const RX = on ? RO * 1.1 : RO, radX = (v) => RI + (RX - RI) * v / max;
              return (
                <g key={i} data-seg={i} onClick={(e) => { e.stopPropagation(); pick(i); }} style={{ cursor: 'pointer' }}
                  onPointerEnter={(e) => isMouse(e) && setHov(i)} onPointerLeave={() => setHov(-1)}>
                  <motion.path initial={entering ? { d: sector(RI, RI + 0.5, a0, a1) } : false} animate={{ d: sector(RI, RX, a0, a1) }} transition={entering ? segIn(i) : tGrow} fill="#f1f1f2" stroke="none" />
                  <motion.path className="ime-seg" initial={entering ? { d: sector(RI, RI + 0.5, a0, a1) } : false} animate={{ d: sector(RI, radX(Math.max(x.you, max * 0.06)), a0, a1) }} transition={entering ? segIn(i, 0.04) : tGrow} fill={colors[i]} stroke="none"
                    style={{ fillOpacity: !hasTip ? (hov >= 0 && hov !== i ? 0.55 : 1) : on ? 1 : hov === i ? 0.45 : 0.25, filter: on ? 'drop-shadow(0px 1px 3px rgba(22, 24, 35, 0.28))' : 'drop-shadow(0px 1px 3px rgba(22, 24, 35, 0))' }} />
                  {/* 刻度（2026-11-27 Yanice）：只画里面两条（1/3、2/3），不画最外圈；画在色块上面，白色晕边 + 深色细线，深蓝、浅蓝、灰底上都看得见；跟着扇区外扩 */}
                  {/* 2026-11-27 夜 Yanice：选中的那一块不画刻度线，只留前 7 天的虚线 */}
                  {SHOW_TIERS && !on && [1 / 3, 2 / 3].map((t) => {
                    const inFill = t * max <= x.you;
                    const stroke = TIER_STYLE === 'gap' ? '#ffffff' : inFill ? shade(colors[i]) : '#cfcfd4';
                    return <motion.path key={t} initial={entering ? { d: arc(RI + 0.5, a0 + 1.5, a1 - 1.5) } : false} animate={{ d: arc(RI + (RX - RI) * t, a0 + 1.5, a1 - 1.5) }} transition={entering ? segIn(i) : tGrow} fill="none" stroke={stroke} strokeWidth={TIER_STYLE === 'gap' ? 1 : 1} pointerEvents="none" />;
                  })}
                </g>
              );
            })}
            {areas.map((x, i) => { const a0 = -90 + step * i, p0 = P(RI - 2, a0), p1 = P(RO * 1.12 + 2, a0); return <path key={`sep${i}`} d={`M ${p0[0]} ${p0[1]} L ${p1[0]} ${p1[1]}`} fill="none" stroke="#ffffff" strokeWidth="3" />; })}
            {sx && (() => {
              const a0 = -90 + step * tip, a1 = a0 + step, max = sx.max || 100, radX = (v) => RI + (RO * 1.1 - RI) * v / max;
              const ry = radX(sx.you), rp = radX(sx.prev), r = Math.abs(rp - ry) < 3 ? ry + (sx.prev >= sx.you ? 3 : -3) : rp;
              return <motion.path key={`prev${tip}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, delay: 0.1, ease: 'easeOut' }} d={arc(r, a0 + 2, a1 - 2)} fill="none" stroke="#161823" strokeWidth="1.5" strokeDasharray="3 2.5" strokeLinecap="round" />;
            })()}
          </svg>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 126, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <button type="button" className={`ime-center${entering ? ' enter-center' : ''}`} aria-label="Show overall score" aria-hidden={!hasTip} tabIndex={hasTip ? 0 : -1} data-act="insight-e-reset"
              onClick={(e) => { e.stopPropagation(); setTip(-1); }}
              style={{ ...IM_BTN, pointerEvents: hasTip ? 'auto' : 'none', cursor: hasTip ? 'pointer' : 'default', display: 'grid', placeItems: 'center', padding: hasTip ? 8 : 0, animationDelay: entering ? '0.2s' : undefined }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={tip} style={{ gridArea: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(2px)', transform: 'scale(0.97)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, filter: 'blur(2px)', transform: 'scale(0.97)', transition: { duration: 0.12, ease: 'easeIn' } }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}>
                  {centre}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
          {areas.map((x, i) => {
            const on = i === tip, pos = labelAt(i, (on ? RO * 1.1 : RO) + LAB_GAP, step, x.name);
            return (
              <button key={i} type="button" className={`ime-press ime-lab${entering ? ' enter-fade' : ''}`} aria-pressed={on} data-act={`insight-e-area-${i}`}
                onClick={(e) => { e.stopPropagation(); pick(i); }}
                onPointerEnter={(e) => isMouse(e) && setHov(i)} onPointerLeave={() => setHov(-1)}
                style={{ ...IM_BTN, animationDelay: entering ? labDelay(i) : undefined, position: 'absolute', left: pos.left, width: pos.width, top: pos.top, transform: pos.transform, boxSizing: 'border-box', minHeight: 44, padding: '2px 0px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: pos.alignItems, textAlign: 'center' }}>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="ime-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, lineHeight: '18px', fontWeight: 400, whiteSpace: 'nowrap', color: !hasTip ? '#57585e' : (on ? '#161823' : '#6d6e73') }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[i], opacity: !hasTip ? (hov >= 0 && hov !== i ? 0.55 : 1) : on ? 1 : hov === i ? 0.45 : 0.25, transition: 'opacity 200ms ease' }} />{x.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div>
          <AnimatePresence initial={false}>
            {hasTip && (
              <motion.div key="legend" style={{ overflow: 'hidden' }}
                initial={{ height: 0, opacity: 0 }} animate={{ height: 24, opacity: 1 }}
                exit={{ height: 0, opacity: 0, transition: { duration: reduce ? 0 : 0.16, ease: EASE_OUT } }}
                transition={{ duration: reduce ? 0 : 0.22, ease: EASE_OUT }}>
                <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, lineHeight: '16px', color: '#6d6e73' }}>
                    <span style={{ display: 'inline-block', width: 14, height: 0, borderTop: '1.5px dashed #161823' }} />{ui.baseline || 'Your typical post'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* V1（2026-11-27 Yanice 定）：默认不再显示「Tap an area…」提示；说明句只在选中时带高度动画出现 */}
          <AnimatePresence initial={false}>
          {hasTip && (
          <motion.div key="note" style={{ overflow: 'hidden' }}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: reduce ? 0 : 0.16, ease: EASE_OUT } }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE_OUT }}>
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
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 6, verticalAlign: 1, background: colors[tip] }} />
                    {/* Final 单句（2026-11-26 确认）：{维度} + 一句话；没有 sentence 的旧数据仍按原来的行显示 */}
                    <span style={{ fontWeight: 400, color: '#161823' }}>{sx.name}</span> {sx.sentence || (sx.lines ? sx.lines[0] : sx.note)}
                    {!sx.sentence && sx.lines && sx.lines.slice(1).map((ln) => <span key={ln} style={{ display: 'block', color: '#57585e' }}>{ln}</span>)}
                  </span>
                ) : null}
              </motion.span>
            </AnimatePresence>
          </div>
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {ca === 'row' && (
        <AskRow act={askAct} seenKey="ask-E" prompts={D.ask?.prompts || [ui.ask || 'Ask Creator Assistant']} fixed={sx && D.ask ? D.ask.byArea[sx.name] : null}
          onAsk={(q) => onAsk?.(q)} icon={<CaLogo size={22} id={gid} />} />
      )}

      {drawer === 'info' && <InsightDrawer title={D.title} items={infoItems} onClose={() => setDrawer('')} />}
    </div>
  );
}

export default ModuleE;
