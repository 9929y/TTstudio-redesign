// Curated for you · 卡片插画，三套扁平方案（2026-11-28，评审：「TikTok 整体是扁平画风，很少用渐变和 3D」）。
// 规则：纯色填充、无渐变 / 阴影 / 3D / 高光；画面完整留在卡片内，不出血、不被裁。
// 含义沿用原插画：past = 爆款作品之后接一条（第二部分），trend = 正在上升的话题，similar = 同类创作者比你高，可以追上。
//
// 每张插画画在 82×82 的局部坐标里（下面的 g 内容），由 CuratedForMe 套 viewBox：
//   首页卡片：插画区 104×128（卡片右侧），viewBox="-10 -23 104 128" → 右边距 12（= 卡片内边距），上下居中
//   Create 页的行：viewBox="-4 -4 90 90"，在行高里等比缩放
//
// 切换方案：改 CARD_ART，或在地址里加 ?art=A / #art=C（截图对比用）。2026-11-28 Yanice 选定 B，默认 B；A / C 保留作对比。
export const CARD_ART = 'B';

const INK = '#161823';
const BLUE = '#1e7ce8';      // 原型主蓝（--c-blue）
const RED = '#fe2c55';       // TikTok 红
const CYAN = '#25f4ee';      // TikTok 青
const WHITE = '#ffffff';

// 9:16 竖版作品小卡（圆角矩形）
const tile = (x, y, w, h, attrs) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" ${attrs}/>`;
const play = (cx, cy, r, fill) => `<path d="M${cx - r * 0.6},${cy - r} L${cx + r},${cy} L${cx - r * 0.6},${cy + r} Z" fill="${fill}" stroke="${fill}" stroke-width="1.5" stroke-linejoin="round"/>`;
const plus = (cx, cy, r, stroke, w = 2) => `<path d="M${cx - r},${cy} H${cx + r} M${cx},${cy - r} V${cy + r}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
const rot = (deg, cx, cy, inner) => `<g transform="rotate(${deg} ${cx} ${cy})">${inner}</g>`;

// ---------- A · 细线 + 一个强调色 ----------
// 统一 1.5px 墨色描边、白底；每张只有一个元素用强调色填充。卡底是中性浅灰。
const LINE = `fill="${WHITE}" stroke="${INK}" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"`;
const LINE_NOFILL = `fill="none" stroke="${INK}" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"`;
const A = {
  name: 'Line + one fill',
  bg: { past: '#f4f5f7', trend: '#f4f5f7', similar: '#f4f5f7' },
  art: {
    // 两条旧作品（白）→ 爆款（蓝底白播放键）→ 虚线框 + 号 = 下一条
    past: [
      tile(2, 33, 22, 40, LINE),
      tile(30, 9, 22, 64, `fill="${BLUE}" stroke="${INK}" stroke-width="1.5" vector-effect="non-scaling-stroke"`),
      play(41.5, 41, 6, WHITE),
      tile(58, 25, 22, 48, `${LINE_NOFILL} stroke-dasharray="3 3"`),
      plus(69, 49, 5, INK, 1.5),
    ].join(''),
    // 一条上升的线 + 沿线越来越大的作品卡，最大的一张是强调色
    trend: [
      `<path d="M0,78 C26,76 50,66 82,50" ${LINE_NOFILL}/>`,
      rot(-12, 14, 60, tile(8, 50, 12, 20, LINE)),
      rot(-12, 38, 47, tile(30, 34, 16, 26, LINE)),
      rot(-12, 66, 28, tile(56, 12, 20, 32, `fill="${RED}" stroke="${INK}" stroke-width="1.5" vector-effect="non-scaling-stroke"`) + play(67, 28, 5, WHITE)),
    ].join(''),
    // 对方的作品（强调色，高）和你的（白，矮），虚线标出差距，箭头向上
    similar: [
      tile(6, 10, 26, 64, `fill="${CYAN}" stroke="${INK}" stroke-width="1.5" vector-effect="non-scaling-stroke"`),
      `<path d="M12,58 H24 M12,64 H19" ${LINE_NOFILL}/>`,
      tile(40, 40, 26, 34, LINE),
      `<path d="M46,58 H58 M46,64 H53" ${LINE_NOFILL}/>`,
      `<path d="M36,10 H80" ${LINE_NOFILL} stroke-dasharray="3 3"/>`,
      `<path d="M74,38 V16 M69,21 L74,15 L79,21" ${LINE_NOFILL}/>`,
    ].join(''),
  },
};

