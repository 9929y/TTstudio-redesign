// 模块 B：Analytics › Content 的洞察卡（Content summary）。2026-11-28 起是双横条对比（ModuleD CompareRows），不再是半圆 / 评分条
// 设计源：design_final/analytics/project/IMQ-B-Rose-Blue.dc.html
// 标记与模块 A 相同（见 ModuleA.jsx 的 RoseCard），这里只给半圆的几何参数。
import { RoseCard, ScoresNeedSevenDays } from './ModuleA.jsx';
import { buildModuleB } from './build.js';
import { contentInfo } from './contentStats.js';

// 上半圆，从 9 点起顺时针，每区 180/n 度；标签在基线下排成一行
export const GEO_HALF = {
  CX: 172.5, CY: 136, H: 208, RI: 74, RO: 124,
  span: (i, n, gap) => { const step = 180 / n; return [180 + step * i + gap, 180 + step * (i + 1) - gap]; },
  // dc：Views 和 Followers 在两条腿下方，Engagement 在正中；(74 + 124) / 2 = 环带中线
  labelAt: (i, n, G) => {
    const total = Math.min(297, G.CX * 2);
    const middle = G.CX * 2 < 300 ? 106 : 99;
    const side = (total - middle) / 2;
    const widths = [side, middle, side];
    const left = G.CX - total / 2 + widths.slice(0, i).reduce((sum, w) => sum + w, 0);
    return { left: left + 'px', width: widths[i] + 'px', top: (G.CY + 20) + 'px', tf: 'none', items: 'center' };
  },
  firstSep: false, // 半圆的第一条边是基线，不画分隔线（同 Final）
  labelValue: (x) => x.you + '/' + x.max,
  centerTop: 136, centerTf: 'translateY(-100%)', centerFont: 36, centerLine: 40, centerPad: '0px 8px',
};

const B7 = buildModuleB({ key: '7' });
export function ModuleB({ ca = 'row', title, insight = B7, onAsk, onSelect, syncTo, initialArea }) {
  if (!insight) return <ScoresNeedSevenDays />;
  // 2026-11-28: double-bar rows (no scores on the card), so the ⓘ drawer explains the bars instead of the scores
  return <RoseCard presentation="bars" geo={GEO_HALF} act="insight-b" ca={ca} title={title} insight={{ ...insight, title: 'About this comparison', info: contentInfo(), ui: { ...insight.ui, infoLabel: 'About this comparison' } }} onAsk={onAsk} onSelect={onSelect} syncTo={syncTo} initialArea={initialArea} />;
}

export default ModuleB;
