// Content summary (Analytics › Content) double-bar rows — 2026-11-28 Yanice:
// 「在 Content 里面不希望用户是点来看信息的」→ the card shows every comparison at once, in the same double-bar rows as
// "Compared with your posts" (ModuleD CompareRows). One metric per score area: Views, Engagement, Followers.
// Each row = your last 7 days vs a typical similar creator (median of the same cohort and window the scores use).
// Views and Engagement come straight from accountRadar(), so they are the numbers the Overview radar shows;
// Followers is net followers, the metric the Followers score is ranked on (build.js B_DEFS, weekTotals().net).
import { DAILY, PERIOD_END } from '../data/seed.js';
import { COHORT, PEER_WEEKS } from '../data/peers.js';
import { fmtStat } from '../data/agg.js';
import { accountRadar } from './build.js';
import { peerInfo } from './peerComparison.js';

// Row names follow the radar legend ("Your account" / "Similar creators"); the peer value is the group median,
// so it is named the way the cards say it elsewhere: "a typical similar creator".
export const CONTENT_SELF = 'Your account';
export const CONTENT_PEER = 'Typical similar creator';
// Bar colours (owner): original chart blue for you, neutral grey for the typical creator. Never the deep #0d4a96.
export const CONTENT_SELF_COLOR = 'var(--c-blue)';
export const CONTENT_PEER_COLOR = '#c4c5ca';

const median = (xs) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const weekSum = (arr) => { let t = 0; for (let i = PERIOD_END - 6; i <= PERIOD_END; i++) t += arr[i] || 0; return t; };
// Same scale as ModuleD (build.js buildModuleD): the larger of the pair fills 62% of the track.
const widths = (a, b) => { const m = Math.max(a, b, 0) || 1; const w = (x) => `${((Math.max(0, x) / m) * 62).toFixed(1)}%`; return [w(a), w(b)]; };

export function contentCompareRows() {
  const radar = Object.fromEntries(accountRadar().map((r) => [r.name, r]));
  const net = { own: weekSum(DAILY.followersNet), peer: median(PEER_WEEKS.map((w) => w.net)) };
  const rows = [
    { label: 'Views', own: radar.Views.own, peer: radar.Views.peer, val: radar.Views.ownText, yv: radar.Views.peerText },
    { label: 'Engagement', own: radar.Engagement.own, peer: radar.Engagement.peer, val: radar.Engagement.ownText, yv: radar.Engagement.peerText },
    { label: 'Followers', own: net.own, peer: net.peer, val: fmtStat(net.own), yv: fmtStat(net.peer) },
  ];
  return rows.map((r) => {
    const [w, yw] = widths(r.own, r.peer);
    return { label: r.label, val: r.val, yv: r.yv, w, yw, c: CONTENT_SELF_COLOR, yc: CONTENT_PEER_COLOR };
  });
}

// ⓘ drawer for the card: the score items ("Overall score", "Area scores") described numbers the card no longer shows.
// Items 1 and 3 reuse the radar's copy (peerInfo('account')); item 2 explains the bars.
export function contentInfo() {
  const [compared, , proto] = peerInfo('account');
  return [
    compared,
    { icon: 'info', ic: 'info', t: 'How to read this chart', lines: [`Each metric has two bars: your account and a typical one of the ${COHORT.n} creators. Engagement is likes and comments per view. Followers are net followers.`] },
    proto,
  ];
}
