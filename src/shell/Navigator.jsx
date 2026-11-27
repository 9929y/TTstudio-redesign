// iOS 导航栈：push 右侧滑入 + 下层 30% 视差；左边缘可跟手右滑返回。
// 每个 Tab 一个栈，切 Tab 不销毁（保留筛选与滚动位置）。
import { createContext, useContext, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useApp } from '../store.js';

export const W = 393;
export const H = 852;
const PUSH = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.42 };
const INSTANT = { duration: 0 };

const RouteCtx = createContext(null);
export const useRoute = () => useContext(RouteCtx);

function EdgeSwipe({ progress, onCommit }) {
  const st = useRef(null);
  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    st.current = { x0: e.clientX, y0: e.clientY, t: performance.now(), lastX: e.clientX, lastT: performance.now(), v: 0 };
  };
  const move = (e) => {
    if (!st.current) return;
    const scale = e.currentTarget.getBoundingClientRect().width / 24 || 1; // 外壳可能被缩放
    const dx = (e.clientX - st.current.x0) / scale;
    const now = performance.now();
    st.current.v = (e.clientX - st.current.lastX) / scale / Math.max(1, now - st.current.lastT);
    st.current.lastX = e.clientX; st.current.lastT = now;
    progress.set(Math.max(0, Math.min(1, dx / W)));
  };
  const up = (e) => {
    if (!st.current) return;
    const p = progress.get(), v = st.current.v, s0 = st.current;
    st.current = null;
    // 没有拖动的轻点不算侧滑：把点击交给热区下面的控件（否则贴左边的按钮点不到）
    if (e.type === 'pointerup' && Math.abs(e.clientX - s0.x0) + Math.abs(e.clientY - s0.y0) < 6) {
      const el = e.currentTarget;
      el.style.pointerEvents = 'none';
      const under = document.elementFromPoint(e.clientX, e.clientY);
      el.style.pointerEvents = '';
      animate(progress, 0, { duration: 0.1 });
      under?.closest('button, a, input, [role="button"], [role="tab"], [data-act]')?.click();
      return;
    }
    if (p > 0.35 || v > 0.45) {
      animate(progress, 1, { duration: 0.22 * (1 - p) + 0.05, ease: 'easeOut' }).then(onCommit);
    } else {
      animate(progress, 0, { duration: 0.25, ease: 'easeOut' });
    }
  };
  return <div className="edge-swipe" aria-hidden="true" data-act="edge-swipe-back" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />;
}

function Layer({ children, covered, beneath, progress, instant, z, enter, exitTo, isTop, canSwipe, onCommit, route, hidden, dark }) {
  const innerX = useTransform(progress, (p) => (isTop ? p * W : beneath ? p * 0.3 * W : 0));
  const dim = useTransform(progress, (p) => (beneath ? 0.12 * (1 - p) : covered ? 0.12 : 0));
  return (
    <motion.div
      className="nav-layer"
      style={{ zIndex: z, display: hidden ? 'none' : 'block' }}
      initial={enter}
      animate={{ x: covered ? -0.3 * W : 0, y: 0 }}
      exit={exitTo}
      transition={instant.current ? INSTANT : PUSH}
      custom={instant}
    >
      <motion.div className={`nav-inner ${dark ? 'dark' : ''}`} style={{ x: innerX }}>
        <RouteCtx.Provider value={route}>{children}</RouteCtx.Provider>
        <motion.div className="nav-dim" style={{ opacity: dim }} />
        {isTop && canSwipe && <EdgeSwipe progress={progress} onCommit={onCommit} />}
      </motion.div>
    </motion.div>
  );
}

// exit 变体读取 custom（instant ref），跟手返回完成后不再播放第二次退出动画
const exitRight = { x: W, transition: PUSH };

export function TabStack({ tab, root, renderRoute, active, darkRoutes }) {
  const stack = useApp((s) => s.stacks[tab]);
  const pop = useApp((s) => s.pop);
  const progress = useMotionValue(0);
  const instant = useRef(false);
  const commit = () => {
    instant.current = true;
    pop();
    requestAnimationFrame(() => { progress.set(0); requestAnimationFrame(() => (instant.current = false)); });
  };
  const n = stack.length;
  return (
    <div className="tab-stack" style={{ display: active ? 'block' : 'none' }}>
      <Layer covered={n > 0} beneath={n === 1} progress={progress} instant={instant} z={1} enter={false}
        exitTo={undefined} isTop={n === 0} canSwipe={false} route={{ name: `tab:${tab}`, key: `root-${tab}`, params: {}, depth: 0 }}>
        {root}
      </Layer>
      <AnimatePresence initial={false} custom={instant}>
        {stack.map((r, i) => (
          <Layer key={r.key} covered={i < n - 1} beneath={i === n - 2} progress={progress} instant={instant} z={10 + i}
            enter={{ x: W }} exitTo={instant.current ? { x: 0, transition: INSTANT, opacity: 0 } : exitRight}
            isTop={i === n - 1} canSwipe onCommit={commit} route={{ ...r, depth: i + 1 }} dark={darkRoutes?.has(r.name)}>
            {renderRoute(r)}
          </Layer>
        ))}
      </AnimatePresence>
    </div>
  );
}

// 全屏模态栈（上传流程）：第一页自下而上，后续页水平 push（原型假设：录屏只看到 Android 的选择器全屏出现）
export function ModalStack({ renderRoute, darkRoutes }) {
  const modal = useApp((s) => s.modal);
  const pop = useApp((s) => s.pop);
  const progress = useMotionValue(0);
  const instant = useRef(false);
  const commit = () => {
    instant.current = true; pop();
    requestAnimationFrame(() => { progress.set(0); requestAnimationFrame(() => (instant.current = false)); });
  };
  const n = modal.length;
  return (
    <AnimatePresence initial={false}>
      {modal.map((r, i) => (
        <Layer key={r.key} covered={i < n - 1} beneath={i === n - 2} progress={progress} instant={instant} z={200 + i}
          enter={i === 0 ? { y: H } : { x: W }}
          exitTo={i === 0 ? { y: H, transition: PUSH } : instant.current ? { opacity: 0, transition: INSTANT } : exitRight}
          isTop={i === n - 1} canSwipe={i > 0} onCommit={commit} route={{ ...r, depth: i + 1, modal: true }} dark={darkRoutes?.has(r.name)}>
          {renderRoute(r)}
        </Layer>
      ))}
    </AnimatePresence>
  );
}
