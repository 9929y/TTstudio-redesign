// 2026-11-26 AI 生成的结论句（英文）。来源：prompt pack（未包含在本仓库）（prompt、校验、评测都在那里）。
// 快照由 prompt_pack/scripts/export_prototype.js 在原型自己的数据（本目录 build.js）上生成，写进 ./ai/insights.en-US.js。
// 规则：只在快照对应的同一个对象上使用（同一条作品、同一个搜索词、同一个问题）；其他情况仍用 build.js 的模板句。
import SNAP from './ai/insights.en-US.js';

const S = SNAP?.surfaces || {};
export const AI_META = { pack: SNAP?.pack_version, generated: SNAP?.generated_at, model: SNAP?.model };

// subject 为 undefined 表示这一面不需要对象匹配（A、B、S1 卡）。
export function aiFor(surface, subject) {
  const s = S[surface];
  if (!s || s.source !== 'model' || !s.output) return null;
  if (s.output.safety_flag === 'blocked_category') return null;
  if (s.subject != null && s.subject !== subject) return null;
  return s.output;
}

// 卡片（A、B、C、D、E）：key 加粗，rest 灰字；模板的 rest 以空格开头，这里保持一致。
export function withAI(surface, insight, subject) {
  const o = aiFor(surface, subject);
  if (!insight || !o || !o.key) return insight;
  return { ...insight, key: o.key, rest: ` ${o.rest}`, aiGenerated: true };
}

// S1 卡：AI 写 topic 和来源行；trend 卡的三行由代码按分数写（build.js 原样）。
export function curatedWithAI(card) {
  const o = aiFor(`curated_${card.k}`);
  if (!o || !o.topic) return card;
  if (card.k === 'trend' || !o.rows?.length) return { ...card, topic: o.topic, aiGenerated: true };
  return { ...card, topic: o.topic, rows: o.rows.map((r) => ({ [`i_${r.icon}`]: true, t: r.text, b: '' })), aiGenerated: true };
}

// Creator Assistant（从 Performance summary 进来的回答）
export function summaryWithAI(answer) {
  const o = aiFor('creator_assistant', answer?.question);
  if (!answer || !o || !o.insight) return answer;
  return { ...answer, headline: o.insight, bullets: o.bullets, chips: o.follow_ups?.length ? o.follow_ups : answer.chips, aiGenerated: true };
}
