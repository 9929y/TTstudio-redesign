// The prototype's existing account/post metrics stay authoritative. The peer
// cohort is an explicit demo fixture, not an API or actual competitor dataset.
import { DAILY, PERIOD_END } from '../data/seed.js';
import { fmt, fmtStat, fmtMoney } from '../data/agg.js';

const weekly = key => DAILY[key].slice(PERIOD_END - 6, PERIOD_END + 1).reduce((s, v) => s + (v || 0), 0);
const pct = (v, digits = 1) => v.toFixed(digits) + '%';
const value = (name, label, own, peer, rank, format = fmtStat, key = name) => ({
  name, key, label, own, peer, rank, ownText: format(own), peerText: format(peer),
  rankText: rank.toFixed(2) + '%',
});

export function accountPeerComparison() {
  const views = weekly('views');
  return [
    value('Views', '7-day post views', views, 16200, 42.96),
    value('Engagement', '7-day engagement', 100 * (weekly('likes') + weekly('comments')) / Math.max(1, views), 6.4, 38.21, pct),
    value('Shares', '7-day shares', weekly('shares'), 65, 64.72),
    value('Visits', '7-day profile views', weekly('profile'), 155, 40.56),
    value('Rewards', '7-day est. rewards', weekly('rewards'), 1.8, 39.24, fmtMoney),
  ];
}

// For other videos, simulate a duration/age-matched reference; do not alter
// the post record, the existing area definitions, or the AI insight payload.
export function videoPeerComparison(post) {
  if (!post) return null;
  const age = Math.max(1, Math.min(30, PERIOD_END - post.pubIdx + 1));
  const views = post.daily.slice(post.pubIdx, post.pubIdx + age).reduce((s, v) => s + (v || 0), 0);
  const length = post.duration < 30 ? 1 : post.duration < 60 ? 0.9 : 0.78;
  const referenceViews = Math.round(6200 * Math.pow(age / 2, 0.55) * length);
  const a = [
    { name: 'Reach', label: 'Video views', own: views, peer: referenceViews, sampleRank: 66.42, format: fmt },
    { name: 'Retention', label: 'Watched full video', own: 100 * post.watchedFull, peer: 15.2 / length, sampleRank: 37.8, format: pct },
    { name: 'Likes', label: 'Like rate', own: 100 * post.likeRate, peer: 4.8, sampleRank: 31.62, format: pct },
    { name: 'Shares', label: 'Share rate', own: 100 * post.shareRate, peer: 0.72, sampleRank: 41.25, format: pct },
    { name: 'New follows', key: 'Follows', label: 'New follows rate', own: 100 * post.newFollowers / Math.max(1, post.views), peer: 0.32, sampleRank: 60.14, format: v => pct(v, 2) },
  ];
  // The p44 case exactly matches the reviewed design. Other prototype posts
  // use a deterministic sample distribution centred at the peer reference.
  return a.map(m => value(m.name, m.label, Math.max(0, m.own || 0), m.peer,
    post.id === 'p44' ? m.sampleRank : Math.max(0, Math.min(100, 100 / (1 + Math.exp(-2.4 * Math.log(Math.max(0.001, m.own / m.peer)))))),
    m.format, m.key || m.name));
}

export function peerInfo(scope) {
  return [
    { icon: 'insights', ic: 'insights', t: 'Compared with', lines: [scope === 'post'
      ? 'Similar videos of comparable duration, measured over the same time after publishing.'
      : 'Similar creators over the same 7-day period.'] },
    { icon: 'info', ic: 'info', t: 'How to read this chart', lines: ['The solid line is your data. The dashed line represents the typical comparison group. The percentage below a tab is the share of that group your result exceeds.'] },
    { icon: 'info', ic: 'info', t: 'Prototype data', lines: ['Your metrics use the existing sample account or video. Comparison-group values are simulated for this prototype.'] },
  ];
}
