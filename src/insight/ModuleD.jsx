// S7 · another creator's post › Analysis › Post — module D "Key metrics vs yours" (blue).
// Ported from design_final/home_s7/project/IMS7-Key-Blue.dc.html. All content comes from the `insight` prop.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store.js';
import { MODULE_D } from './demo/moduleD.js';
import './ModuleD.css';
import { AskRow } from './AskAssistant.jsx';
import { CardHead, KeyBlock } from './CardParts.jsx';
import { useEntering } from './entrance.js';
import { inspoTakeaways, INSPO_TITLE } from './inspoTakeaways.js';

function InfoDrawer({ info, host, onClose }) {
  // Header divider only after the body scrolls (same rule as SheetFrame's is-scrolled)
  const [scrolled, setScrolled] = useState(false);
  const onBodyScroll = (e) => { const s = e.currentTarget.scrollTop > 0; if (s !== scrolled) setScrolled(s); };
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [onClose]);
  return createPortal(
    <>
      <div className="imd-scrim" data-act="insight-d-info-scrim" onClick={onClose} />
      <div className={`imd-sheet${scrolled ? ' is-scrolled' : ''}`} role="dialog" aria-modal="true" aria-label="About this comparison">
        <div className="imd-sheet-head">
          <span>About this comparison</span>
          <button type="button" className="imd-sheet-x imd-press" aria-label="Close" data-act="insight-d-info-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="imd-sheet-body" onScroll={onBodyScroll}>
          {(info || []).map((it, i) => (
            <div key={i} className="imd-item">
              <span className="imd-item-ic">
                {it.i_play && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.5 5.5v13l10.5-6.5z" /></svg>}
                {it.i_ai && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 4 1.8 4.7 4.7 1.8-4.7 1.8L12 17l-1.8-4.7-4.7-1.8 4.7-1.8z" /></svg>}
                {it.i_shield && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3.5 5 6.2v5.3c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6.2z" /></svg>}
                {it.i_info && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.2M12 7.8v.2" /></svg>}
                {it.i_clock && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>}
                {it.i_people && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 6.2a3 3 0 0 1 0 5.6M17 14.3c2 .6 3.2 2.2 3.5 4.7" /></svg>}
              </span>
              <div className="imd-item-text">
                <b>{it.t}</b>
                {(it.lines || []).map((ln, j) => <span key={j}>{ln}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    host,
  );
}

// Double-bar comparison rows (2026-11-28): one label per metric, then two lines — label + value over a bar — for the two
// things being compared. Shared by "Compared with your posts" (this file) and Content summary (ModuleA RoseCard, bars
// presentation), so both cards are one component with one stylesheet (ModuleD.css .imd-*).
// rows: [{ label, val, w, c, yv, yw, yc }]; labels: [first line, second line].
// onPick (optional): makes each metric a button (press feedback only, no selected state); every value stays visible.
export function CompareRows({ rows, labels, entering = false, onPick, act, className }) {
  return (
    <div className={['imd-rows', className].filter(Boolean).join(' ')}>
      {(rows || []).map((r, ri) => {
        const body = (
          <>
            <span className="imd-label">{r.label}</span>
            <span className="imd-pair">
              <span className="imd-line"><span>{labels[0]}</span><span className="imd-val">{r.val}</span></span>
              <span className="imd-track"><span className={`imd-bar${entering ? ' enter-grow-x' : ''}`} style={{ width: r.w, background: r.c, animationDelay: entering ? `${0.12 + ri * 0.06}s` : undefined }} /></span>
            </span>
            <span className="imd-pair">
              <span className="imd-line"><span>{labels[1]}</span><span className="imd-val">{r.yv}</span></span>
              <span className="imd-track"><span className={`imd-bar${entering ? ' enter-grow-x' : ''}`} style={{ width: r.yw, background: r.yc, animationDelay: entering ? `${0.15 + ri * 0.06}s` : undefined }} /></span>
            </span>
          </>
        );
        return onPick
          ? <button key={r.label} type="button" className="imd-row imd-row-btn imd-press" data-act={act ? `${act}-${ri}` : undefined}
              aria-label={`${r.label}: ${labels[0]} ${r.val}, ${labels[1]} ${r.yv}`} onClick={() => onPick(r, ri)}>{body}</button>
          : <div key={r.label} className="imd-row">{body}</div>;
      })}
    </div>
  );
}

export function ModuleD({ ca = 'row', insight = MODULE_D, onAsk }) {
  const newAccount = useApp((s) => s.newAccount);
  const market = useApp((s) => s.market);
  const entering = useEntering(1100); // 首次出现：卡片淡入，成对横条从左边依次长出（entrance.js）
  const [host, setHost] = useState(null); // the phone screen the drawer overlays
  const ref = useRef(null);
  const gid = `imdca${useId().replace(/:/g, '')}`;
  const D = insight || MODULE_D;
  const takeaways = useMemo(() => inspoTakeaways(D), [D]);
  const caRow = ca === 'row' && !(newAccount || market === 'store');
  const ask = (q) => {
    if (onAsk) return onAsk(q);
    const st = useApp.getState();
    st.closeSheet(); // the Analysis sheet sits above the tab stack; close it so the assistant is visible
    st.push('creatorAssistant', { from: 'insights', prompt: q, itemId: D.id });
  };
  const openInfo = () => setHost(ref.current?.closest('.screen-root') || document.body);
  return (
    <div className={`imd${entering ? ' enter-card' : ''}`} ref={ref}>
      {/* Final（Version 216）：标题 Compared with your posts + AI 星形 + ⓘ 一行，洞察在浅蓝块里；标题文字 Yanice 仍在三个候选里选 */}
      <CardHead title={takeaways ? INSPO_TITLE : (D.cardTitle || 'Compared with your posts')} infoLabel={takeaways ? 'About this summary' : 'About this comparison'} act="insight-d-info" onInfo={openInfo} />
      <KeyBlock k={D.key} rest={D.rest} bullets={D.bullets} next={D.next} />
      {takeaways ? (
        <div className={`imd-take${entering ? ' enter-fade' : ''}`}>
          {takeaways.map((r) => (
            <div key={r.k} className="imd-take-row"><span className="imd-take-label">{r.label}</span><span className="imd-take-t">{r.t}</span></div>
          ))}
        </div>
      ) : <CompareRows rows={D.rows} labels={['This post', 'Your typical post']} entering={entering} />}
      {caRow && (
        <AskRow act="assistant-pop-insights" seenKey="ask-D" prompts={D.ask?.prompts || ['Ask Creator Assistant']} onAsk={ask}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}><defs><linearGradient id={gid} x1="16" y1="4" x2="7" y2="20" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#4fe3e6" /><stop offset=".45" stopColor="#2f62f2" /><stop offset="1" stopColor="#1d0f8a" /></linearGradient></defs><path d="M21 8.9C20.1 6.4 17.9 5 15.2 5H9.6a7 7 0 0 0 0 14h5.6c2.7 0 4.9-1.4 5.8-3.9" fill="#fff" stroke={`url(#${gid})`} strokeWidth="3.2" /><circle cx="9.7" cy="12" r="1.55" fill="#1b1470" /><circle cx="14.3" cy="12" r="1.55" fill="#1b1470" /></svg>} />
      )}
      {host && <InfoDrawer info={D.info} host={host} onClose={() => setHost(null)} />}
    </div>
  );
}

export default ModuleD;
