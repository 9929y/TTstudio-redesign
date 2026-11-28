// 共享组件。每个组件注明对应录屏帧与 Semi 复用方式（见 COVERAGE「复用组件」列）
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store.js';
import { useRoute } from '../shell/Navigator.jsx';
import { I } from './Icons.jsx';
import { Illo, illoUrl, coverUrl, avatarUrl } from './illo.jsx';
import { ACCOUNT } from '../data/seed.js';
import { fmt, fmtMoney, fmtStat } from '../data/agg.js';

// 整行可点的 div：让键盘和读屏也能进（Tab 聚焦，Enter / 空格触发）
export const asButton = (fn) => ({ role: 'button', tabIndex: 0, onKeyDown: (e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fn?.(e); } } });

// ---------- 头像 ----------
export function Avatar({ hue = ACCOUNT.avatarHue, size = 28, label, ring }) {
  const me = illoUrl('avatar');
  if (me && (label === 'ML' || label === '1' || label == null)) return <img className="avatar" src={me} alt="" style={{ width: size, height: size, objectFit: 'cover', boxShadow: ring ? '0 0 0 2px #fff' : undefined }} />;
  const other = label !== 'ML' && label !== '1' && size >= 14 ? avatarUrl(hue) : null;
  if (other) return <img className="avatar" src={other} alt="" style={{ width: size, height: size, objectFit: 'cover', boxShadow: ring ? '0 0 0 2px #fff' : undefined }} />;
  return (
    <div className="avatar" style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 40) % 360} 65% 42%))`, boxShadow: ring ? '0 0 0 2px #fff' : undefined, fontSize: size * 0.38 }}>
      {label ?? ''}
    </div>
  );
}

// ---------- 大标题页头（QKE_0042 / 0117 / 0052 / 0124） ----------
export function LargeHeader({ title, search = 'search', gear, bell = true, children }) {
  const push = useApp((s) => s.push);
  const us = useApp((s) => s.market === 'store');
  // 旧版美国（宣传图）：页头 搜索 + 铃铛 + 头像；美国版 2026-11-22 录屏：Analytics / Create 是火花搜索 + 头像，Manage 是普通搜索 + 头像，都没有铃铛
  if (!gear) bell = us;
  return (
    <div className="lg-head">
      <h1>{title}</h1>
      <div className="lg-icons">
        {search && <button data-act={search === 'spark' ? 'open-topic-search' : 'open-search'} onClick={() => push(search === 'spark' ? 'topicSearch' : 'search')} aria-label="Search">{search === 'spark' && !us ? <I.searchSpark size={25} /> : <I.search size={25} />}</button>}
        {gear ? (
          <button data-act="inbox-settings" onClick={() => push('notifSettings')} aria-label="Settings"><I.gear size={25} /></button>
        ) : bell && (
          <button data-act="open-notifications" className="bell" onClick={() => push(us ? 'inboxPage' : 'notifications')} aria-label="Notifications"><I.bell size={25} /><span className="dot" /></button>
        )}
        <button data-act="open-settings" onClick={() => push('settings')} aria-label="Profile"><Avatar size={30} label="ML" /></button>
      </div>
      {children}
    </div>
  );
}

// ---------- 导航栏（推入页：返回 + 居中标题；18Y_0021「Video analysis」） ----------
export function NavBar({ title, right, onBack, dark, transparent, close }) {
  const pop = useApp((s) => s.pop);
  return (
    <div className={`navbar ${dark ? 'dark' : ''} ${transparent ? 'transparent' : ''}`}>
      <button className="nb-back" data-act="nav-back" onClick={onBack || pop} aria-label="Back">
        {close ? <I.close size={24} /> : <I.back size={26} />}
      </button>
      <div className="nb-title">{title}</div>
      <div className="nb-right">{right}</div>
    </div>
  );
}

// ---------- 可滚动页面容器：记住滚动位置（原型假设：iOS 默认保留） ----------
export function Scroll({ id, children, className = '', onScroll, innerRef, style }) {
  const ref = useRef(null);
  const route = useRoute();
  const key = id || route?.key;
  const saveScroll = useApp((s) => s.saveScroll);
  const sig = useApp((s) => s.scrollTopSignal);
  useLayoutEffect(() => {
    const y = useApp.getState().scroll[key];
    if (y && ref.current) ref.current.scrollTop = y;
  }, [key]);
  useEffect(() => {
    if (sig && route?.depth === 0 && route?.name === `tab:${sig.tab}` && ref.current) ref.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [sig]);
  return (
    <div className={`scroll ${className}`} style={style} ref={(el) => { ref.current = el; if (innerRef) innerRef.current = el; }}
      onScroll={(e) => { saveScroll(key, e.currentTarget.scrollTop); onScroll?.(e); }}>
      {children}
    </div>
  );
}

// ---------- 顶部文字 Tab（Semi Tabs 的逻辑：受控 activeKey；视觉按录屏：黑色下划线） ----------
export function TopTabs({ tabs, value, onChange, equal = true, id, className = '' }) {
  return (
    <div className={`top-tabs ${equal ? 'equal' : ''} ${className}`} role="tablist">
      {tabs.map((t) => {
        const k = t.key ?? t; const label = t.label ?? t;
        const on = k === value;
        return (
          <button key={k} role="tab" aria-selected={on} data-act={`tab-${k}`} className={on ? 'on' : ''} onClick={() => onChange(k)}>
            <span>{label}</span>
            {on && <motion.i layoutId={`tt-${id}`} className="tt-line" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ---------- 胶囊（日期 / 指标；选中黑底 o1g_0036；蓝色弱选中 o1g_0622） ----------
export function Pills({ items, value, onChange, variant = 'black', className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.querySelector('.on');
    if (el && ref.current) {
      const c = ref.current; const l = el.offsetLeft, r = l + el.offsetWidth;
      if (l < c.scrollLeft || r > c.scrollLeft + c.clientWidth) c.scrollTo({ left: l - 16, behavior: 'smooth' });
    }
  }, [value]);
  return (
    <div className={`pills ${variant} ${className}`} ref={ref}>
      {items.map((it) => (
        <button key={it.key} data-act={`pill-${it.key}`} className={`pill ${it.key === value ? 'on' : ''}`} onClick={() => onChange(it.key)}>
          {it.label}{it.caret && <I.down size={14} />}
        </button>
      ))}
    </div>
  );
}

// ---------- 筛选胶囊（Manage；激活后黑底 + ×，o1g_0300 / 91F_0231） ----------
export function Chip({ label, active, onPress, onClear, act }) {
  return (
    <button className={`chip ${active ? 'on' : ''}`} data-act={act} onClick={onPress}>
      <span>{label}</span>
      {active && onClear ? (
        <span className="chip-x" role="button" aria-label="Clear filter" data-act={`${act}-clear`} onClick={(e) => { e.stopPropagation(); onClear(); }}><I.close size={14} /></span>
      ) : (
        <I.down size={14} />
      )}
    </button>
  );
}

// ---------- 分区卡片（白底 12px 圆角，标题 + ⓘ） ----------
export function Section({ title, info, infoSheet, sub, right, children, className = '', pad = true }) {
  const openSheet = useApp((s) => s.openSheet);
  return (
    <section className={`section ${className}`}>
      {title && (
        <div className="sec-head">
          <div>
            <div className="sec-title">
              {title}
              {info && <button className="info-btn" data-act={`info-${title}`} onClick={() => (infoSheet ? openSheet('kpiInfo', { tab: infoSheet }) : openSheet('info', { title, text: info }))} aria-label="Info"><I.info size={15} /></button>}
            </div>
            {sub && <div className="sec-sub">{sub}</div>}
          </div>
          {right}
        </div>
      )}
      <div className={pad ? 'sec-body' : ''}>{children}</div>
    </section>
  );
}

// ---------- KPI 卡（QKE_0042：选中蓝框浅蓝底；上升蓝色圆箭头；下降灰色） ----------
// Final（IMK-Key-Deltas）：所有变化一条规则。胶囊里是箭头 + 百分比（> +1% 蓝、< −1% 橙、±1% 以内灰且无箭头），后面跟灰色的变化量
export function Delta({ d, pctv, money, suffix }) {
  if (d == null) return <div className="kpi-delta flat">–</div>;
  const zero = Math.abs(d) < (money ? 0.005 : 0.5);
  const num = money ? fmtMoney(Math.abs(d)) : fmtStat(Math.abs(d));
  const abs = zero ? (money ? '+$0.00' : '0') : `${d > 0 ? '+' : '−'}${num}`;
  const pct = pctv != null && Number.isFinite(pctv) ? pctv * 100 : null;
  const p = pct ?? (zero ? 0 : d > 0 ? 100 : -100);
  const tone = p > 1 ? 'up' : p < -1 ? 'down' : 'flat';
  const arrow = tone !== 'flat' && (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ transform: tone === 'up' ? 'rotate(180deg)' : 'none' }}>
      <path d="M6 2.2v7.4M3 6.7l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const pctTxt = pct == null ? null : Math.abs(pct) > 999 ? '>999%' : `${+Math.abs(pct).toFixed(1)}%`;
  return (
    <div className="kpi-delta">
      <span className={`kd-pill ${tone}`}>{arrow}{pctTxt ?? abs}</span>
      {pctTxt != null && <span className="kd-abs">{abs}</span>}
      {suffix && <span className="kd-abs">{suffix}</span>}
    </div>
  );
}
export function KpiCard({ k, selected, onPress, delay = 0, empty }) {
  // 美国 2026-11-22（usrec 0:38）：空数据时 Est. rewards 仍显示「$0.00」
  const val = empty ? (k.money ? <><small>$</small>0.00</> : '–') : k.money ? <><small>$</small>{k.value.toFixed(2)}</> : k.text ?? fmtFull0(k.value);
  return (
    <motion.button className={`kpi ${selected ? 'sel' : ''}`} data-act={`kpi-${k.key}`} onClick={onPress}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>
      <div className="kpi-label">{k.label}</div>
      <div className="kpi-val">{val}</div>
      {empty ? <div className="kpi-delta flat">{k.money ? '+$0.00' : '–'}</div> : k.sub ? <div className="kpi-sub">{k.sub}</div> : k.delta !== undefined ? <Delta d={k.delta} pctv={k.deltaPct} money={k.money} /> : null}
    </motion.button>
  );
}
const fmtFull0 = (v) => fmtStat(v);

// ---------- 骨架屏：直接复用 Semi Skeleton（只改颜色/圆角 token） ----------
// ---------- 骨架屏（2026-11-26 重做）：一道很淡的微光从左往右扫过 ----------
// 全页同步：每块的高光按「手机屏幕的 x 坐标」对齐（--sx），动画相位按全局时钟对齐（--st），
// 看起来是一束光同时扫过整页，而不是几十个块各闪各的。只动 transform（伪元素平移），减弱动态效果时改成缓慢明暗。
const SKEL_MS = 1600;
if (typeof document !== 'undefined' && !window.__skelVis) {
  window.__skelVis = true;
  const sync = () => document.documentElement.classList.toggle('page-hidden', document.hidden);
  document.addEventListener('visibilitychange', sync); sync();
}
export function Skel({ w = '100%', h = 16, r = 4, style }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const screen = el.closest('.screen-root') || document.body;
    const sb = screen.getBoundingClientRect(), b = el.getBoundingClientRect();
    el.style.setProperty('--sx', `${Math.round(b.left - sb.left)}px`);
    el.style.setProperty('--sw', `${Math.round(sb.width) || 393}px`);
    el.style.setProperty('--st', `${Math.round(performance.now() % SKEL_MS)}ms`);
  }, []);
  return <div ref={ref} className="skel" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, flexShrink: typeof w === 'number' ? 0 : undefined, ...style }} />;
}
// Key metrics 的骨架：和成品卡一样的框，里面三条（标签 / 数字 / 涨跌胶囊）
export function KpiSkeleton({ n = 6 }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="kpi skel-kpi">
          <Skel w="55%" h={12} />
          <Skel w="45%" h={22} r={5} style={{ marginTop: 6 }} />
          <Skel w={64} h={16} r={8} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
// AI 卡的骨架：和成品同形状（标题行 + 浅色洞察块两行 + 圆环 + Ask 行），数据出来时位置不跳
export function InsightCardSkeleton({ half = false }) {
  const ring = half ? { w: 232, h: 116, r: '116px 116px 0 0', hole: { w: 136, h: 68, r: '68px 68px 0 0' } } : { w: 172, h: 172, r: '50%', hole: { w: 108, h: 108, r: '50%' } };
  return (
    <div className="skel-card" aria-label="Loading" role="status">
      <div className="skel-row"><Skel w={150} h={18} r={5} /><Skel w={16} h={16} r={8} /><span style={{ flex: 1 }} /><Skel w={18} h={18} r={9} /></div>
      <div className="skel-key"><Skel h={14} /><Skel w="72%" h={14} style={{ marginTop: 8 }} /></div>
      <div className="skel-chart" style={{ height: half ? 200 : 258 }}>
        <div className={`skel-ring ${half ? 'half' : ''}`} style={{ width: ring.w, height: ring.h }}>
          <Skel w={ring.w} h={ring.h} r={ring.r} />
          <span className="skel-hole" style={{ width: ring.hole.w, height: ring.hole.h, borderRadius: ring.hole.r }} />
        </div>
      </div>
      <Skel w="70%" h={12} style={{ margin: '0 auto' }} />
      <div className="skel-ask"><Skel w={22} h={22} r={11} /><Skel w="62%" h={14} /></div>
    </div>
  );
}

// 「区间刷新」：rangeToken 变化时先显示骨架 ~900ms（o1g 0:42–0:45）
export function useRefill(token, ms = 900) {
  // 渲染时同步判断：token 一变，同一帧就进入骨架态，避免先闪一帧新数据
  const [done, setDone] = useState(token);
  useEffect(() => {
    if (done === token) return;
    const t = setTimeout(() => setDone(token), ms);
    return () => clearTimeout(t);
  }, [token]);
  return done !== token;
}
// 首次进入页面时的骨架（18Y 0:15 / QKE 0:40）
export function useFirstLoad(ms = 650) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), ms); return () => clearTimeout(t); }, []);
  return loading;
}

// 某个底部 Tab 第一次被打开时才开始计时（所有 Tab 在启动时就已挂载）
export function useTabFirstLoad(tab, ms = 650) {
  const active = useApp((s) => s.tab === tab && s.booted);
  const [done, setDone] = useState(false);
  const started = useRef(false);
  useEffect(() => { if (active && !started.current) { started.current = true; setTimeout(() => setDone(true), ms); } }, [active, ms]);
  return !done;
}

// ---------- 条形列表（Traffic source / Locations；有无 › 按证据区分，Q4） ----------
export function BarRows({ rows, chevron, chevronFor, onRow, decimals = 1, color }) {
  return (
    <div className="bar-rows">
      {rows.map(([label, v], idx) => { const ch = chevron || chevronFor?.(label); return (
        <div key={label} className={`bar-row ${ch ? 'tap' : ''}`} data-act={ch ? `bar-${label}` : undefined} onClick={ch ? () => onRow?.(label) : undefined} {...(ch ? asButton(() => onRow?.(label)) : {})}>
          <div className="bar-top"><span>{label}</span><span className="bar-v">{(v * 100).toFixed(decimals)}%{ch && <I.right size={14} />}</span></div>
          <div className="bar-track"><motion.div className="bar-fill" style={{ originX: 0, ...(color ? { background: color } : {}) }} initial={{ scaleX: 0, width: `${Math.max(0.4, v * 100)}%` }} animate={{ scaleX: 1, width: `${Math.max(0.4, v * 100)}%` }} transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: idx * 0.04 }} /></div>
        </div>
      ); })}
    </div>
  );
}

// ---------- 半环图（Gender；o1g_0056 / rpfqP_0320） ----------
export function Donut({ rows }) {
  const colors = ['#1e7ce8', '#7fb8f2', '#d5e7fb'];
  const R = 70, C = Math.PI * R; let acc = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 180 100" width="180" height="100">
        {rows.map(([k, v], i) => {
          const len = v * C; const el = (
            <motion.path key={k} d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke={colors[i]} strokeWidth="26"
              strokeDasharray={`${len} ${C}`} initial={{ strokeDashoffset: -C }} animate={{ strokeDashoffset: -acc }} transition={{ duration: 0.6 }} />
          ); acc += len; return el;
        })}
      </svg>
      <div className="donut-legend">
        {rows.map(([k, v], i) => (
          <div key={k}><span className="lg-dot" style={{ background: colors[i] }} />{k}<b>{Math.round(v * 100)}%</b></div>
        ))}
      </div>
    </div>
  );
}

// ---------- 程序化封面 / 视频画面（不使用任何真实视频素材） ----------
// t：0..1 播放进度；留存滑杆拖动时画面随之变化（v1pC 0:34 证据：预览实时跳帧）
// 封面 / 视频画面：程序化的「俯拍实拍」场景（SVG 噪点纹理：桌面 + 碗 + 食材 + 配料 + 筷子 + 光影），不用 emoji
const FOOD = [ // [主色 h, s, l, 纹理频率]
  [32, 62, 52, 0.32], [14, 70, 46, 0.22], [44, 70, 60, 0.4], [8, 62, 40, 0.18], [36, 45, 70, 0.5], [22, 75, 50, 0.28], [90, 30, 45, 0.25], [28, 55, 35, 0.2],
];
const TABLE = [['#6b4a32', '#4a3021', 0.012, 0.35], ['#e8e4dd', '#c9c2b7', 0.03, 0.03], ['#2c2f35', '#1d1f24', 0.05, 0.05], ['#a88b69', '#7d6247', 0.01, 0.3]];
const rnd = (seed) => { let x = Math.sin(seed * 999.7) * 10000; return x - Math.floor(x); };
export function Scene({ hue = 200, t = 0, still, aspect = 1.3, kind = 'food' }) {
  const A = Math.max(0.6, aspect), Y0 = 50 - 50 * A, H = 100 * A; // 按画幅扩展画布，碗始终约占宽度 2/3
  const uid = useId().replace(/:/g, '');
  const k = Math.abs(Math.round(hue)) % 360;
  if (kind === 'portrait') return <PortraitScene k={k} uid={uid} Y0={Y0} H={H} />;
  if (kind === 'product') return <ProductScene k={k} uid={uid} Y0={Y0} H={H} />;
  const [fh, fs, fl, ff] = FOOD[k % FOOD.length];
  const [t1, t2, tfx, tfy] = TABLE[Math.floor(k / 7) % TABLE.length];
  const cx = 50 + (still ? 0 : Math.sin(t * 6.3) * 3), cy = 50 - (A > 1.6 ? 6 : 0) + (still ? 0 : Math.cos(t * 5.1) * 2);
  const garn = Array.from({ length: 9 }, (_, i) => {
    const a = rnd(k + i) * Math.PI * 2, r = 6 + rnd(k + i + 40) * 17;
    const kind = i % 3;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, rot: rnd(k + i + 9) * 180, kind };
  });
  const chop = k % 3 !== 0;
  const arr = Math.floor(k / 3) % 4; // 摆盘
  return (
    <svg className="scene" viewBox={`0 ${Y0} 100 ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={`tx${uid}`} filterUnits="userSpaceOnUse" x="0" y={Y0} width="100" height={H}><feTurbulence type="fractalNoise" baseFrequency={`${tfx} ${tfy}`} numOctaves="3" seed={k} /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 -.05" /></filter>
        <filter id={`fd${uid}`} x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency={ff} numOctaves="2" seed={k + 3} /><feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .85  0 0 0 .9 -.25" /></filter>
        <filter id={`bl${uid}`}><feGaussianBlur stdDeviation="2.4" /></filter>
        <radialGradient id={`rim${uid}`} cx=".42" cy=".38" r=".7"><stop offset="0" stopColor="#ffffff" /><stop offset=".75" stopColor="#efe9df" /><stop offset="1" stopColor="#cfc6b8" /></radialGradient>
        <radialGradient id={`food${uid}`} cx=".45" cy=".4" r=".65"><stop offset="0" stopColor={`hsl(${fh} ${fs}% ${fl + 10}%)`} /><stop offset=".7" stopColor={`hsl(${fh} ${fs}% ${fl}%)`} /><stop offset="1" stopColor={`hsl(${fh} ${fs - 10}% ${fl - 16}%)`} /></radialGradient>
        <radialGradient id={`lt${uid}`} cx=".3" cy=".2" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".45" /></radialGradient>
        <clipPath id={`cl${uid}`}><circle cx={cx} cy={cy} r="25" /></clipPath>
      </defs>
      <rect y={Y0} width="100" height={H} fill={t1} />
      <rect y={Y0} width="100" height={H} fill={t2} filter={`url(#tx${uid})`} />
      {/* 四种摆盘轮换：碗 / 平盘小食 / 木砧板 / 平底锅（V4：避免每张封面都是同一只碗） */}
      {arr === 0 && <>
      <ellipse cx={cx + 3} cy={cy + 5} rx="34" ry="33" fill="rgba(0,0,0,.45)" filter={`url(#bl${uid})`} />
        <circle cx={cx} cy={cy} r="32" fill={`url(#rim${uid})`} />
        <circle cx={cx} cy={cy} r="25.6" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.2" />
        <g clipPath={`url(#cl${uid})`}>
          <circle cx={cx} cy={cy} r="25" fill={`url(#food${uid})`} />
          <rect x={cx - 25} y={cy - 25} width="50" height="50" filter={`url(#fd${uid})`} opacity=".55" />
          {garn.map((g, i) => g.kind === 0
            ? <ellipse key={i} cx={g.x} cy={g.y} rx="2.2" ry=".9" transform={`rotate(${g.rot} ${g.x} ${g.y})`} fill="hsl(110 55% 38%)" />
            : g.kind === 1 ? <circle key={i} cx={g.x} cy={g.y} r=".9" fill="hsl(6 80% 46%)" />
            : <ellipse key={i} cx={g.x} cy={g.y} rx=".7" ry=".45" fill="#f7f1e1" />)}
          <ellipse cx={cx - 8} cy={cy - 9} rx="9" ry="4" fill="#fff" opacity=".18" transform={`rotate(-30 ${cx - 8} ${cy - 9})`} />
        </g>
        {chop && <g transform={`rotate(${-28 + (k % 20)} ${cx} ${cy})`}><rect x={cx + 6} y={cy - 46} width="2.1" height="62" rx="1" fill="#3a2516" /><rect x={cx + 10} y={cy - 44} width="2.1" height="62" rx="1" fill="#4a301d" /></g>}
      </>}
      {arr === 1 && <>
        <ellipse cx={cx + 2} cy={cy + 5} rx="40" ry="31" fill="rgba(0,0,0,.4)" filter={`url(#bl${uid})`} />
        <ellipse cx={cx} cy={cy} rx="40" ry="30" fill={`url(#rim${uid})`} />
        <ellipse cx={cx} cy={cy} rx="33" ry="24" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="1" />
        {[[-15, -6, 9, 6], [2, -9, 8, 6], [16, -2, 8.5, 6.5], [-6, 8, 9, 6], [11, 10, 7.5, 5.5]].map(([dx, dy, rx, ry], i) => (
          <g key={i}>
            <ellipse cx={cx + dx} cy={cy + dy + 1.4} rx={rx} ry={ry} fill="rgba(0,0,0,.18)" />
            <ellipse cx={cx + dx} cy={cy + dy} rx={rx} ry={ry} fill={`hsl(${fh + i * 4} ${fs - 8}% ${fl + 14 - (i % 2) * 6}%)`} />
            <path d={`M${cx + dx - rx * 0.7} ${cy + dy} q ${rx * 0.35} ${-ry * 0.6} ${rx * 0.7} 0 t ${rx * 0.7} 0`} stroke={`hsl(${fh} ${fs}% ${fl - 10}%)`} strokeWidth=".7" fill="none" opacity=".6" />
          </g>
        ))}
        <ellipse cx={cx + 24} cy={cy + 14} rx="6" ry="4" fill="#3a2a1d" /><ellipse cx={cx + 24} cy={cy + 13.4} rx="4.6" ry="2.8" fill="#5b3416" />
        {garn.slice(0, 5).map((g, i) => <ellipse key={i} cx={g.x} cy={g.y} rx="1.6" ry=".7" transform={`rotate(${g.rot} ${g.x} ${g.y})`} fill="hsl(110 55% 38%)" />)}
      </>}
      {arr === 2 && <g transform={`rotate(${-12 + (k % 9)} ${cx} ${cy})`}>
        <rect x={cx - 38} y={cy - 26} width="76" height="52" rx="5" fill="rgba(0,0,0,.35)" filter={`url(#bl${uid})`} transform="translate(2 4)" />
        <rect x={cx - 38} y={cy - 26} width="76" height="52" rx="5" fill="#c08a55" />
        <rect x={cx - 38} y={cy - 26} width="76" height="52" rx="5" fill="#8a5a30" filter={`url(#tx${uid})`} opacity=".7" />
        {Array.from({ length: 14 }, (_, i) => { const x = cx - 28 + (i % 7) * 8 + rnd(k + i) * 3, y = cy - 12 + Math.floor(i / 7) * 14 + rnd(k + i + 7) * 4; const c = [`hsl(${fh} ${fs}% ${fl}%)`, 'hsl(110 50% 40%)', 'hsl(8 75% 50%)', '#f1e6c8'][i % 4]; return <rect key={i} x={x} y={y} width="5.5" height="5.5" rx="1.2" fill={c} transform={`rotate(${rnd(k + i + 3) * 40} ${x + 2.7} ${y + 2.7})`} />; })}
        <path d={`M${cx + 16} ${cy + 18} l 26 -8 l 1.5 2.5 l -26 9 z`} fill="#d9dde2" /><rect x={cx + 39} y={cy + 6} width="10" height="3.4" rx="1.2" fill="#222" transform={`rotate(-17 ${cx + 39} ${cy + 6})`} />
      </g>}
      {arr === 3 && <>
        <rect x={cx + 26} y={cy - 3} width="34" height="6" rx="3" fill="#1a1a1a" transform={`rotate(${-20 + (k % 30)} ${cx} ${cy})`} />
        <circle cx={cx + 2} cy={cy + 4} r="32" fill="rgba(0,0,0,.45)" filter={`url(#bl${uid})`} />
        <circle cx={cx} cy={cy} r="31" fill="#2b2b2d" />
        <circle cx={cx} cy={cy} r="27" fill="#1d1d1f" />
        <g clipPath={`url(#cl${uid})`}>
          <circle cx={cx} cy={cy} r="25" fill={`hsl(${fh} ${fs}% ${fl - 6}%)`} />
          <rect x={cx - 25} y={cy - 25} width="50" height="50" filter={`url(#fd${uid})`} opacity=".7" />
          {garn.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={i % 3 === 0 ? 3.2 : 1.4} fill={i % 3 === 0 ? '#f4e9c9' : i % 3 === 1 ? 'hsl(110 55% 36%)' : 'hsl(8 78% 48%)'} />)}
          <ellipse cx={cx - 9} cy={cy - 10} rx="10" ry="4" fill="#fff" opacity=".14" transform={`rotate(-30 ${cx - 9} ${cy - 10})`} />
        </g>
      </>}
      <rect y={Y0} width="100" height={H} fill={`url(#lt${uid})`} />
    </svg>
  );
}
// 视频文案：默认 2 行，超出时「Expand」，展开后可「Collapse」（美国录屏发现页 / 搜索播放器）
export function CapText({ text }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(null);
  useLayoutEffect(() => {
    if (over || open) return undefined;
    const el = ref.current; if (!el) return undefined;
    const check = () => { if (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1) setOver(true); };
    check(); const ro = new ResizeObserver(check); ro.observe(el); return () => ro.disconnect();
  }, [text, open, over]);
  useEffect(() => { setOver(null); setOpen(false); }, [text]);
  if (open) return <div className="cap-wrap open"><div className="cap-text open">{text} <button className="cap-tog" data-act="caption-collapse" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>Collapse</button></div></div>;
  if (over) return <div className="cap-wrap"><div className="cap-text fold"><button className="cap-tog float" data-act="caption-expand" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>Expand</button>{text}</div></div>;
  return <div className="cap-wrap"><div ref={ref} className="cap-text clamp">{text}</div></div>;
}
// 口播人像：背景虚化光斑 + 半身剪影 + 环形补光高光
const SKIN = ['#e9b996', '#c98e68', '#8d5a3c', '#f1c9a8', '#a8714f'];
const HAIR = ['#2a1d17', '#5a3a24', '#111', '#8a5a2b', '#3b2a22'];
function PortraitScene({ k, uid, Y0, H }) {
  const bg = `hsl(${(k * 3) % 360} 28% 30%)`, bg2 = `hsl(${(k * 3 + 40) % 360} 35% 52%)`;
  const skin = SKIN[k % SKIN.length], hair = HAIR[(k >> 2) % HAIR.length], top = `hsl(${(k * 7) % 360} 35% ${30 + (k % 4) * 8}%)`;
  const dots = Array.from({ length: 7 }, (_, i) => [rnd(k + i) * 100, Y0 + rnd(k + i + 20) * H * 0.55, 6 + rnd(k + i + 5) * 9]);
  return (
    <svg className="scene" viewBox={`0 ${Y0} 100 ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`pb${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={bg2} /><stop offset="1" stopColor={bg} /></linearGradient>
        <filter id={`pf${uid}`}><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={`pp${uid}`}><feGaussianBlur stdDeviation=".45" /></filter>
        <radialGradient id={`ps${uid}`} cx=".38" cy=".38" r=".75"><stop offset="0" stopColor={skin} style={{ filter: 'brightness(1.1)' }} /><stop offset=".7" stopColor={skin} /><stop offset="1" stopColor="rgba(60,30,20,.55)" /></radialGradient>
        <radialGradient id={`pl${uid}`} cx=".35" cy=".3" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".22" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".4" /></radialGradient>
      </defs>
      <rect y={Y0} width="100" height={H} fill={`url(#pb${uid})`} />
      <g filter={`url(#pf${uid})`} opacity=".55">{dots.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#ffe9c2' : '#fff'} opacity={0.35 + (i % 3) * 0.15} />)}</g>
      <g filter={`url(#pp${uid})`}>
        <path d={`M14 ${Y0 + H} C16 78 30 70 50 70 S84 78 86 ${Y0 + H} Z`} fill={top} />
        <path d="M43 60h14v12c-3 3-11 3-14 0z" fill={skin} />
        <path d="M43 62c3 2.5 11 2.5 14 0v3c-4 2.5-10 2.5-14 0z" fill="rgba(0,0,0,.12)" />
        <ellipse cx="50" cy="46" rx="13" ry="16" fill={`url(#ps${uid})`} />
        <path d="M36.5 47c-1-14 5-21 13.5-21s15 6 13.8 21c-1.5-6-4-10-6.8-11.5-3.4 2.4-9 3.6-15.6 2.6-2.6 2-4.2 5-4.9 8.9z" fill={hair} />
        {k % 2 === 0 && <path d="M36.5 47c-2 10-1 22 3 28l3-2c-3-6-4.5-14-3-24zM63.5 47c2 10 1 22-3 28l-3-2c3-6 4.5-14 3-24z" fill={hair} />}
      </g>
      <rect y={Y0} width="100" height={H} fill={`url(#pl${uid})`} />
    </svg>
  );
}
// 商品陈列：浅色背景布 + 包装盒 + 瓶子 / 小物 + 投影
function ProductScene({ k, uid, Y0, H }) {
  const base = `hsl(${(k * 5) % 360} 40% 86%)`, base2 = `hsl(${(k * 5) % 360} 30% 74%)`;
  const box = `hsl(${(k * 11 + 20) % 360} 45% 58%)`, bottle = `hsl(${(k * 13 + 180) % 360} 40% 46%)`;
  return (
    <svg className="scene" viewBox={`0 ${Y0} 100 ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`qb${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={base} /><stop offset="1" stopColor={base2} /></linearGradient>
        <linearGradient id={`qx${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={bottle} /><stop offset=".45" stopColor="#fff" stopOpacity=".55" /><stop offset=".6" stopColor={bottle} /></linearGradient>
        <filter id={`qs${uid}`}><feGaussianBlur stdDeviation="2" /></filter>
        <radialGradient id={`ql${uid}`} cx=".3" cy=".25" r=".95"><stop offset="0" stopColor="#fff" stopOpacity=".3" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".25" /></radialGradient>
      </defs>
      <rect y={Y0} width="100" height={H} fill={`url(#qb${uid})`} />
      <ellipse cx="50" cy="72" rx="40" ry="6" fill="rgba(0,0,0,.28)" filter={`url(#qs${uid})`} />
      <path d="M18 44h34v28H18z" fill={box} />
      <path d="M18 44l8-7h34l-8 7z" fill={box} style={{ filter: 'brightness(1.18)' }} />
      <path d="M52 44l8-7v28l-8 7z" fill={box} style={{ filter: 'brightness(.8)' }} />
      <rect x="24" y="53" width="22" height="3" rx="1" fill="#fff" opacity=".8" /><rect x="24" y="58.5" width="14" height="2" rx="1" fill="#fff" opacity=".55" />
      <rect x="64" y="34" width="14" height="38" rx="4" fill={`url(#qx${uid})`} />
      <rect x="67" y="27" width="8" height="8" rx="1.5" fill="#2b2b2b" />
      <rect x="66" y="46" width="10" height="12" rx="1" fill="#fff" opacity=".85" />
      {k % 2 === 0 && <circle cx="84" cy="66" r="5" fill={`hsl(${(k * 17) % 360} 55% 60%)`} />}
      <rect y={Y0} width="100" height={H} fill={`url(#ql${uid})`} />
    </svg>
  );
}
export function Cover({ item, w = 56, h = 74, t = 0, showDur, radius = 4, big, text = true, playing }) {
  const hue = item?.hue ?? 200;
  return (
    <div className={`cover ${playing ? 'playing' : ''}`} style={{ width: w, height: h, borderRadius: radius }}>
      {coverUrl(item) ? <img className="cover-img" src={coverUrl(item)} alt="" draggable={false} /> : <Scene hue={hue} t={t} still={!t} aspect={h / w} kind={item?.scene} />}
      {text && !showDur && item?.coverText && w >= 48 && <span className="cover-text" style={{ fontSize: Math.max(6, w * 0.11) }}>{item.coverText}</span>}
      {showDur && <span className="cover-dur">{showDur}</span>}
    </div>
  );
}

export function Empty({ title, desc, art = 'drafts' }) {
  return (
    <div className="empty">
      <Illo name={`empty-${art}`} className="illo-empty" fallback={<svg width="132" height="104" viewBox="0 0 132 104" fill="none" stroke="#161823" strokeWidth="1.6" strokeLinecap="round">
        {art === 'drafts' ? (
          <>
            {/* 美国 2026-11-22（usrec 1:14）：竖放手机 + 播放键 + 粉色「+」按钮 + 手指 + 灯泡 + 星芒 + 动感线 */}
            <rect x="52" y="14" width="34" height="62" rx="5" fill="#fff" />
            <path d="M58 21h20" />
            <path d="m64 38 10 6-10 6z" />
            <rect x="56" y="58" width="22" height="9" rx="2.5" fill="#fe2c55" stroke="none" />
            <path d="M67 60.2v4.6M64.7 62.5h4.6" stroke="#fff" strokeWidth="1.5" />
            <path d="M74 66c1-3 4-4 5.5-2l1-3c.8-2 3.4-1.4 3.4.6l.4 2.5c.6-1.5 3.4-1.2 3.3.8l-.2 2.4c.8-1 3-.6 2.8 1.2-.4 4-1.6 8-5.5 9.6-3.6 1.5-8 .3-10.2-3.6z" fill="#fff" />
            <circle cx="29" cy="34" r="6.2" fill="#fff" /><path d="M26.7 34.6c0-1.6 2.6-1.6 2.6 0s2.6 1.6 2.6 0" /><rect x="33" y="37" width="5" height="4" rx="1" transform="rotate(40 35 39)" fill="#fe2c55" stroke="none" />
            <path d="M24 22l-2-3.5M18.5 29.5l-3.5-1.5M18.5 38h-3.8" />
            <path d="M93 18l3-5M98 24.5l5-2.5M98 30.5h4.5" />
            <path d="m36 52 1.4 3.6 3.6 1.4-3.6 1.4L36 62l-1.4-3.6-3.6-1.4 3.6-1.4z" fill="#161823" stroke="none" />
            <path d="M93 52c4 1 9-1 11-5 1.5-3-2-4-3.2-1.6-1 2 1.4 4.4 4 4.4 3 0 5.2-2 6.2-4" />
          </>
        ) : (
          <><circle cx="66" cy="50" r="28" /><path d="M54 50h24M66 38v24" /></>
        )}
      </svg>} />
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
    </div>
  );
}

export function Spinner({ dark }) {
  return <div className={`tt-spinner ${dark ? 'dark' : ''}`}><i /><i /></div>;
}

export function Row({ icon, label, value, onPress, act, sub, dot, last }) {
  return (
    <button className={`list-row ${last ? 'last' : ''}`} data-act={act} onClick={onPress}>
      {icon && <span className="lr-icon">{icon}</span>}
      <span className="lr-label">{label}{dot && <i className="red-dot" />}{sub && <small>{sub}</small>}</span>
      {value && <span className="lr-value">{value}</span>}
      <I.right size={18} />
    </button>
  );
}
