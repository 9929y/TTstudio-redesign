// Creator Assistant: the welcome block (first screen of the chat) and the answer blocks.
// Ported from design_final/assistant/project/IMY-CA-Welcome.dc.html (variant w2) and IMA-CA-Phone-Blue.dc.html.
// All copy and numbers come from src/insight/demo/assistant.js; nothing is written here.
import { useId, useState } from 'react';
import { useApp } from '../store.js';
import { Cover } from '../ui/kit.jsx';
import { I } from '../ui/Icons.jsx';
import { POSTS, POST_BY_ID } from '../data/seed.js';
import { videoAnswer, summaryAnswer } from './build.js';
import { ModuleA } from './ModuleA.jsx';
import { ASSISTANT_DEMO } from './demo/assistant.js';
import './assistant.css';

const Q_ICONS = {
  traffic: 'M224,196h-4V40a12,12,0,0,0-12-12H152a12,12,0,0,0-12,12V76H96A12,12,0,0,0,84,88v36H48a12,12,0,0,0-12,12v60H32a12,12,0,0,0,0,24H224a12,12,0,0,0,0-24ZM164,52h32V196H164Zm-56,48h32v96H108ZM60,148H84v48H60Z',
  video: 'M176,128a12,12,0,0,1-5.17,9.87l-52,36A12,12,0,0,1,100,164V92a12,12,0,0,1,18.83-9.87l52,36A12,12,0,0,1,176,128Zm60,0A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128Z',
  quality: 'M228.75,100.05c-3.52-3.67-7.15-7.46-8.34-10.33-1.06-2.56-1.14-7.83-1.21-12.47-.15-10-.34-22.44-9.18-31.27s-21.27-9-31.27-9.18c-4.64-.07-9.91-.15-12.47-1.21-2.87-1.19-6.66-4.82-10.33-8.34C148.87,20.46,140.05,12,128,12s-20.87,8.46-27.95,15.25c-3.67,3.52-7.46,7.15-10.33,8.34-2.56,1.06-7.83,1.14-12.47,1.21C67.25,37,54.81,37.14,46,46S37,67.25,36.8,77.25c-.07,4.64-.15,9.91-1.21,12.47-1.19,2.87-4.82,6.66-8.34,10.33C20.46,107.13,12,116,12,128S20.46,148.87,27.25,156c3.52,3.67,7.15,7.46,8.34,10.33,1.06,2.56,1.14,7.83,1.21,12.47.15,10,.34,22.44,9.18,31.27s21.27,9,31.27,9.18c4.64.07,9.91.15,12.47,1.21,2.87,1.19,6.66,4.82,10.33,8.34C107.13,235.54,116,244,128,244s20.87-8.46,27.95-15.25c3.67-3.52,7.46-7.15,10.33-8.34,2.56-1.06,7.83-1.14,12.47-1.21,10-.15,22.44-.34,31.27-9.18s9-21.27,9.18-31.27c.07-4.64.15-9.91,1.21-12.47,1.19-2.87,4.82-6.66,8.34-10.33C235.54,148.87,244,140.05,244,128S235.54,107.13,228.75,100.05Zm-17.32,39.29c-4.82,5-10.28,10.72-13.19,17.76-2.82,6.8-2.93,14.16-3,21.29-.08,5.36-.19,12.71-2.15,14.66s-9.3,2.07-14.66,2.15c-7.13.11-14.49.22-21.29,3-7,2.91-12.73,8.37-17.76,13.19C135.78,214.84,130.4,220,128,220s-7.78-5.16-11.34-8.57c-5-4.82-10.72-10.28-17.76-13.19-6.8-2.82-14.16-2.93-21.29-3-5.36-.08-12.71-.19-14.66-2.15s-2.07-9.3-2.15-14.66c-.11-7.13-.22-14.49-3-21.29-2.91-7-8.37-12.73-13.19-17.76C41.16,135.78,36,130.4,36,128s5.16-7.78,8.57-11.34c4.82-5,10.28-10.72,13.19-17.76,2.82-6.8,2.93-14.16,3-21.29C60.88,72.25,61,64.9,63,63s9.3-2.07,14.66-2.15c7.13-.11,14.49-.22,21.29-3,7-2.91,12.73-8.37,17.76-13.19C120.22,41.16,125.6,36,128,36s7.78,5.16,11.34,8.57c5,4.82,10.72,10.28,17.76,13.19,6.8,2.82,14.16,2.93,21.29,3,5.36.08,12.71.19,14.66,2.15s2.07,9.3,2.15,14.66c.11,7.13.22,14.49,3,21.29,2.91,7,8.37,12.73,13.19,17.76,3.41,3.56,8.57,8.94,8.57,11.34S214.84,135.78,211.43,139.34ZM176.49,95.51a12,12,0,0,1,0,17l-56,56a12,12,0,0,1-17,0l-24-24a12,12,0,1,1,17-17L112,143l47.51-47.52A12,12,0,0,1,176.49,95.51Z',
  money: 'M188,86.11V84c0-14.62-10.83-27.55-30.51-36.4C140.87,40.12,119,36,96,36S51.13,40.12,34.51,47.6C14.83,56.45,4,69.38,4,84v40c0,14.62,10.83,27.55,30.51,36.4A131.67,131.67,0,0,0,68,169.88V172c0,14.62,10.83,27.55,30.51,36.4C115.13,215.88,137,220,160,220s44.87-4.12,61.49-11.6C241.17,199.55,252,186.62,252,172V132C252,109.86,226.71,92.08,188,86.11ZM228,132c0,7.75-21.77,22.48-61.81,23.88C180.33,147.4,188,136.3,188,124V110.44C213.88,115.15,228,125.48,228,132ZM107.37,147.63c-3.63.24-7.42.37-11.37.37-5.08,0-9.89-.22-14.43-.61a10.94,10.94,0,0,0-1.14-.09c-1.51-.14-3-.3-4.43-.48V130.93A187,187,0,0,0,96,132a187,187,0,0,0,20-1.07v15.89c-2.49.3-5.07.56-7.75.75C108,147.58,107.66,147.6,107.37,147.63ZM164,117.14V124c0,4.78-8.28,12.21-24,17.54v-15a115.32,115.32,0,0,0,17.49-6.13Q160.93,118.86,164,117.14ZM96,60c44,0,68,15.85,68,24s-24,24-68,24S28,92.15,28,84,52,60,96,60ZM28,124v-6.86q3.08,1.71,6.51,3.26A115.32,115.32,0,0,0,52,126.53v15C36.28,136.21,28,128.78,28,124Zm64,48v0c1.33,0,2.66,0,4,0q5.44,0,10.77-.32,4.45,1.57,9.23,2.86v15C100.28,184.21,92,176.78,92,172Zm48,22.82V178.94A186.45,186.45,0,0,0,160,180a187,187,0,0,0,20-1.07v15.89a170.08,170.08,0,0,1-40,0Zm64-5.28v-15a115.32,115.32,0,0,0,17.49-6.13q3.44-1.54,6.51-3.26V172C228,176.78,219.72,184.21,204,189.54Z',
};
const Q_ARROW = 'M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z';

