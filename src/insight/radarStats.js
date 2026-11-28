// Numbers the radar card shows beyond build.js accountRadar / postRadar: the label lines, the two comparison tiles and
// the Rewards split. Everything is derived from the radar areas, which build.js computes from seed.js / peers.js.
// 2026-11-28 content plan (Yanice): each element answers one question and none repeats another.
//  - Axis label = how much: metric name over its absolute value ("Views" / "14.7K"). No rank on the labels.
//  - Two tiles built exactly like the Key metrics tile (label / value / change pill + grey difference):
//    tile 1 = your baseline (account: previous 7 days, post: your typical post) and how you changed against it,
//    tile 2 = the typical similar creator / video and your gap to it.
//  - Rewards (account): where the money comes from instead of the comparison tiles.
import { COHORT } from '../data/peers.js';
import { fmtStat, fmtCount, fmtMoney } from '../data/agg.js';
import { postRadarGroupSize, rewardsSplit } from './build.js';

// Shorter display names, keyed by area key, so selection, Ask questions and Key metrics sync are unchanged.
// Engagement = likes + comments per view (2026-11-28 Yanice: back to "Engagement" from "Reactions"); Follows = share of
// viewers who followed (the area is named "New follows" in build.js).
const SHORT_NAME = { Follows: 'Follows' };

const TILE = {
  account: { usual: 'Previous 7 days', peer: 'Typical similar creator' },
  post: { usual: 'My typical post', peer: 'Typical similar video' },
};

// Change pill, the Key metrics rule (kit.jsx Delta, DESIGN_SPEC "Colours"): above +1% up (blue, arrow up), below −1%
// down (orange, arrow down), otherwise flat grey with no arrow; one decimal, trailing ".0" dropped ("10.6%", "23%").
// From +100% it is a multiple, the app's existing "×" format: one decimal under 10× ("3.6×", "3×"), whole above ("31×").
export function change(own, base) {
  if (!Number.isFinite(own) || !Number.isFinite(base) || base <= 0) return null;
  const pct = ((own - base) / base) * 100;
  const tone = pct > 1 ? 'up' : pct < -1 ? 'down' : 'flat';
  const ratio = own / base;
  const text = pct >= 100 ? (ratio >= 10 ? `${Math.round(ratio)}×` : `${+ratio.toFixed(1)}×`) : `${+Math.abs(pct).toFixed(1)}%`;
  return { tone, pct, text };
}

// Grey difference after the pill, in the metric's own unit, signed like Key metrics (+ / −, "0" when it rounds away):
// counts as Key metrics writes them (fmtStat), post views as the Video analysis header writes them (fmtCount), money as
// "$0.35", rates in percentage points with the axis value's decimals ("−2.5 pts", "+0.07 pts"). A rate gap is taken
// between the two rates as shown (5.6% and 8.1% → −2.5 pts), so the row always matches the subtraction on screen.
const MINUS = '−';
export function difference(own, base, unit) {
  const d = own - base;
  if (!Number.isFinite(d)) return '';
  if (unit === 'rate1' || unit === 'rate2') {
    const k = unit === 'rate1' ? 1 : 2, r = (x) => Math.round(x * 100 * 10 ** k);
    const steps = r(own) - r(base);
    return steps === 0 ? '0 pts' : `${steps > 0 ? '+' : MINUS}${(Math.abs(steps) / 10 ** k).toFixed(k)} pts`;
  }
  const sign = d > 0 ? '+' : MINUS, a = Math.abs(d);
  if (unit === 'money') return a < 0.005 ? '+$0.00' : sign + fmtMoney(a);
  if (a < 0.5) return '0';
  return sign + (unit === 'postCount' ? fmtCount(a) : fmtStat(a));
}

export function groupSize(scope, post) {
  return scope === 'post' ? postRadarGroupSize(post) : COHORT.n;
}

// One comparison tile: the baseline as the value, your change against it in the row. No baseline = graceful fallback:
// "–" as the value and a short reason in the row, never a made-up number.
function compareTile(key, label, own, base, baseText, unit, missing) {
  const c = change(own, base);
  return c && baseText
    ? { key, label, value: baseText, tone: c.tone, pill: c.text, abs: difference(own, base, unit) }
    : { key, label, value: '–', abs: missing, empty: true };
}

// Rewards = gifts + Creator Rewards (only posts of 60 s or longer earn Creator Rewards; build.js rewardsSplit, the same
// split the Rewards analytics page and Creator Assistant show). The account radar is always the last 7 days, the window
// rewardsSplit(7) sums. Gifts is everything that is not Creator Rewards; seed.js models it as LIVE Gifts, the name the
// Rewards analytics page uses. The split is only shown when it adds up to the radar's own Rewards number; the row is each
// part's share of that total (the two shares add up to 100%).
export function rewardsBreakdown(area) {
  if (!area || area.key !== 'Rewards' || !Number.isFinite(area.own)) return null;
  const s = rewardsSplit(7);
  if (!(s.total > 0) || Math.abs(s.total - area.own) >= 0.005 || Math.abs(s.gifts + s.crp - s.total) >= 0.005) return null;
  const g = Math.round((s.gifts / s.total) * 100);
  return [
    { key: 'gifts', label: 'Gifts', money: s.gifts.toFixed(2), abs: `${g}% of rewards` },
    { key: 'crp', label: 'Creator Rewards', money: s.crp.toFixed(2), abs: `${100 - g}% of rewards` },
  ];
}

// Areas from build.js + label lines + the two tiles, ready for the card.
export function withRadarStats(areas, scope = 'account') {
  const T = TILE[scope] || TILE.account;
  return (areas || []).map((a) => {
    const name = SHORT_NAME[a.key] || a.name;
    const u = a.usual || {};
    const tiles = [
      compareTile('usual', T.usual, a.own, u.base, u.text, a.unit, 'Not enough history yet'),
      compareTile('peer', T.peer, a.own, a.peer, a.peerText, a.unit, 'Not enough data yet'),
    ];
    // Label trend arrow = the tile-1 change: vs the previous 7 days on the account radar (the Key metrics delta direction),
    // vs my typical post on the post radar. Same ±1% flat band as Key metrics = no arrow; no baseline = no arrow.
    const trend = tiles[0].empty ? 'flat' : tiles[0].tone;
    return { ...a, name, line1: name, line2: a.ownText, trend, tiles };
  });
}
