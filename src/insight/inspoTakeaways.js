// "Inspire you" card (Inspiration › Analysis › Post), 2026-11-28 Yanice: the double-bar chart, reduced to two metrics —
// 1. Engagement (likes + comments per 1K views), 2. Reach (views) — "This post" against "My typical post", in the same
// view-only CompareRows as Content summary (ModuleD.jsx). What viewers said in the comments goes into the AI summary
// above, not into these rows. Numbers come from build.js buildModuleD (its rows carry the raw a / b values).
import { INSPIRATION } from '../data/seed.js';
import { D_COLORS } from './build.js';

export const INSPO_TITLE = 'Inspire you';
export const INSPO_LABELS = ['This post', 'My typical post'];

// Same scale as the other double bars: the larger of the pair fills 62% of the track.
const widths = (a, b) => { const m = Math.max(a, b, 0) || 1; const w = (x) => `${((Math.max(0, x) / m) * 62).toFixed(1)}%`; return [w(a), w(b)]; };

export function inspoTakeaways(D) {
  const item = INSPIRATION.find((x) => x.id === D?.id);
  if (!item || !D.rows || D.rows.length < 3 || D.rows.slice(0, 3).some((r) => !Number.isFinite(r.a) || !Number.isFinite(r.b))) return null;
  const [views, likes, comments] = D.rows; // build.js buildModuleD: Views, Likes per 1K, Comments per 1K, Favorites per 1K
  const n = (x) => String(x).replace(/(\d{3})\.0(?=[KM]$)/, '$1'); // 860.0K → 860K; 3.0K stays as elsewhere in the app
  const eng = { a: likes.a + comments.a, b: likes.b + comments.b };
  return [
    { label: 'Engagement', a: eng.a, b: eng.b, val: eng.a.toFixed(1), yv: eng.b.toFixed(1) },
    { label: 'Reach', a: views.a, b: views.b, val: n(views.val), yv: n(views.yv) },
  ].map((r, i) => {
    const [w, yw] = widths(r.a, r.b);
    return { label: r.label, val: r.val, yv: r.yv, w, yw, c: D_COLORS[i][0], yc: D_COLORS[i][1] };
  });
}