// ---------- welcome: greeting bubble is rendered by the screen; this is the question card + notice ----------
export function AssistantWelcome({ onAsk, data = ASSISTANT_DEMO.welcome }) {
  return (
    <>
      <div className="cax-welcome cax-in cax-in2">
        <span className="cax-w-lead">{data.lead}</span>
        <div className="cax-w-card">
          {data.questions.map((q, i) => (
            <button key={q.text} type="button" className="cax-w-row cax-press" data-act={`assistant-prompt-${i}`} onClick={() => onAsk(q.text)}>
              <span className="cax-w-ic"><svg width="20" height="20" viewBox="0 0 256 256" fill="#1e7ce8" aria-hidden="true"><path d={Q_ICONS[q.icon]} /></svg></span>
              <span className="cax-w-t">{q.text}</span>
              <svg width="16" height="16" viewBox="0 0 256 256" fill="#8a8b91" aria-hidden="true"><path d={Q_ARROW} /></svg>
              {i < data.questions.length - 1 && <i className="cax-w-line" />}
            </button>
          ))}
        </div>
      </div>
      <span className="cax-w-notice cax-in cax-in2">{data.notice[0]}<u>{data.notice[1]}</u>{data.notice[2]}</span>
    </>
  );
}

// ---------- module parts ----------
const InfoMark = () => (
  <span className="cax-info" role="img" aria-label="About this data">
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#8a8b91" strokeWidth="1.6" /><path d="M12 11v5.5M12 7.6v.4" fill="none" stroke="#8a8b91" strokeWidth="1.8" strokeLinecap="round" /></svg>
  </span>
);
const CardHead = ({ title, sub }) => (
  <div className="cax-card-head">
    <span className="cax-card-tt"><span className="cax-card-title">{title}</span>{sub && <span className="cax-card-sub">{sub}</span>}</span>
    <InfoMark />
  </div>
);
const postFor = (x) => POSTS.find((p) => p.coverText === x.coverText) || null;
function Thumb({ item }) {
  const p = postFor(item);
  return <span className="cax-thumb">{p ? <Cover item={p} w={56} h={74} radius={4} /> : <span className="cax-thumb-t">{item.coverText}</span>}</span>;
}
function StartCreating({ label }) {
  const switchTab = useApp((s) => s.switchTab);
  return <button type="button" className="cax-cta cax-press" data-act="assistant-start-creating" onClick={() => switchTab('create')}>{label}</button>;
}

