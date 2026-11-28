// Numbers the radar card shows beyond build.js accountRadar / postRadar: the label lines, the "vs typical"
// comparison in the metric tile, the Rewards split and the size of the comparison group. Everything is derived
// from the radar areas, which build.js computes from data/peers.js.
// 2026-11-28 (Yanice, Xiaohongshu data-center reference): each axis label is two balanced lines,
// "Views 14.7K" over "Ahead of 60%". The Strong / Typical / Room to grow chips are retired; the ⓘ line
// (peerComparison.js) now explains "Ahead of X%".
import { COHORT } from '../data/peers.js';
import { postRadarGroupSize, rewardsSplit } from './build.js';

// Shorter display names where the full one makes line 1 much wider than "Ahead of X%" (measured, see the
// r3 width matrix). Keyed by area key, so selection, Ask questions and Key metrics sync are unchanged.
// Reactions = likes + comments per view (reviewers found "Engagement" unclear); Follows = share of viewers who followed.
const SHORT_NAME = { Engagement: 'Reactions', Follows: 'Follows' };

// Same change-colour rule as Key metrics (DESIGN_SPEC "Colours", kit.jsx Delta): above +1% up (blue),
// below −1% down (orange), otherwise flat grey with no arrow. From 2× up the gap reads as a multiple
// ("↑ 3×", "↑ 78×" on viral posts) instead of "195.8%" / "7,600%".
export function vsTypical(own, peer) {
  if (!Number.isFinite(own) || !Number.isFinite(peer)) return { tone: 'flat', text: '–' };
  if (peer <= 0) return own > 0 ? { tone: 'up', text: 'Above' } : { tone: 'flat', text: '0%' };
  const pct = ((own - peer) / peer) * 100;
  const tone = pct > 1 ? 'up' : pct < -1 ? 'down' : 'flat';
  const ratio = own / peer;
  const text = ratio >= 10 ? `${Math.round(ratio)}×` : ratio >= 2 ? `${+ratio.toFixed(1)}×` : `${+Math.abs(pct).toFixed(1)}%`;
  return { tone, text };
}

export function groupSize(scope, post) {
  return scope === 'post' ? postRadarGroupSize(post) : COHORT.n;
}

// Rewards = gifts + Creator Rewards (only posts of 60 s or longer earn Creator Rewards; build.js rewardsSplit).
// The account radar is always the last 7 days, the same window rewardsSplit(7) sums. The split is only shown when
// its total is the radar's own Rewards number, so the tile can never show parts that do not add up.
const money = (n) => `$${n.toFixed(2)}`;
export function rewardsBreakdown(area) {
  if (!area || area.key !== 'Rewards' || !Number.isFinite(area.own)) return null;
  const s = rewardsSplit(7);
  if (Math.abs(s.total - area.own) >= 0.005 || Math.abs(s.gifts + s.crp - s.total) >= 0.005) return null;
  return { gifts: s.gifts, crp: s.crp, text: `Gifts ${money(s.gifts)} · Creator Rewards ${money(s.crp)}` };
}

// Areas from build.js + label lines + comparison, ready for the card.
export function withRadarStats(areas) {
  return (areas || []).map((a) => {
    const name = SHORT_NAME[a.key] || a.name;
    return { ...a, name, line1: `${name} ${a.ownText}`, line2: `Ahead of ${a.rankText}`, vs: vsTypical(a.own, a.peer) };
  });
}