// ---------- B · 墨线稿 + 一个表意色（2026-11-28 第二轮，Yanice：「很多是黑白色的稿子搭上不同的信息代表不同的内容」） ----------
// 依据（真实录屏）：空状态「找不到结果」usrec 0:21、「暂无草稿」usrec 1:14、创作者奖励计划 usrec 1:36、欢迎页 QKE 0:26。
// TikTok 的插画底子是黑白线稿：白色填充 + 墨色线，只有承载意思的那一个东西上色（放大镜片 = 薄荷，+ 按钮 / 爱心 = 红）。
// 规则（三张卡同一套）：
//   · 所有物体 = 白底 + 墨线 #161823，线宽 2.25，圆头圆角；细节（播放键、+、箭头、地平线）也是同一根墨线
//   · 每张只有一个元素上色，颜色就是这张卡的意思：
//       past（你的爆款）= TikTok 红 #fe2c55 —— 「你的作品 / 被喜欢」，录屏里红色给 + 按钮和爱心
//       trend（正在上升）= TikTok 青 #25f4ee —— 「热度 / 趋势」，品牌色里最「亮」的那个，和红一样是 TikTok 自己的色
//       similar（别的创作者）= 绿 #4fd36f —— 「成长 / 追上去」（第三轮 Yanice：不要紫，用绿）；色相约 135°，
//         和青（约 178°）差 40° 以上、明度也更低，一眼能分出是两种意思
//   · 卡底 = 同色相的极浅色（L ≥ 96%），只带一点颜色；白色物体靠墨线勾边仍然清楚
//   · 每张最多一个墨线小装饰：四角星 / 放射短线（虚线目标和箭头算内容，不算装饰）
//   · 三张都站在同一条地平线（y=76）上，主体高度一致
// 构图沿用 B：past = 柱子，下一条正在做；trend = 上升带上越来越大的作品；similar = 对比后往上追。
const GREEN = '#4fd36f';
const SW = 2.25;
const INKLINE = `fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"`;
const OUTLINE = (fill) => `fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"`;
// 只圆上角的柱子，不画底边（底边由地平线画），平底站在地平线上
const bar = (x, y, w, h, fill, r = 4) => `<path d="M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h}" ${OUTLINE(fill)}/>`;
const inkPlay = (cx, cy, r) => `<path d="M${cx - r * 0.55},${cy - r} L${cx + r * 0.85},${cy} L${cx - r * 0.55},${cy + r} Z" ${INKLINE}/>`;
const ground = (y = 76) => `<path d="M2,${y} H80" ${INKLINE}/>`;
// 四角星（内凹），墨线
const sparkle = (cx, cy, r) => `<path d="M${cx},${cy - r} Q${cx + r * 0.18},${cy - r * 0.18} ${cx + r},${cy} Q${cx + r * 0.18},${cy + r * 0.18} ${cx},${cy + r} Q${cx - r * 0.18},${cy + r * 0.18} ${cx - r},${cy} Q${cx - r * 0.18},${cy - r * 0.18} ${cx},${cy - r} Z" ${INKLINE}/>`;
// 卡底两套（第三轮，Yanice：「再淡一点……用它们的对比色，或者是和它一样的颜色的浅色调」），都在 HSL L ≥ 96%：
//   tint       = 和这张卡强调色同色相的极浅色（默认）：红 → 极浅粉，青 → 极浅青，绿 → 极浅绿
//   complement = 强调色对比色的极浅色：红 → 极浅青灰绿，青 → 极浅暖粉灰，绿 → 极浅粉灰
const B_BG = {
  tint: { past: '#fff3f5', trend: '#edfdfc', similar: '#f0fbf2' },
  complement: { past: '#f1f9f7', trend: '#fdf3f3', similar: '#fbf3f8' },
};
const B_BG_MODE = 'tint';
const B = {
  name: 'Ink line + one meaning colour',
  bg: B_BG[B_BG_MODE],
  art: {
    // 白（旧作）→ 红（爆款，墨线播放键）→ 白（下一条，墨线 +），右上一颗四角星
    past: [
      bar(6, 48, 18, 28, WHITE),
      bar(30, 16, 22, 60, RED),
      inkPlay(41, 41, 6.5),
      bar(58, 36, 18, 40, WHITE),
      plus(67, 56, 5, INK, SW),
      ground(),
      sparkle(71, 19, 7),
    ].join(''),
    // 青色上升带（墨线描边，带宽 8，起点下沿落在地平线 y=76）+ 沿带越来越大的作品（白底墨线），最大那张旁边三根放射短线
    trend: [
      `<path d="M8,69.5 C30,67.5 52,59 75,45" fill="none" stroke="${INK}" stroke-width="${8 + SW * 2}" stroke-linecap="round"/>`,
      `<path d="M8,69.5 C30,67.5 52,59 75,45" fill="none" stroke="${CYAN}" stroke-width="8" stroke-linecap="round"/>`,
      rot(-12, 14, 50, tile(8, 41, 12, 18, OUTLINE(WHITE))),
      rot(-12, 37, 39, tile(29, 26, 16, 26, OUTLINE(WHITE))),
      rot(-12, 64, 19, tile(54, 2, 20, 34, OUTLINE(WHITE)) + inkPlay(64, 19, 6)),
      `<path d="M45,8 L41,5.5 M44,15 L39,15.5 M48.5,3.5 L47.5,0.5" ${INKLINE}/>`,
    ].join(''),
    // 对方的作品（绿，高）和你的（白，矮），墨线标题、虚线目标和向上箭头
    similar: [
      bar(8, 16, 24, 60, GREEN),
      `<path d="M14,60 H26 M14,67 H21" ${INKLINE}/>`,
      bar(40, 44, 22, 32, WHITE),
      `<path d="M46,60 H56 M46,67 H52" ${INKLINE}/>`,
      `<path d="M38,16 H60" ${INKLINE} stroke-dasharray="3 5"/>`,
      `<path d="M73,40 V17 M67,23 L73,16 L79,23" ${INKLINE}/>`,
      ground(),
    ].join(''),
  },
};

