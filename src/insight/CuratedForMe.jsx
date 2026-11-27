// S1 · Curated for me (final) — Home dashboard card carousel and Create page rows.
// Ported from design_final/home_s7/project/IMU-S1-Final.dc.html (states per FIN-S1-Page).
// All content comes from the `insight` prop: { title, cards: [{ k, tip, topic, rows, bg, k_past|k_trend|k_similar }] }.
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '../store.js';
import { CURATED as CURATED_DEMO } from './demo/curated.js';
import { buildCurated } from './build.js';
// 来源短句里的数字由数据现算（7.3K、5.1K / 3.5K、1.7× 等），文案结构沿用画板
const CURATED = buildCurated(CURATED_DEMO);
import './CuratedForMe.css';
import { S1_ART } from './s1Art.js';

const EASE_OUT = [0.23, 1, 0.32, 1];

// ---- illustrations：直接用 Final 画板 IMU-S1-Final 的插画（scripts/sync_s1_art.py 生成 s1Art.js） ----
// trend 在首页卡片和 Details 抽屉用「左侧渐隐」，在 Create 页的行里用「两侧渐隐」（与画板一致）
function Illo({ card, variant = 'left' }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const raw = card.k_past ? S1_ART.past : card.k_similar ? S1_ART.similar : card.k_trend ? (variant === 'both' ? S1_ART.trendBoth : S1_ART.trendLeft) : '';
  if (!raw) return null;
  // 同页多个实例：渐变 id 加实例后缀，避免互相引用
  const html = raw.replace(/id="([^"]+)"/g, `id="$1${u}"`).replace(/url\(#([^)]+)\)/g, `url(#$1${u})`);
  return <span style={{ display: 'block', width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---- reason-row icons (filled, #57585e), keyed by the i_* flag on a row ----
const WHY_ICONS = {
  i_play: 'M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z',
  i_chat: 'M232,128A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Z',
  i_chart: 'M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16h8V136a8,8,0,0,1,8-8H72a8,8,0,0,1,8,8v64H96V88a8,8,0,0,1,8-8h32a8,8,0,0,1,8,8V200h16V40a8,8,0,0,1,8-8h40a8,8,0,0,1,8,8V200h8A8,8,0,0,1,232,208Z',
  i_trend: 'M244,56v64a12,12,0,0,1-24,0V85l-75.51,75.52a12,12,0,0,1-17,0L96,129,32.49,192.49a12,12,0,0,1-17-17l72-72a12,12,0,0,1,17,0L136,135l67-67H168a12,12,0,0,1,0-24h64A12,12,0,0,1,244,56Z',
  i_target: 'M221.87,83.16A104.1,104.1,0,1,1,195.67,49l22.67-22.68a8,8,0,0,1,11.32,11.32L167.6,99.71h0l-37.71,37.71-23.95,23.95a40,40,0,0,0,62-35.67,8,8,0,1,1,16-.9,56,56,0,0,1-95.5,42.79h0a56,56,0,0,1,73.13-84.43L184.3,60.39a87.88,87.88,0,1,0,23.13,29.67,8,8,0,0,1,14.44-6.9Z',
  i_similar: 'M64.12,147.8a4,4,0,0,1-4,4.2H16a8,8,0,0,1-7.8-6.17,8.35,8.35,0,0,1,1.62-6.93A67.79,67.79,0,0,1,37,117.51a40,40,0,1,1,66.46-35.8,3.94,3.94,0,0,1-2.27,4.18A64.08,64.08,0,0,0,64,144C64,145.28,64,146.54,64.12,147.8Zm182-8.91A67.76,67.76,0,0,0,219,117.51a40,40,0,1,0-66.46-35.8,3.94,3.94,0,0,0,2.27,4.18A64.08,64.08,0,0,1,192,144c0,1.28,0,2.54-.12,3.8a4,4,0,0,0,4,4.2H240a8,8,0,0,0,7.8-6.17A8.33,8.33,0,0,0,246.17,138.89Zm-89,43.18a48,48,0,1,0-58.37,0A72.13,72.13,0,0,0,65.07,212,8,8,0,0,0,72,224H184a8,8,0,0,0,6.93-12A72.15,72.15,0,0,0,157.19,182.07Z',
  i_bookmark: 'M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z',
};
const CHEV_DOWN = 'M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z';
const CHEV_UP = 'M216.49,168.49a12,12,0,0,1-17,0L128,97,56.49,168.49a12,12,0,0,1-17-17l80-80a12,12,0,0,1,17,0l80,80A12,12,0,0,1,216.49,168.49Z';

function Why({ rows, large }) {
  const s = large ? 18 : 16;
  return (
    <div className={`cfm-why ${large ? 'lg' : ''}`}>
      <div className="cfm-why-in">
        {(rows || []).map((w, i) => {
          const key = Object.keys(WHY_ICONS).find((k) => w[k]);
          return (
            <div key={i} className="cfm-why-row">
              <span className="cfm-why-ic">{key && <svg width={s} height={s} viewBox="0 0 256 256" fill="#57585e" aria-hidden="true"><path d={WHY_ICONS[key]} /></svg>}</span>
              <span className="cfm-why-t"><b>{w.b}</b>{w.t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Plus = () => (
  <span className="cfm-plus"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span>
);
const HeadChev = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg>
);

// ---- Details sheet (Home · tap a card) ----
function Details({ card, host, onClose, onCreate }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <>
      <div className="cfm-scrim" data-act="curated-details-scrim" onClick={onClose} />
      <div className="cfm-sheet" role="dialog" aria-modal="true" aria-label="Details">
        <div className="cfm-sheet-head">
          <span>Details</span>
          <button type="button" className="cfm-sheet-x cfm-press" aria-label="Close" data-act="curated-details-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="cfm-sheet-body">
          <div className="cfm-hero" style={{ background: card.bg }}>
            <span><span className="cfm-tip">{card.tip}</span></span>
            <span><span className="cfm-topic cfm-clamp2">{card.topic}</span></span>
            <span className="cfm-illo"><Illo card={card} /></span>
          </div>
          <Why rows={card.rows} large />
          <button type="button" className="cfm-cta-full cfm-press" data-act="curated-details-create" onClick={onCreate}><Plus />Create</button>
        </div>
      </div>
    </>,
    host,
  );
}

// only：只显示某一类卡（新账号只有 Trending now 的依据，见 Final「Home · new US account」）
export function CuratedForMe({ place = 'home', insight = CURATED, onCreate, onMore, only = '' }) {
  const data = insight || CURATED;
  const cards = (data.cards || []).filter((c) => !only || c.k === only);
  const single = cards.length === 1;
  const title = data.title || 'Curated for me';
  const [open, setOpen] = useState(-1); // Home: card whose Details sheet is open
  const [exp, setExp] = useState(-1);   // Create: row opened in place
  const reduce = useReducedMotion();
  const [page, setPage] = useState(0);  // Home: carousel position
  const [host, setHost] = useState(null);
  const ref = useRef(null);

  // A card's Create starts creating: from Home it goes to the Create tab (as "Start creating" did);
  // on the Create page it opens the media picker (as Upload does).
  const create = (card) => {
    setOpen(-1);
    if (onCreate) return onCreate(card);
    const st = useApp.getState();
    if (place === 'home') st.switchTab('create'); else st.openModal('picker', { mode: 'upload' });
  };

  if (!cards.length) return null;

  if (place !== 'home') {
    return (
      <div className="cfm cfm-create" ref={ref}>
        <div className="cfm-panel">
          <button type="button" className="cfm-head cfm-press" data-act="curated-more" onClick={() => onMore?.()}><span>{title}</span><HeadChev /></button>
          <div className="cfm-list">
            {cards.map((r, i) => {
              const open = exp === i;
              return (
                // 收起和展开是同一个容器：标题区（高 56）不动，下面的说明和 Create 从 0 高度展开，箭头转 180°；
                // 其他行跟着被平滑推下去，不再整行硬切（2026-11-26 动效精修）
                <div key={r.k || i} className={`cfm-item ${open ? 'is-open' : ''}`} style={{ background: r.bg }}>
                  <button type="button" className="cfm-row cfm-press" data-act="curated-row" aria-expanded={open} onClick={() => setExp(open ? -1 : i)}>
                    <span className="cfm-row-text"><span className="cfm-tip">{r.tip}</span><span className="cfm-topic cfm-clamp2">{r.topic}</span></span>
                    <span className="cfm-illo"><Illo card={r} variant="both" /></span>
                    <span className="cfm-row-chev"><svg width="16" height="16" viewBox="0 0 256 256" fill="#8a8b91" aria-hidden="true"><path d={CHEV_DOWN} /></svg></span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div key="body" className="cfm-exp-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, transition: { height: { duration: reduce ? 0 : 0.28, ease: EASE_OUT }, opacity: { duration: 0.2, delay: reduce ? 0 : 0.06 } } }}
                        exit={{ height: 0, opacity: 0, transition: { height: { duration: reduce ? 0 : 0.2, ease: EASE_OUT }, opacity: { duration: 0.12 } } }}>
                        <div className="cfm-exp-in">
                          <Why rows={r.rows} />
                          <button type="button" className="cfm-cta-full cfm-press" data-act="curated-create" onClick={() => create(r)}><Plus />Create</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const pick = (i) => { setHost(ref.current?.closest('.screen-root') || document.body); setOpen(i); };
  return (
    <div className={`cfm cfm-home ${single ? 'is-single' : ''}`} ref={ref}>
      <div className="cfm-panel">
        <button type="button" className="cfm-head cfm-press" data-act="curated-more" onClick={() => (onMore ? onMore() : useApp.getState().switchTab('create'))}><span>{title}</span><HeadChev /></button>
        <div className="cfm-track" onScroll={(e) => { const n = Math.max(0, Math.min(cards.length - 1, Math.round(e.currentTarget.scrollLeft / 308))); if (n !== page) setPage(n); }}>
          {cards.map((r, i) => (
            <div key={r.k || i} role="button" tabIndex={0} className="cfm-card cfm-press" style={{ background: r.bg }} data-act="curated-card"
              onClick={() => pick(i)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(i); } }}>
              <span className="cfm-card-text"><span className="cfm-tip">{r.tip}</span><span className="cfm-topic cfm-clamp2">{r.topic}</span></span>
              <span className="cfm-card-cta-wrap">
                <button type="button" className="cfm-card-cta cfm-press" data-act="curated-create" onClick={(e) => { e.stopPropagation(); create(r); }}><Plus />Create</button>
              </span>
              <span className="cfm-illo"><Illo card={r} /></span>
            </div>
          ))}
        </div>
        {!single && <div className="cfm-dots">{cards.map((r, i) => <span key={r.k || i} className={i === page ? 'on' : ''} />)}</div>}
      </div>
      {open >= 0 && host && cards[open] && <Details card={cards[open]} host={host} onClose={() => setOpen(-1)} onCreate={() => create(cards[open])} />}
    </div>
  );
}

export default CuratedForMe;
