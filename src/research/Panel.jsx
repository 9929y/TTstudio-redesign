// 研究面板：当前页面的验证等级 + 证据帧/片段对照；研究开关；证据热点
import { useEffect, useMemo, useState } from 'react';
import { useApp, currentRoute } from '../store.js';
import { COVERAGE, STATUS } from './coverage.js';

// 证据路径：dev 由 vite 中间件挂在 /evidence/；构建产物在 prototype/dist/ 下，向上两级就是研究文件夹
export const EVIDENCE_BASE = import.meta.env.DEV ? '/evidence/' : '../../';
export function evidenceUrl(file) {
  if (/^studioapp_.*-\d{4}$/.test(file)) return { kind: 'clip', url: `${EVIDENCE_BASE}clips/${file}.mp4` };
  if (/^(studioapp|inapp|web|douyin|appstore)_/.test(file)) return { kind: 'frame', url: `${EVIDENCE_BASE}assets/frames/${file}.jpg` };
  return { kind: 'note', url: null };
}

const SCREEN_NAMES = {
  'tab:home': 'Home', 'tab:analytics': 'Analytics', 'tab:create': 'Create', 'tab:inbox': 'Inbox', 'tab:manage': 'Manage', 'tab:monetise': 'Monetise（旧版）',
  videoAnalysis: 'Video analysis', player: '全屏播放器（2024 iOS）', videoComments: '视频 + 评论面板', locations: 'Locations', articleLinks: 'Article link metrics',
  appeal: 'Appeal 详情', strikes: 'Strikes and warnings', policy: '政策正文', settings: 'Settings and privacy', settingDetail: '设置二级页', search: 'Search',
  notifications: 'Notifications', notifSettings: 'Inbox 通知设置', picker: '素材选择器', editor: '编辑页', composer: '发布页', creatorProfile: '他人主页', welcome: 'Welcome', topicSearch: '话题洞察搜索', rewardsAnalytics: 'Rewards analytics', monetization: 'Monetization', camera: '相机',
};

export function statusOfAct(act) {
  for (const c of COVERAGE) {
    for (const a of c.acts || []) {
      if (a === act || (a.endsWith('*') && act.startsWith(a.slice(0, -1)))) return c.status;
    }
  }
  return null;
}

function Evidence({ s, onOpen }) {
  const ev = evidenceUrl(s[0]);
  return (
    <button className="ev" onClick={() => ev.url && onOpen({ ...ev, s })} disabled={!ev.url} title={s[3]}>
      {ev.kind === 'frame' && <img src={ev.url} alt="" loading="lazy" />}
      {ev.kind === 'clip' && <span className="ev-clip">▶ 片段</span>}
      {ev.kind === 'note' && <span className="ev-clip note">文字</span>}
      <span className="ev-meta"><b>{s[1]}</b><br />{s[2]}{s[3] ? ` · ${s[3]}` : ''}</span>
    </button>
  );
}

