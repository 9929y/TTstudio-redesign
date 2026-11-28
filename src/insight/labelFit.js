// 圆环图（模块 A / E）的标签摆放，2026-11-27 Yanice：
// 「5 个标签离圆环的位置有的近有的远，要整体调整，不能贴特别近，选中（hover）之后也要同步变远」
// 规则：锚点 = 当前外沿（选中扇区外扩到 RO×1.1）+ 固定 GAP；文字块离圆心最近的那条边或角落在锚点上
// （右侧左对齐、左侧右对齐、正上下居中；竖直方向按 sin 连续偏移半行高），所以每个方向到圆环的最短距离都一样。
// 横向放不下时（比如选中后的 Engagement 会顶出卡片），不缩距离，而是沿圆弧往远离水平线的方向滑，直到放得下。
export const LAB_GAP = 12;
const HALF = 9;          // 文字行高 18 的一半
const DOT = 13;          // 色点 8 + 间距 5
const PAD = 10;          // 允许伸进卡片内边距 10pt（卡片边距 16，离卡片边缘至少留 6pt）

let ctx = null;
export function labelWidth(text) {
  if (typeof document === 'undefined') return DOT + String(text).length * 7.5;
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  const fam = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  ctx.font = `400 13px ${fam}`;
  return DOT + Math.ceil(ctx.measureText(String(text)).width);
}

// m0：扇区中线角度（度，0 = 3 点钟，顺时针为正）；r：外沿 + GAP；CX/CY：圆心；W：图宽（345）
export function placeLabel(m0, r, CX, CY, W, text) {
  const w = labelWidth(text), right = W + PAD, left = -PAD;
  let m = m0;
  for (let k = 0; k < 60; k++) {
    const c = Math.cos(m * Math.PI / 180), s = Math.sin(m * Math.PI / 180), x = CX + r * c;
    if (Math.abs(c) < 0.2 || (c > 0 && x + w <= right) || (c < 0 && x - w >= left)) break;
    m += (s >= 0 ? 1 : -1) * (c > 0 ? 1 : -1);
  }
  const a = m * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const qx = CX + r * c, qy = CY + r * s, top = qy + s * HALF;
  if (Math.abs(c) < 0.2) return { left: qx - 60, width: 120, top, align: 'center' };
  if (c > 0) return { left: qx, width: right - qx, top, align: 'flex-start' };
  return { left: left, width: qx - left, top, align: 'flex-end' };
}
