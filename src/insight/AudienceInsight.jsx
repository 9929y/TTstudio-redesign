// S5 Analytics · Viewers / Followers 的一句话洞察（Final：FIN-S5-Audience-Page / IMS5-Insight）。
// Tab 下方一张小卡：标题（Viewer summary / Follower summary）+ AI 星形 + ⓘ，下面浅蓝洞察块；ⓘ 打开 About this insight。
// 没有图表，两套配色相同。数据全部来自 build.js 的 buildAudience（和 Key metrics、Most active 同一份 seed）。
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store.js';
import { buildAudience } from './build.js';
import { CARD_STYLE, CardHead, KeyBlock } from './CardParts.jsx';
import './ModuleD.css';

const ICONS = {
  people: <><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 6.2a3 3 0 0 1 0 5.6M17 14.3c2 .6 3.2 2.2 3.5 4.7" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  follow: <><circle cx="10" cy="8.5" r="3.5" /><path d="M3.5 19.5c.7-3.4 3.3-5.5 6.5-5.5 1.6 0 3 .5 4.1 1.4M18 13.5v6M15 16.5h6" /></>,
  pie: <><path d="M11 4.6a8 8 0 1 0 8.4 8.4H11z" /><path d="M14 2.6a8 8 0 0 1 7.4 7.4H14z" /></>,
};

function InfoSheet({ info, host, onClose }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [onClose]);
  return createPortal(
    <>
      <div className="imd-scrim" data-act="audience-info-scrim" onClick={onClose} />
      <div className="imd-sheet" role="dialog" aria-modal="true" aria-label="About this insight">
        <div className="imd-sheet-head">
          <span style={{ fontSize: 17, lineHeight: '22px' }}>About this insight</span>
          <button type="button" className="imd-sheet-x imd-press" aria-label="Close" data-act="audience-info-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="imd-sheet-body">
          {info.map((it) => (
            <div key={it.t} className="imd-item">
              <span className="imd-item-ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[it.ic]}</svg>
              </span>
              <div className="imd-item-text">
                <b>{it.t}</b>
                {it.lines.map((ln) => <span key={ln}>{ln}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    host,
  );
}

export function AudienceInsight({ tab }) {
  const range = useApp((s) => s.range);
  const D = useMemo(() => buildAudience(tab, range), [tab, range]);
  const ref = useRef(null);
  const [host, setHost] = useState(null);
  return (
    <div style={{ padding: '8px 8px 0' }}>
      <div ref={ref} style={CARD_STYLE} data-insight={`audience-${tab}`}>
        <CardHead title={D.cardTitle} infoLabel="About this insight" act="audience-info"
          onInfo={() => setHost(ref.current?.closest('.screen-root') || document.body)} />
        <KeyBlock k={D.key} rest={D.rest} />
      </div>
      {host && <InfoSheet info={D.info} host={host} onClose={() => setHost(null)} />}
    </div>
  );
}

export default AudienceInsight;
