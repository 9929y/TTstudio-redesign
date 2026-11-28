// Creator Assistant 入口（2026-11-26；出场光 2026-11-27 二版）
// - AskPill：首页深色头部的主入口；Inbox 顶部也有一个（tone="light"）。蓝色渐变描边 = AI 按钮；第一次出现时，一道很淡的斜光从左下扫到右上，
//   连边框一起亮一下（见 AskAssistant.css「出场光」）。文案每 4.5 秒轮播一条可问的问题。
// - AskRow：模块卡（A / B / E / D）底部的入口行。默认轮播 3–5 条和这张卡相关的问题；用户在图上选中某一项时，文案换成和这一项相关的问题并停止轮播。
//   第一次出现时，顶部分隔线上走一道蓝色渐变。
// 文案字重：按设计系统里「建议的问题」样式（Assistant 欢迎页问题行 16/22、追问 chip 14/18，都是 400），不用粗体。
// 节奏：停留 3.6–4 秒、切换 320ms（上移淡出 / 下方淡入），同搜索框占位词轮播的常见做法；减弱动态时不轮播、不转圈，只淡入淡出。
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './AskAssistant.css';

const SEEN = new Set(); // 每个入口在一次会话里只做一次「首次出现」动效
const EASE = [0.23, 1, 0.32, 1];
const EASE_IO = [0.65, 0, 0.35, 1]; // 屏幕上移动的元素用 ease-in-out

function useOnScreen(ref) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

// 轮播：列表变化时从第一条重新开始；fixed 有值时显示 fixed、不轮播
export function useRotatingPrompt(list, { interval = 3600, fixed = null, ref } = {}) {
  const reduce = useReducedMotion();
  const onScreen = useOnScreen(ref);
  const key = list.join('|');
  const [i, setI] = useState(0);
  useEffect(() => { setI(0); }, [key]);
  // 取消选中（fixed 变回空）时从第一条重新轮播：默认态先出现页面级问题（评分图联动 2026-11-26）
  useEffect(() => { if (!fixed) setI(0); }, [fixed]);
  useEffect(() => {
    if (fixed || reduce || list.length < 2 || !onScreen) return undefined;
    const t = setInterval(() => { if (!document.hidden) setI((n) => (n + 1) % list.length); }, interval);
    return () => clearInterval(t);
  }, [key, fixed, reduce, onScreen, interval, list.length]);
  return fixed || list[i % Math.max(1, list.length)] || '';
}

function useFirstAppearance(act) {
  const reduce = useReducedMotion();
  const [sweep] = useState(() => !reduce && !SEEN.has(act));
  useEffect(() => { SEEN.add(act); }, [act]);
  return sweep;
}