// Overview Key metrics: selectable tiles + the 7-day trend (same maths as the dc file / ui/charts.jsx TrendChart)
const niceMax = (v) => { if (v <= 0) return 3; const raw = v * 1.08; const p = Math.pow(10, Math.floor(Math.log10(raw)) - 1); return Math.ceil(raw / p / 3) * 3 * p; };
const fmtTick = (n) => { const a = Math.abs(n); if (a < 1e4) return Math.round(a).toLocaleString('en-US'); return (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; };
function KeyMetrics({ m }) {
  const [sel, setSel] = useState(m.tiles[0].key);
  const gid = `cax${useId().replace(/:/g, '')}`;
  const cur = m.tiles.find((x) => x.key === sel) || m.tiles[0];
  const W = 330, PR = 44, PT = 10, PB = 22, H = 150, iw = W - PR, ih = H - PT - PB;
  const max = niceMax(Math.max(...cur.s));
  const X = (i) => (i / (cur.s.length - 1)) * iw, Y = (v) => PT + ih - (v / max) * ih;
  const pts = cur.s.map((v, i) => [X(i), Y(v)]);
  const path = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('');
  const area = `${path}L${iw},${PT + ih}L0,${PT + ih}Z`;
  const hx = pts[m.hatchFrom][0];
  const font = 'TikTok Sans, -apple-system, sans-serif';
  return (
    <div className="cax-card">
      <CardHead title={m.title} sub={m.sub} />
      <div className="cax-rail">
        {m.tiles.map((t) => (
          <button key={t.key} type="button" className={`cax-tile cax-press ${t.key === sel ? 'on' : ''}`} data-act={`assistant-metric-${t.key}`} onClick={() => setSel(t.key)}>
            <span className="cax-tile-l">{t.label}</span>
            <span className="cax-tile-v">{t.value}</span>
            <span className="cax-tile-d"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.5" fill="currentColor" /><path d="M8 4.5V11m-2.8-2.7L8 11.1l2.8-2.8" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>{t.delta}</span>
          </button>
        ))}
      </div>
      <svg viewBox="0 0 330 150" width="100%" height="150" aria-hidden="true" style={{ display: 'block', marginTop: 12 }}>
        <defs>
          <linearGradient id={`${gid}f`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3d8eea" stopOpacity="0.26" /><stop offset="1" stopColor="#3d8eea" stopOpacity="0.03" /></linearGradient>
          <pattern id={`${gid}h`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#c9c9cc" strokeWidth="1.2" /></pattern>
        </defs>
        {[1, 2 / 3, 1 / 3].map((f) => { const t = max * f, y = Y(t); return (
          <g key={f}><line x1="0" x2="286" y1={y} y2={y} stroke="#e6e6e8" strokeDasharray="3 3" /><text x="328" y={y + 4} textAnchor="end" fontSize="10" fill="#8a8b91" fontFamily={font}>{fmtTick(t)}</text></g>
        ); })}
        <line x1="0" x2="286" y1="128" y2="128" stroke="#e6e6e8" />
        <path d={area} fill={`url(#${gid}f)`} />
        <rect x={hx} y="10" width={iw - hx} height="118" fill={`url(#${gid}h)`} opacity="0.9" />
        <path d={path} fill="none" stroke="#3d8eea" strokeWidth="1.6" strokeLinejoin="round" />
        {pts.map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r="2.6" fill="#fff" stroke="#3d8eea" strokeWidth="1.4" />)}
        <text x="0" y="146" fontSize="10" fill="#8a8b91" fontFamily={font}>{m.axis[0]}</text>
        <text x="286" y="146" textAnchor="end" fontSize="10" fill="#8a8b91" fontFamily={font}>{m.axis[1]}</text>
      </svg>
    </div>
  );
}

// Video analysis Key metrics: five tiles + the views-over-time curve
function VideoMetrics({ m }) {
  const gid = `cax${useId().replace(/:/g, '')}`;
  const c = m.chart;
  const area = `M${c.x[0]},${c.base} L${c.points.split(' ').join(' L')} L${c.x[1]},${c.base} Z`;
  return (
    <div className="cax-card">
      <CardHead title={m.title} sub={m.sub} />
      <div className="cax-vgrid">
        {m.tiles.map((t) => <div key={t.label} className={`cax-vtile ${t.on ? 'on' : ''}`}><span className="cax-vtile-l">{t.label}</span><span className="cax-vtile-v">{t.value}</span></div>)}
      </div>
      <div className="cax-vchart">
        <svg width="290" height="124" viewBox={c.viewBox} preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3d8eea" stopOpacity=".28" /><stop offset="1" stopColor="#3d8eea" stopOpacity=".02" /></linearGradient></defs>
          {c.grid.map((y) => <path key={y} d={`M${c.x[0]} ${y}H${c.x[1]}`} stroke="#e3e3e6" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />)}
          <path d={`M${c.x[0]} ${c.base}H${c.x[1]}`} stroke="#e3e3e6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={area} fill={`url(#${gid})`} />
          <polyline points={c.points} fill="none" stroke="#3d8eea" strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {c.yLabels.map(([l, top]) => <span key={l} className="cax-vlab" style={{ left: 300, top }}>{l}</span>)}
        <span className="cax-vlab" style={{ left: 0, top: 128 }}>{c.xLabels[0]}</span>
        <span className="cax-vlab" style={{ left: 266, top: 128 }}>{c.xLabels[1]}</span>
      </div>
    </div>
  );
}

function TopPosts({ m }) {
  const push = useApp((s) => s.push);
  return (
    <div className="cax-card">
      <CardHead title={m.title} />
      <div className="cax-posts">
        {m.posts.map((x, i) => { const p = postFor(x); return (
          <button key={x.coverText} type="button" className="cax-post" data-act="assistant-post" onClick={() => p && push('videoAnalysis', { postId: p.id })}>
            <span className="cax-post-n">{i + 1}</span>
            <Thumb item={x} />
            <span className="cax-post-b"><span className="cax-post-t">{x.title}</span><span className="cax-post-v">{x.views}</span></span>
          </button>
        ); })}
      </div>
      <StartCreating label={m.cta} />
    </div>
  );
}

function PostCard({ m }) {
  const push = useApp((s) => s.push);
  return (
    <div className="cax-card">
      <div className="cax-pc">
        <Thumb item={m.post} />
        <span className="cax-pc-b">
          <button type="button" className="cax-pc-tag cax-press" data-act="assistant-recommended" onClick={() => push('creatorInspiration')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e7ce8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></svg>{m.post.tag}
          </button>
          <span className="cax-post-t">{m.post.title}</span>
          <span className="cax-pc-meta">{m.post.meta}</span>
        </span>
      </div>
      <div className="cax-pc-tiles">
        {m.tiles.map((t) => <div key={t.label} className="cax-pc-tile"><span className="cax-tile-l">{t.label}</span><span className="cax-tile-v">{t.value}</span></div>)}
      </div>
      <StartCreating label={m.cta} />
    </div>
  );
}

function Module({ m }) {
  if (!m) return null;
  if (m.type === 'keyMetrics') return <KeyMetrics m={m} />;
  if (m.type === 'videoMetrics') return <VideoMetrics m={m} />;
  if (m.type === 'topPosts') return <TopPosts m={m} />;
  if (m.type === 'postCard') return <PostCard m={m} />;
  if (m.type === 'performanceSummary') return <div className="cax-ps"><ModuleA ca="none" title={m.title} /></div>;
  return null;
}

// A text answer the design has no module for: "intro\n\n1. a\n2. b" becomes headline + bullets, anything else stays paragraphs.
export function splitAnswerText(text) {
  const paras = text.split('\n\n');
  const last = paras[paras.length - 1].split('\n');
  if (paras.length === 2 && last.length > 1 && last.every((l) => /^\d+\.\s/.test(l))) return { headline: paras[0], bullets: last.map((l) => l.replace(/^\d+\.\s/, '')) };
  return { paras };
}

// One assistant answer: bubble (headline + bullets) → one module → thumbs. `children` = extra rows of a text answer.
export function AssistantAnswer({ kind, postId, text, fb, onFb, children }) {
  // 作品表现的回答按这条作品的数据生成（之前所有作品都显示 Kyoto at dusk）
  const k = kind === 'video' ? videoAnswer(POST_BY_ID[postId] || POSTS[POSTS.length - 1]) : kind === 'summary' ? summaryAnswer() : kind && ASSISTANT_DEMO.kinds[kind];
  const body = k ? { headline: k.headline, bullets: k.bullets } : splitAnswerText(text || '');
  return (
    <div className="cax-turn">
      <div className="cax-bubble cax-in">
        {body.headline && <span className="cax-hl">{body.headline}</span>}
        {body.bullets && <ul className="cax-bullets">{body.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        {body.paras?.map((p, j) => <p key={j} className="cax-p">{p}</p>)}
      </div>
      {k?.module && <div className="cax-in cax-in2"><Module m={k.module} /></div>}
      {children}
      <div className="cax-fb">
        {[['like', I.thumbUp], ['dislike', I.thumbDown]].map(([key, Ic]) => (
          <button key={key} type="button" className={fb === key ? 'on' : ''} data-act={`assistant-${key}`} aria-label={key} onClick={() => onFb(key)}><Ic size={19} /></button>
        ))}
      </div>
    </div>
  );
}