// ---------- C · 贴纸 ----------
// 一块圆角方形贴纸（白边、微微倾斜），里面一个简单图形；三张分别是 TikTok 的黑 / 红 / 青。卡底中性浅灰。
const sticker = (fill, inner, deg = -6) => rot(deg, 41, 43, `<rect x="11" y="13" width="60" height="60" rx="16" fill="${fill}" stroke="${WHITE}" stroke-width="3"/>${inner}`);
const C = {
  name: 'Sticker',
  bg: { past: '#f4f5f7', trend: '#f4f5f7', similar: '#f4f5f7' },
  art: {
    // 黑贴纸 + 白播放键，右上角红色小圆 + 号：在爆款之后再做一条
    past: sticker(INK, play(43, 43, 11, WHITE)) + `<circle cx="68" cy="14" r="11" fill="${RED}" stroke="${WHITE}" stroke-width="3"/>${plus(68, 14, 5, WHITE, 2.5)}`,
    // 红贴纸 + 白色上升折线箭头
    trend: sticker(RED, `<path d="M24,56 L36,44 L45,52 L59,36 M50,35 H60 V45" fill="none" stroke="${WHITE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`, 6),
    // 青贴纸 + 墨色两人：同类创作者
    similar: sticker(CYAN, [
      `<circle cx="51" cy="35" r="7" fill="${INK}" opacity="1"/>`,
      `<path d="M39,60 C39,50 44,46 51,46 C58,46 63,50 63,60 Z" fill="${INK}"/>`,
      `<circle cx="34" cy="38" r="8" fill="${INK}" stroke="${CYAN}" stroke-width="3"/>`,
      `<path d="M20,64 C20,53 26,49 34,49 C42,49 48,53 48,64 Z" fill="${INK}" stroke="${CYAN}" stroke-width="3" stroke-linejoin="round"/>`,
    ].join('')),
  },
};

export const CARD_ARTS = { A, B, C };

// 当前方案：URL 覆盖（?art=B 或 #art=B）优先，否则用 CARD_ART
export function currentArt() {
  let k = CARD_ART;
  if (typeof window !== 'undefined') {
    const m = /(?:^|[?&#])art=([abc])\b/i.exec(`${window.location.search}${window.location.hash}`);
    if (m) k = m[1].toUpperCase();
  }
  return CARD_ARTS[k] ? k : CARD_ART;
}

export const artKind = (card) => (card.k_past ? 'past' : card.k_trend ? 'trend' : card.k_similar ? 'similar' : card.k);
