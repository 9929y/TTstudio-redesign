import { useLayoutEffect, useRef, useState } from 'react';

// Keep SVG, score overlay, labels and hit areas in one logical-pixel plane.
// The 345px reference geometry is unchanged; on narrow screens only radii
// shrink, not typography or touch targets.
export function useChartWidth(fallback = 345) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  const [, setFontEpoch] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let alive = true;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    document.fonts?.ready.then(() => { if (alive) { measure(); setFontEpoch((v) => v + 1); } });
    return () => { alive = false; observer?.disconnect(); };
  }, []);
  return [ref, width];
}

export function fitRingGeometry(base, width) {
  const scale = Math.min(1, width / 345);
  return { ...base, CX: width / 2, RI: base.RI * scale, RO: base.RO * scale };
}