function Lightbox({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="lightbox" onClick={onClose}>
      <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
        {item.kind === 'frame' ? <img src={item.url} alt="" /> : <video src={item.url} controls autoPlay muted loop playsInline />}
        <div className="lb-cap"><b>{item.s[0]}</b> · {item.s[1]} · {item.s[2]} {item.s[3] && `· ${item.s[3]}`}</div>
        <button className="lb-x" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}

export function ResearchPanel() {
  const routeName = useApp((s) => (s.booted ? currentRoute(s).name : 'welcome'));
  const route = { name: routeName };
  const sheet = useApp((s) => s.sheet);
  const legacyIA = useApp((s) => s.legacyIA);
  const market = useApp((s) => s.market);
  const newAccount = useApp((s) => s.newAccount);
  const welcomeArt = useApp((s) => s.welcomeArt);
  const detailEntry = useApp((s) => s.detailEntry);
  const hotspots = useApp((s) => s.hotspots);
  const setResearch = useApp((s) => s.setResearch);
  const resetAll = useApp((s) => s.resetAll);
  const [lb, setLb] = useState(null);
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 860);
  const rows = useMemo(() => COVERAGE.filter((c) => (c.screen === route.name || (c.screen === '*' && route.name !== 'welcome')) && (!c.mk || c.mk === market)), [routeName, market]);
  const counts = useMemo(() => Object.fromEntries(Object.keys(STATUS).map((k) => [k, COVERAGE.filter((c) => c.status === k).length])), []);
  return (
    <aside className={`rpanel ${collapsed ? 'collapsed' : ''}`}>
      <button className="rp-toggle" onClick={() => setCollapsed(!collapsed)}>{collapsed ? '研究面板 ▴' : '收起 ▾'}</button>
      <div className="rp-inner">
        <div className="rp-title">研究面板 · Version 4</div>
        <div className="rp-sub">当前页面：<b>{SCREEN_NAMES[route.name] || route.name}</b>{sheet ? ` · 弹层 ${sheet.type}` : ''}</div>
        <div className="rp-market">
          <div className="rp-mt">市场变体（V4：美国版优先）</div>
          <label><input type="radio" name="market" checked={market === 'us'} onChange={() => setResearch({ market: 'us' })} /> 美国版（默认）· 2026-11-22 iPhone 真机录屏</label>
          <label><input type="radio" name="market" checked={market === 'store'} onChange={() => setResearch({ market: 'store' })} /> 旧版美国 · App Store 美国区宣传图</label>
          <div className="rp-mnote">规则：美国 &gt; 英语区 &gt; 其他地区，同级越新越优先。美国真机录屏没覆盖的地方（有数据的状态、作品详情等）用 2026 年其他地区 iPhone 录屏，再缺才用 Android。</div>
        </div>
        <div className="rp-market">
          <div className="rp-mt">欢迎页插图（2026-11-26 三版待选）</div>
          {[['a', 'A · 线稿复刻（贴近真实欢迎页）'], ['b', 'B · 真实素材拼贴'], ['c', 'C · 产品卡片']].map(([k, l]) => (
            <label key={k}><input type="radio" name="welcomeArt" checked={welcomeArt === k} onChange={() => setResearch({ welcomeArt: k })} /> {l}</label>
          ))}
        </div>
        <div className="rp-switches">
          <label><input type="checkbox" checked={hotspots} onChange={(e) => setResearch({ hotspots: e.target.checked })} /> 证据热点（按验证等级描边）</label>
          <label><input type="checkbox" checked={newAccount} onChange={(e) => setResearch({ newAccount: e.target.checked })} /> 新账号：Data is processing</label>
          <label><input type="checkbox" checked={legacyIA} onChange={(e) => setResearch({ legacyIA: e.target.checked })} /> 2024–25 IA（Monetise 代替 Inbox）</label>
          <label><input type="checkbox" checked={detailEntry === 'player'} onChange={(e) => setResearch({ detailEntry: e.target.checked ? 'player' : 'analysis' })} /> 作品入口走 2024 iOS 播放器 + More data</label>
          <button onClick={resetAll}>重置数据并回到欢迎页</button>
        </div>
        <div className="rp-legend">
          {Object.entries(STATUS).map(([k, v]) => <span key={k}><i style={{ background: v.color }} />{v.label} {counts[k]}</span>)}
        </div>
        <a className="rp-link" href={import.meta.env.DEV ? '/COVERAGE.html' : '../COVERAGE.html'} target="_blank" rel="noreferrer">打开完整覆盖表 COVERAGE.html ↗</a>
        <div className="rp-list">
          {rows.length === 0 && <div className="rp-empty">这一页还没有登记条目。</div>}
          {rows.map((c) => (
            <div key={c.id} className="rp-item">
              <div className="rp-head"><span className="rp-id">{c.id}</span>{c.mk && <span className="rp-mk">{c.mk === 'store' ? '旧版美国（宣传图）' : '美国版'}</span>}<span className="rp-status" style={{ background: STATUS[c.status].color }}>{STATUS[c.status].label}</span></div>
              <div className="rp-action">{c.action}</div>
              <div className="rp-result">→ {c.result}</div>
              {c.note && <div className="rp-note">注：{c.note}</div>}
              {c.v4 && <div className="rp-v4">V4 更新：{c.v4}</div>}
              {c.src?.length > 0 && <div className="rp-evs">{c.src.map((s, i) => <Evidence key={i} s={s} onOpen={setLb} />)}</div>}
              {c.comps?.length > 0 && <div className="rp-comps">组件：{c.comps.join(' · ')}</div>}
            </div>
          ))}
        </div>
      </div>
      <Lightbox item={lb} onClose={() => setLb(null)} />
    </aside>
  );
}

// 证据热点：给手机里每个可点元素描边；未登记的元素用灰色虚线（便于发现「只做了外观」的元素）
export function HotspotLayer() {
  const on = useApp((s) => s.hotspots);
  const [boxes, setBoxes] = useState([]);
  useEffect(() => {
    if (!on) { setBoxes([]); return; }
    const tick = () => {
      const root = document.getElementById('phone-screen');
      if (!root) return;
      const rr = root.getBoundingClientRect();
      const scale = rr.width / 393;
      const list = [];
      root.querySelectorAll('[data-act]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || el.closest('[style*="display: none"]')) return;
        if (r.bottom < rr.top || r.top > rr.bottom || r.right < rr.left || r.left > rr.right) return;
        const st = statusOfAct(el.dataset.act);
        list.push({ x: (r.left - rr.left) / scale, y: (r.top - rr.top) / scale, w: r.width / scale, h: r.height / scale, st, act: el.dataset.act });
      });
      setBoxes(list);
    };
    tick();
    const i = setInterval(tick, 400);
    return () => clearInterval(i);
  }, [on]);
  if (!on) return null;
  return (
    <div className="hotspots">
      {boxes.map((b, i) => (
        <div key={i} className="hs" title={b.act} style={{ left: b.x, top: b.y, width: b.w, height: b.h, borderColor: b.st ? STATUS[b.st].color : '#999', borderStyle: b.st ? 'solid' : 'dashed' }} />
      ))}
    </div>
  );
}
