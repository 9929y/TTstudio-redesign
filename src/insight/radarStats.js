// Numbers the radar card shows beyond build.js accountRadar / postRadar (2026-11-28, Yanice approved
// optimisation 1 + 2): a status word per axis, the "vs typical" comparison in the first tile, and the size
// of the comparison group. Everything is derived from the radar areas, which build.js computes from data/peers.js.
import { COHORT } from '../data/peers.js';
import { postRadarGroupSize } from './build.js';

// Status = where the percentile (share of the group you are ahead of) falls.
// Average is the band around the middle of the group: ahead of 40–59%. The card's own insight says
// "beat most similar creators" from 60% up, so Strong starts there and the two never disagree.
export const STATUS_STRONG = 60; // ahead of 60% or more
export const STATUS_BEHIND = 40; // ahead of fewer than 40%
export const STATUS = {
  strong: { word: 'Strong', tone: 'up' },
  average: { word: 'Average', tone: 'flat' },
  behind: { word: 'Behind', tone: 'down' },
};
export function statusOf(rank) {
  if (!Number.isFinite(rank)) return { key: 'average', ...STATUS.average };
  const key = rank >= STATUS_STRONG ? 'strong' : rank < STATUS_BEHIND ? 'behind' : 'average';
  return { key, ...STATUS[key] };
}
export const statusRule = () =>
  `Strong means you are ahead of ${STATUS_STRONG}% or more of them, Average ${STATUS_BEHIND}–${STATUS_STRONG - 1}%, Behind fewer than ${STATUS_BEHIND}%.`;

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

// Areas from build.js + status + comparison, ready for the card.
export function withRadarStats(areas) {
  return (areas || []).map((a) => ({ ...a, status: statusOf(a.rank), vs: vsTypical(a.own, a.peer) }));
}
