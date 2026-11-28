// =====================================================================
// 同类创作者（2026-11-27 Yanice：Profile、Content、作品 Overview 的分数都改成和同类创作者比，不再和自己的前 7 天 / 自己的作品比）
// 同类 = 同内容类别 + 同粉丝量级 + 同地区。真实产品里由平台在后台按这个定义取一组创作者，只给聚合后的排位，不暴露任何一个人的数据。
// 原型里用固定种子生成这一组创作者：账号级给「和 Mira 同一个 7 天窗口」的周数据，作品级给每人若干条作品。
// =====================================================================
import { rng } from './seed.js';

export const COHORT = {
  category: 'travel', region: 'US', tier: '10K–50K followers', n: 120,
  // 卡片 ⓘ 里的一句话
  phrase: '120 travel creators in the US with 10K–50K followers',
};

const R = rng(20261127);
const rand = (a, b) => a + (b - a) * R();
const randi = (a, b) => Math.floor(rand(a, b + 1));
const lognorm = (median, sigma) => {
  const u = Math.max(1e-9, R()), v = R();
  return median * Math.exp(sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
};

// ---- 账号级：每人这 7 天的总数（字段名与 build.js 的 weekTotals 一致） ----
export const PEER_WEEKS = Array.from({ length: COHORT.n }, () => {
  const views = Math.round(lognorm(12000, 0.7));
  return {
    views,
    likes: Math.round(views * lognorm(0.048, 0.3)),
    comments: Math.round(views * lognorm(0.0025, 0.4)),
    shares: Math.round(views * lognorm(0.0075, 0.45)),
    profile: Math.round(views * rand(0.006, 0.012)),
    rewards: Math.round(lognorm(1.2, 0.8) * 100) / 100,
    newViewers: Math.round(views * rand(0.66, 0.78)),
    net: Math.round(views * rand(0.002, 0.005) - rand(8, 30)),
  };
});

// ---- 作品级：每人 6–10 条已发布作品 ----
// 播放随发布天数衰减，形状与 seed.js 的作品相同，所以「发布后前 N 天的播放」能和 Mira 的作品同口径比。
function retention(duration, strength) {
  const pts = [];
  for (let s = 0; s <= duration; s++) {
    const early = Math.exp(-s / (0.9 + strength * 1.6));
    const tail = (0.18 + strength * 0.3) * Math.exp(-s / (duration * (0.9 + strength)));
    pts.push(Math.max(0.01, Math.min(1, s === 0 ? 1 : early * (1 - tail) + tail)));
  }
  return pts;
}
const weight = (age, tau) => Math.exp(-age / tau) + 0.004 * Math.exp(-age / 120);

export const PEER_POSTS = [];
for (let c = 0; c < COHORT.n; c++) {
  const scale = lognorm(1, 0.45); // 同一位创作者的作品整体偏高或偏低
  for (let k = 0, m = randi(6, 10); k < m; k++) {
    const duration = R() < 0.3 ? randi(61, 94) : randi(9, 48);
    const ret = retention(duration, rand(0.15, 0.7));
    const viral = R() < 0.03;
    const tau = viral ? rand(3, 6) : rand(1.2, 3.5);
    let full = 0; for (let a = 0; a < 400; a++) full += weight(a, tau);
    const likeRate = lognorm(0.06, 0.3);
    PEER_POSTS.push({
      creator: c, duration, age: randi(3, 240), tau, full,
      lifetime: Math.round(lognorm(4800, 0.85) * scale * (viral ? rand(15, 30) : 1)),
      avgPct: ret.reduce((a, b) => a + b, 0) / ret.length,
      watchedFull: ret[ret.length - 1],
      firstSecondLeft: 1 - ret[1],
      likeRate, commentRate: lognorm(0.0024, 0.4), shareRate: lognorm(0.0062, 0.45), saveRate: lognorm(0.011, 0.45),
      followRate: lognorm(0.0034, 0.35),
    });
  }
}

// 发布后前 age 天的播放
export function peerViewsAtAge(q, age) {
  let w = 0;
  for (let a = 0; a < Math.min(age, q.age); a++) w += weight(a, q.tau);
  return Math.round((q.lifetime * w) / q.full);
}