function Rolling({ text, className }) {
  const reduce = useReducedMotion();
  return (
    <span className={`ask-roll ${className || ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {/* 换字（2026-11-26 按 Yanice 反馈放慢）：参照搜索框占位词轮播的常见节奏，进场 500ms、出场 420ms，
            ease-in-out（在屏幕上移动的元素），位移 8px，不加模糊；旧句先往上走，新句从下方接上，读起来是平稳地滚过去 */}
        <motion.span key={text} className="ask-roll-t"
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(8px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-8px)', transition: { duration: 0.42, ease: EASE_IO } }}
          transition={{ duration: reduce ? 0.2 : 0.5, ease: EASE_IO }}>
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// 首页主入口出场（2026-11-26，6 个方案经独立评审选定「渐变描画」）：
// 灰边 → 品牌渐变沿边框从左端（Logo 一侧）顺时针匀速描一圈，前沿带一小段青色亮光，描完停在静止的渐变边。
// 按「沿边框的长度」移动（SVG 路径 + pathLength），不按角度旋转：这颗胶囊约 8:1，旋转锥形渐变时光在长边中段爬、在两端甩，
// 同一次播放里既嫌慢又嫌快（前两版的问题）。1.8s、sine in-out、延迟 0.4s；点按时直接跳到结束；减弱动态效果时 250ms 淡入。
const DRAW = { delay: 400, duration: 1800, easing: 'cubic-bezier(0.37, 0, 0.63, 1)' };
const TIPS = [ // 前沿亮光：尾部淡青 → 头部近白，长度按像素
  { len: 28, color: '#25f4ee', opacity: 0.45 },
  { len: 12, color: '#7ff9f5', opacity: 0.9 },
  { len: 4, color: '#eafffe', opacity: 1 },
];
function pillOutline(W, H) {
  const r = 9.25, x0 = 0.75, y0 = 0.75, x1 = W - 0.75, y1 = H - 0.75, cy = H / 2;
  const d = `M ${x0} ${cy} V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r} V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r} Z`;
  const P = 2 * (x1 - x0 - 2 * r) + 2 * (y1 - y0 - 2 * r) + 2 * Math.PI * r;
  return { d, P };
}

// 首页主入口（Inbox 顶部也用，传 tone="light"）。2026-11-27 夜 Yanice：入场「还是要改回昨天的版本」——斜光两版都撤掉，回到 11-26 选定的渐变描画
export function AskPill({ prompts, onAsk, act = 'assistant-pop-home', icon, tone = 'dark' }) {
  const ref = useRef(null);
  const svgRef = useRef(null);
  const anims = useRef([]);
  const reduce = useReducedMotion();
  const text = useRotatingPrompt(prompts, { interval: 2500, ref }); // 2026-11-27 夜 Yanice：滚动太慢，4.5s → 2.5s
  const first = useFirstAppearance(act);
  const [intro, setIntro] = useState(first);
  // 在首帧绘制前就挂上动画（fill: both），灰边从第一帧开始，不会先闪一下渐变
  useLayoutEffect(() => {
    if (!intro) return undefined;
    const btn = ref.current, svg = svgRef.current;
    if (!btn || !svg || !svg.animate) { setIntro(false); return undefined; }
    const { width: W, height: H } = btn.getBoundingClientRect();
    const { d, P } = pillOutline(W, H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const [cover, ...tips] = svg.querySelectorAll('path');
    [cover, ...tips].forEach((el) => el.setAttribute('d', d));
    const list = [];
    if (reduce) {
      tips.forEach((t) => { t.style.display = 'none'; });
      list.push(cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, delay: DRAW.delay, fill: 'both' }));
    } else {
      // 灰色盖边从起点顺时针退开（dashoffset 0 → -100），露出下面的品牌渐变
      list.push(cover.animate([{ strokeDashoffset: '0' }, { strokeDashoffset: '-100' }], { ...DRAW, fill: 'both' }));
      tips.forEach((t, i) => {
        const L = (TIPS[i].len / P) * 100;
        t.style.strokeDasharray = `${L} ${200 - L}`;
        list.push(t.animate([{ strokeDashoffset: `${L}` }, { strokeDashoffset: `${L - 100}` }], { ...DRAW, fill: 'both' }));
        list.push(t.animate([{ opacity: 0 }, { opacity: TIPS[i].opacity, offset: 150 / DRAW.duration }, { opacity: TIPS[i].opacity, offset: 1 - 300 / DRAW.duration }, { opacity: 0 }],
          { duration: DRAW.duration, delay: DRAW.delay, fill: 'both' }));
      });
    }
    anims.current = list;
    list[0].finished.then(() => setIntro(false)).catch(() => {});
    return () => list.forEach((a) => a.cancel());
  }, [intro, reduce]);
  // 描画途中被点按：直接跳到结束状态，再照常打开 Creator Assistant
  const press = () => { anims.current.forEach((a) => { try { a.finish(); } catch { /* 已结束 */ } }); onAsk(text); };
  return (
    <button ref={ref} type="button" className={`ask-pill${tone === 'light' ? ' is-light' : ''}`} data-act={act} onClick={press}>
      {intro && (
        <svg ref={svgRef} className="ask-pill-draw" aria-hidden="true" preserveAspectRatio="none">
          <path pathLength="100" fill="none" stroke={tone === 'light' ? '#d6d6da' : '#4a4a4f'} strokeWidth="2.5" strokeDasharray="100 100" strokeDashoffset="0" />
          {TIPS.map((t) => <path key={t.len} pathLength="100" fill="none" stroke={t.color} strokeWidth="2.5" style={{ opacity: 0 }} />)}
        </svg>
      )}
      <span className="ask-pill-in">
        {icon}
        <span className="sr-only">Ask Creator Assistant: </span>
        <Rolling text={text} className="ask-pill-roll" />
        <svg className="ask-pill-go" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="#8a8b91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </button>
  );
}

// 模块卡底部入口行（样式沿用 Final 画板的 Ask 行：高 44、顶部 0.5px 分隔线、图标 22）
export function AskRow({ prompts, fixed, onAsk, act, icon, seenKey }) {
  const ref = useRef(null);
  const text = useRotatingPrompt(prompts, { interval: 2500, fixed, ref }); // 2026-11-27 夜 Yanice：5s → 2.5s，和胶囊一致
  return (
    <button ref={ref} type="button" className={`ask-row rose-press ${fixed ? 'is-fixed' : ''}`} data-act={act} onClick={() => onAsk(text)}>
      {icon}
      <span className="sr-only">Ask Creator Assistant: </span>
      <Rolling text={text} className="ask-row-roll" />
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}><path d="M9 6l6 6-6 6" fill="none" stroke="#8a8b91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}
