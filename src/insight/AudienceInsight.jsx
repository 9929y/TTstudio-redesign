// S5 Analytics · Viewers / Followers 的一句话洞察（Final：FIN-S5-Audience-Page / IMS5-Insight）。
// Tab 下方一张小卡：标题（Viewer summary / Follower summary）+ AI 星形 + ⓘ，下面浅蓝洞察块；ⓘ 打开 About this insight。
// 没有图表，两套配色相同。数据全部来自 build.js 的 buildAudience（和 Key metrics、Most active 同一份 seed）。
// 2026-11-27：卡片底部加「Ask Creator Assistant」行，和 Performance / Content summary（模块 A/B）、模块 D 用同一个 AskRow，
// 间距、分隔线、机器人图标都一样（卡片 gap 12 → 0.5px 分隔线 → 44 高的行，行底 -8 抵掉一半卡片内边距）。
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../store.js';
import { followerKpis } from '../data/agg.js';
import { buildAudience } from './build.js';
import { AskRow } from './AskAssistant.jsx';
import { CARD_STYLE, CardHead, KeyBlock } from './CardParts.jsx';
import { useEntering } from './entrance.js';
import './ModuleD.css';

const ICONS = {
  people: <><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 6.2a3 3 0 0 1 0 5.6M17 14.3c2 .6 3.2 2.2 3.5 4.7" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  ai: <path d="m12 4 1.8 4.7 4.7 1.8-4.7 1.8L12 17l-1.8-4.7-4.7-1.8 4.7-1.8z" />,
  shield: <path d="M12 3.5 5 6.2v5.3c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6.2z" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.2M12 7.8v.2" /></>,
  follow: <><circle cx="10" cy="8.5" r="3.5" /><path d="M3.5 19.5c.7-3.4 3.3-5.5 6.5-5.5 1.6 0 3 .5 4.1 1.4M18 13.5v6M15 16.5h6" /></>,
  pie: <><path d="M11 4.6a8 8 0 1 0 8.4 8.4H11z" /><path d="M14 2.6a8 8 0 0 1 7.4 7.4H14z" /></>,
};

// Ask 行轮播的问题（2026-11-27）：创作者自己会问的话，点名这个账号的作品和话题；每条在同页或账号数据里都答得出来——
// 9 成观众是新来的、最活跃的时段（Most active times）、Kyoto at dusk 本周拿了一半播放且 9 成观众是新来的、
// 草稿里正好有「Kyoto at dusk, part 2」和「Amalfi on a budget」两条（Kyoto 播放多，Amalfi 带来的关注约是 Kyoto 的 6 倍）、
// Creators your viewers also watched。每条控制在一行内（393pt 下文字区 289px，最长一条 286px）。
const ASK_VIEWERS = [
  'How can more people find you in search?', // 2026-11-28 copy pass 2: follows the summary (few found you through search)
  'How can you get new viewers to follow you?',
  'Who are your new viewers?', // 2026-11-28 QA: the old Kyoto question contradicted the summary (Kyoto isn't in these numbers yet)
  'When should I post Kyoto Part 2?',
  'What else do your viewers watch?',
];
// Followers 第一条跟着卡片结论变（少了 / 多了 / 掉粉 / 持平），和结论句用同一份 followerKpis（delta = 和上一段同长时间相比）
function askFollowers(range) {
  const [, net] = followerKpis(range);
  const first = net.value < 0 ? 'Why did I lose followers?'
    : net.delta < 0 ? 'Why did I gain fewer followers?'
      : net.delta > 0 ? 'What brought you more followers?'
        : 'How can I gain more followers?';
  return [first, 'What do your followers want to see next?', 'Should I post more Kyoto or Amalfi?', 'When should you post for your followers?'];
}

function InfoSheet({ info, host, onClose }) {
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
      <div className="imd-scrim" data-act="audience-info-scrim" onClick={onClose} />
      <div className={`imd-sheet${scrolled ? ' is-scrolled' : ''}`} role="dialog" aria-modal="true" aria-label="About this insight">
        <div className="imd-sheet-head">
          <span style={{ fontSize: 17, lineHeight: '22px' }}>About this insight</span>
          <button type="button" className="imd-sheet-x imd-press" aria-label="Close" data-act="audience-info-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="imd-sheet-body" onScroll={onBodyScroll}>
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

export function AudienceInsight({ tab, onAsk }) {
  const range = useApp((s) => s.range);
  const newAccount = useApp((s) => s.newAccount);
  const market = useApp((s) => s.market);
  const push = useApp((s) => s.push);
  const D = useMemo(() => buildAudience(tab, range), [tab, range]);
  const prompts = useMemo(() => (tab === 'viewers' ? ASK_VIEWERS : askFollowers(range)), [tab, range]);
  const ref = useRef(null);
  const entering = useEntering(600);
  const [host, setHost] = useState(null);
  const gid = `audca${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  // 没有 Creator Assistant 的账号不出 Ask 行，规则同 Performance summary（Analytics.jsx）和模块 D（美国区需 10K+ 粉）
  const caRow = !(newAccount || market === 'store');
  // 打开 Creator Assistant：和 Analytics.jsx 给模块 A/B 的 onAsk 一样 push，来源记成 viewers / followers
  const ask = (q) => (onAsk ? onAsk(q) : push('creatorAssistant', { from: tab, prompt: q }));
  return (
    <div style={{ padding: '8px 8px 0' }}>
      <div ref={ref} className={entering ? 'enter-card' : undefined} style={CARD_STYLE} data-insight={`audience-${tab}`}>
        <CardHead title={D.cardTitle} infoLabel="About this insight" act="audience-info"
          onInfo={() => setHost(ref.current?.closest('.screen-root') || document.body)} />
        <KeyBlock k={D.key} rest={D.rest} bullets={D.bullets} next={D.next} allowBullets />
        {caRow && (
          <AskRow act={`insight-${tab}-ask`} seenKey={`ask-audience-${tab}`} prompts={prompts} onAsk={ask}
            icon={(
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
                <defs>
                  <linearGradient id={gid} x1="16" y1="4" x2="7" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#4fe3e6" /><stop offset=".45" stopColor="#2f62f2" /><stop offset="1" stopColor="#1d0f8a" />
                  </linearGradient>
                </defs>
                <path d="M21 8.9C20.1 6.4 17.9 5 15.2 5H9.6a7 7 0 0 0 0 14h5.6c2.7 0 4.9-1.4 5.8-3.9" fill="#fff" stroke={`url(#${gid})`} strokeWidth="3.2" />
                <circle cx="9.7" cy="12" r="1.55" fill="#1b1470" /><circle cx="14.3" cy="12" r="1.55" fill="#1b1470" />
              </svg>
            )} />
        )}
      </div>
      {host && <InfoSheet info={D.info} host={host} onClose={() => setHost(null)} />}
    </div>
  );
}

export default AudienceInsight;
