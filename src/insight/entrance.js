// 数据卡入场编排（2026-11-27）
// 骨架屏换成内容、或推进一个新页面时，数据卡按这个顺序出现，总时长不到 1 秒：
//   1. 卡片整体淡入并上移 6px（app.css .enter-card，320ms）
//   2. 图形从内圈按顺序长出来（每块错开 50ms，每块 500ms，强 ease-out，不回弹）
//   3. 标签、中心数字在图形长到一半时淡入
// 之后的点选切换仍用各组件自己的 240ms 过渡，不再带延迟。
// 系统开了「减弱动态效果」时不做生长，只淡入（app.css 里的 reduced-motion 规则）。
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export const ENTER_EASE = [0.23, 1, 0.32, 1];
const SEG_START = 0.12, SEG_STEP = 0.05, SEG_DUR = 0.5;

// 挂载后的这段时间内算「入场中」；之后组件回到普通的交互过渡
export function useEntering(ms = 1100) {
  const reduce = useReducedMotion();
  const [on, setOn] = useState(!reduce);
  useEffect(() => {
    if (!on) return undefined;
    const t = setTimeout(() => setOn(false), ms);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return on;
}

// 第 i 块图形的生长过渡；extra 让彩色扇区比灰轨晚一点点出来
export const segIn = (i, extra = 0) => ({ duration: SEG_DUR, ease: ENTER_EASE, delay: SEG_START + i * SEG_STEP + extra });
// 第 i 个标签的淡入延迟（秒）
export const labDelay = (i) => `${SEG_START + 0.16 + i * SEG_STEP}s`;
// 只有鼠标才做悬停预览（触屏没有悬停）
export const isMouse = (e) => e.pointerType === 'mouse';
