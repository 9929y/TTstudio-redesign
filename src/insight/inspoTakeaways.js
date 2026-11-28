// "Inspire you" card (Inspiration › Analysis › Post), 2026-11-28 Yanice: instead of four double-bar metrics, two plain
// rows — 1. Engagement (likes + comments), 2. Reach (views) — each against your typical post. What viewers said in the
// comments goes into the AI summary above, not into these rows. Both rows name the baseline the same way (2026-11-28):
// "… My typical post: <value>".
import { INSPIRATION } from '../data/seed.js';

export const INSPO_TITLE = 'Inspire you';

export function inspoTakeaways(D) {
  const item = INSPIRATION.find((x) => x.id === D?.id);
  if (!item || !D.rows || D.rows.length < 3) return null;
  const [views, likes, comments] = D.rows; // build.js buildModuleD: Views, Likes per 1K, Comments per 1K, Favorites per 1K
  const n = (x) => String(x).replace(/(\d{3})\.0(?=[KM]$)/, '$1'); // 860.0K → 860K; 3.0K stays as elsewhere in the app
  const eng = (a, b) => (parseFloat(a) + parseFloat(b)).toFixed(1);
  return [
    { k: 'engagement', label: 'Engagement', t: `${eng(likes.val, comments.val)} likes and comments per 1K views. My typical post: ${eng(likes.yv, comments.yv)}` },
    { k: 'reach', label: 'Reach', t: `${n(views.val)} views. My typical post: ${n(views.yv)}` },
  ];
}
