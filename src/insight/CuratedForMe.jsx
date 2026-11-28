// S1 · Curated for me (final) — Home dashboard card carousel and Create page rows.
// Ported from design_final/home_s7/project/IMU-S1-Final.dc.html (states per FIN-S1-Page).
// All content comes from the `insight` prop: { title, cards: [{ k, tip, topic, rows, k_past|k_trend|k_similar }] }.
// Card colours and illustrations come from cardArt.js (the data's old gradient `bg` is no longer used).
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '../store.js';
import { CURATED as CURATED_DEMO } from './demo/curated.js';
import { buildCurated } from './build.js';
// 来源短句里的数字由数据现算（7.3K、5.1K / 3.5K、1.7× 等），文案结构沿用画板
const CURATED = buildCurated(CURATED_DEMO);
import './CuratedForMe.css';
import { CARD_ARTS, currentArt, artKind } from './cardArt.js';

const EASE_OUT = [0.23, 1, 0.32, 1];

// ---- illustrations：三套扁平方案，见 cardArt.js（CARD_ART 常量，或地址里 ?art=B / #art=C） ----
// 插画完整画在卡片内（右侧留 12 的边距），不出血、不被裁；卡底同样用方案里的纯色，不再用渐变。
const VIEWBOX = { card: '-10 -23 104 128', row: '-4 -4 90 90' };
function Illo({ card, variant = 'card' }) {
  const art = CARD_ARTS[currentArt()].art[artKind(card)];
  if (!art) return null;
  return <svg width="100%" height="100%" viewBox={VIEWBOX[variant]} preserveAspectRatio="xMidYMid meet" aria-hidden="true" dangerouslySetInnerHTML={{ __html: art }} />;
}
const bgOf = (card) => CARD_ARTS[currentArt()].bg[artKind(card)] || '#f4f5f7';

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

function Why({ rows }) {
  const s = 16;
  return (
    <div className="cfm-why">
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

const HeadChev = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg>
);

// only：只显示某一类卡（新账号只有 Trending now 的依据，见 Final「Home · new US account」）
export function CuratedForMe({ place = 'home', insight = CURATED, onCreate, onMore, only = '' }) {
  const data = insight || CURATED;
  const cards = (data.cards || []).filter((c) => !only || c.k === only);
  const single = cards.length === 1;
  const title = data.title || 'Curated for me';
  const [exp, setExp] = useState(-1);   // Create: row opened in place
  const reduce = useReducedMotion();
  const [page, setPage] = useState(0);  // Home: carousel position

  // Create 直接进入选照片页（媒体选择器），首页卡片和 Create 页的行都一样（2026-11-26 按反馈）
  const create = (card) => {
    if (onCreate) return onCreate(card);
    useApp.getState().openModal('picker', { mode: 'upload' });
  };

  if (!cards.length) return null;

  if (place !== 'home') {
    return (
      <div className="cfm cfm-create">
        <div className="cfm-panel">
          {/* On Create the header is a plain title: the Home header's › leads to Create, and this already is Create (2026-11-28 QA). */}
          <div className="cfm-head"><span>{title}</span></div>
          <div className="cfm-list">
            {cards.map((r, i) => {
              const open = exp === i;
              return (
                // 收起和展开是同一个容器：标题区（高 56）不动，下面的说明和 Create 从 0 高度展开（右上角 chevron 已于 2026-11-28 去掉，点整行展开 / 收起）；
                // 其他行跟着被平滑推下去，不再整行硬切（2026-11-26 动效精修）
                <div key={r.k || i} className={`cfm-item ${open ? 'is-open' : ''}`} style={{ background: bgOf(r) }}>
                  <button type="button" className="cfm-row cfm-press" data-act="curated-row" aria-expanded={open} onClick={() => setExp(open ? -1 : i)}>
                    <span className="cfm-row-text"><span className="cfm-tip">{r.tip}</span><span className="cfm-topic cfm-clamp2">{r.topic}</span></span>
                    <span className="cfm-illo"><Illo card={r} variant="row" /></span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div key="body" className="cfm-exp-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, transition: { height: { duration: reduce ? 0 : 0.28, ease: EASE_OUT }, opacity: { duration: 0.2, delay: reduce ? 0 : 0.06 } } }}
                        exit={{ height: 0, opacity: 0, transition: { height: { duration: reduce ? 0 : 0.2, ease: EASE_OUT }, opacity: { duration: 0.12 } } }}>
                        <div className="cfm-exp-in">
                          <Why rows={r.rows} />
                          <button type="button" className="cfm-cta-full cfm-press" data-act="curated-create" onClick={() => create(r)}>Create</button>
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

  return (
    <div className={`cfm cfm-home ${single ? 'is-single' : ''}`}>
      <div className="cfm-panel">
        <button type="button" className="cfm-head cfm-press" data-act="curated-more" onClick={() => (onMore ? onMore() : useApp.getState().switchTab('create'))}><span>{title}</span><HeadChev /></button>
        <div className="cfm-track" onScroll={(e) => { const n = Math.max(0, Math.min(cards.length - 1, Math.round(e.currentTarget.scrollLeft / 308))); if (n !== page) setPage(n); }}>
          {cards.map((r, i) => (
            // 2026-11-27 Yanice 定 E1：整张卡 = Create（底部 Create 按钮只是提示）。
            // 2026-11-28：右上角 Learn more 和它打开的 Details 抽屉去掉；Create 回到 11-26 的白底 + 0.5px 描边，不带 + 号 logo。
            <div key={r.k || i} className="cfm-card" style={{ background: bgOf(r) }}>
              <button type="button" className="cfm-card-hit" data-act="curated-card" aria-label={`Create: ${r.topic}`} onClick={() => create(r)} />
              <span className="cfm-card-text"><span className="cfm-tip">{r.tip}</span><span className="cfm-topic cfm-clamp2">{r.topic}</span></span>
              <span className="cfm-card-cta-wrap">
                <span className="cfm-card-cta" data-act="curated-create" aria-hidden="true">Create</span>
              </span>
              <span className="cfm-illo"><Illo card={r} /></span>
            </div>
          ))}
        </div>
        {!single && <div className="cfm-dots">{cards.map((r, i) => <span key={r.k || i} className={i === page ? 'on' : ''} />)}</div>}
      </div>
    </div>
  );
}

export default CuratedForMe;
