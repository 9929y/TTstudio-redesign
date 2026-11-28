// "Compared with your posts" (Inspiration › Analysis › Post), 2026-11-28 Yanice: instead of four double-bar metrics,
// three plain rows about the post's content that a creator can borrow from: what it is about, what its viewers asked
// for, and the one thing that stood out against your own posts.
import { INSPIRATION } from '../data/seed.js';
import { otherPostTopics } from './build.js';

const ASKED = { itinerary: 'The full itinerary', budget: 'The budget', 'part 2': 'A part 2', edit: 'How it was edited', crowds: 'How to skip the crowds', trip: 'Who to bring along' };
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const NOUN_ROW = { likes: 1, comments: 2, favorites: 3 };
const NOUN_WORD = { likes: 'likes', comments: 'comments', favorites: 'saves' };

export function inspoTakeaways(D) {
  const item = INSPIRATION.find((x) => x.id === D?.id);
  if (!item || !D.rows) return null;
  // Topic: the caption's first sentence (ends at . ! ? or an emoji), without hashtags
  const first = item.caption.replace(/#\w+/g, '').split(/[.!?]\s|[\u{1F000}-\u{1FFFF}\u2600-\u27BF]/u)[0];
  const topic = first.replace(/\uFE0F/g, '').replace(/\s+/g, ' ').trim().replace(/[.!?]$/, '');
  const rows = [{ k: 'topic', label: 'Topic', t: topic }];
  const topics = otherPostTopics(item);
  if (topics && topics.length >= 2) rows.push({ k: 'asked', label: 'Viewers asked for', t: `${ASKED[topics[0][1]] || topics[0][0]} and ${lower(ASKED[topics[1][1]] || topics[1][0])}` });
  const r = D.ratio, v = D.rows[0];
  if (r && r.ahead && r.gap >= 1.15) {
    const row = D.rows[NOUN_ROW[r.noun]];
    rows.push({ k: 'stood', label: 'Stood out', t: `More ${NOUN_WORD[r.noun]} than yours: ${row.val} vs ${row.yv} per 1K views` });
  } else {
    rows.push({ k: 'stood', label: 'Stood out', t: `Reach: ${v.val} views. Your typical post gets ${v.yv}` });
  }
  return rows;
}
