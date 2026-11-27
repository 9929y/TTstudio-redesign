// Creator Assistant 入口（2026-11-26）
// - AskPill：首页深色头部的主入口。蓝色渐变描边 = AI 按钮；第一次出现时描边转一圈并带一次光晕。文案按 3.6 秒轮播 5–10 条可问的问题。
// - AskRow：模块卡（A / B / E / D）底部的入口行。默认轮播 3–5 条和这张卡相关的问题；用户在图上选中某一项时，文案换成和这一项相关的问题并停止轮播。
//   第一次出现时，顶部分隔线上走一道蓝色渐变。
// 文案字重：按设计系统里「建议的问题」样式（Assistant 欢迎页问题行 16/22、追问 chip 14/18，都是 400），不用粗体。
// 节奏：停留 3.6–4 秒、切换 320ms（上移淡出 / 下方淡入），同搜索框占位词轮播的常见做法；减弱动态时不轮播、不转圈，只淡入淡出。
import { useEffect, useRef, useState } from 'react';
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
        {/* 换字（2026-11-26 按反馈放慢）：参照搜索框占位词轮播的常见节奏，进场 500ms、出场 420ms，
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

// 首页主入口
export function AskPill({ prompts, onAsk, act = 'assistant-pop-home', icon }) {
  const ref = useRef(null);
  const text = useRotatingPrompt(prompts, { interval: 4500, ref });
  const sweep = useFirstAppearance(act);
  return (
    <button ref={ref} type="button" className={`ask-pill ${sweep ? 'sweep' : ''}`} data-act={act} onClick={() => onAsk(text)}>
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
  const text = useRotatingPrompt(prompts, { interval: 5000, fixed, ref });
  return (
    <button ref={ref} type="button" className={`ask-row rose-press ${fixed ? 'is-fixed' : ''}`} data-act={act} onClick={() => onAsk(text)}>
      {icon}
      <span className="sr-only">Ask Creator Assistant: </span>
      <Rolling text={text} className="ask-row-roll" />
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}><path d="M9 6l6 6-6 6" fill="none" stroke="#8a8b91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}
