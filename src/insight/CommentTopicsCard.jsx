// Comment topics 卡（Final：IMC-Comment-Topics）。本人作品 Engagement 与他人作品 Analysis › Post 共用。
// 标题行（Comment topics + AI 星形 + ⓘ）→ 话题行（序号 / 话题 15/20 / N comments / ›，0.5px 分隔线）；
// 评论不够时一行灰字；ⓘ 打开 About comment topics（Topics / Comment counts）。
// 话题与计数来自 build.js 的 commentTopics，和模块 D、S1 卡同一份。
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store.js';
import { commentTopics } from './build.js';
import { fmt } from '../data/agg.js';
import { CARD_STYLE, CardHead } from './CardParts.jsx';
import { useEntering } from './entrance.js';
import './ModuleD.css';

const INFO = [
  { t: 'Topics', line: 'Comments grouped by what viewers ask or say most. They update as new comments come in.', d: 'M4 6.5h16M4 12h10M4 17.5h13' },
  { t: 'Comment counts', line: 'How many comments fall into each topic. Tap a topic to read them.', d: 'M5 5.5h14v10H11l-4.5 3.5v-3.5H5z' },
];

function InfoSheet({ host, onClose }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [onClose]);
  return createPortal(
    <>
      <div className="imd-scrim" data-act="topics-info-scrim" onClick={onClose} />
      <div className="imd-sheet" role="dialog" aria-modal="true" aria-label="About comment topics">
        <div className="imd-sheet-head">
          <span style={{ fontSize: 17, lineHeight: '22px' }}>About comment topics</span>
          <button type="button" className="imd-sheet-x imd-press" aria-label="Close" data-act="topics-info-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="imd-sheet-body">
          {INFO.map((it) => (
            <div key={it.t} className="imd-item">
              <span className="imd-item-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={it.d} /></svg></span>
              <div className="imd-item-text"><b>{it.t}</b><span>{it.line}</span></div>
            </div>
          ))}
        </div>
      </div>
    </>,
    host,
  );
}

const MUTED = { margin: 0, fontSize: 15, lineHeight: '22px', color: '#8a8b91' };

export function CommentTopicsCard({ seed, comments, onOpen }) {
  const allowed = useApp((s) => s.commentInsightsOn);
  const topics = commentTopics(seed, comments);
  const ref = useRef(null);
  const entering = useEntering(600);
  const [host, setHost] = useState(null);
  return (
    <div style={{ padding: '8px 8px 0' }}>
      <div ref={ref} className={entering ? 'enter-card' : undefined} style={CARD_STYLE} data-insight="comment-topics">
        <CardHead title="Comment topics" infoLabel="About comment topics" act="topics-info"
          onInfo={() => setHost(ref.current?.closest('.screen-root') || document.body)} />
        {!allowed ? (
          <p style={MUTED}>Comment insights are turned off. You can turn them on in Settings and privacy › Privacy › Comments.</p>
        ) : !topics ? (
          <p style={MUTED}>Topic summaries appear when a post has enough comments.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {topics.map(([t, k, c], i) => (
              <button key={t} type="button" className="imd-press" data-act="comment-topic" onClick={() => onOpen(k, t)}
                style={{ appearance: 'none', border: 0, margin: 0, padding: 0, background: 'transparent', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, minHeight: 40, borderTop: i === 0 ? 0 : '0.5px solid #e8e8ea' }}>
                <span style={{ flex: 'none', width: 16, fontSize: 13, lineHeight: '18px', color: '#8a8b91', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, lineHeight: '20px', color: '#161823' }}>{t}</span>
                <span style={{ flex: 'none', fontSize: 13, lineHeight: '18px', color: '#8a8b91', fontVariantNumeric: 'tabular-nums' }}>{fmt(c)} comments</span>
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}><path d="M9 6l6 6-6 6" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ))}
          </div>
        )}
      </div>
      {host && <InfoSheet host={host} onClose={() => setHost(null)} />}
    </div>
  );
}

export default CommentTopicsCard;
