import { useId } from 'react';
import { useApp } from '../store.js';
// Final 画板（2026-11-26）所有 AI 卡片共用的头部与洞察块：
// 标题 17/22 700 + 蓝色 AI 星形 16px + 右侧 ⓘ；下面一块浅蓝底 #ebf3fb 的洞察（结论 600 黑字 + 其余灰字），圆角 8、内边距 12。
// 卡片本身圆角 12、内边距 16、元素间距 12（IMO-Rose-Blue / IMQ-B-Rose-Blue / IMS-C-Blue / IMS6-Key-Blue / IMS5-Insight / IMC-Comment-Topics）。
export const CARD_STYLE = {
  boxSizing: 'border-box', width: '100%', borderRadius: 12, background: '#ffffff', padding: 16,
  display: 'flex', flexDirection: 'column', gap: 12, color: '#161823', textAlign: 'left',
  fontFamily: "var(--font, 'TikTok Sans', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif)",
};

const SPARK = 'M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z';

// AI 星形：和 Creator Assistant 机器人同一套渐变（右上青 → 蓝 → 左下靛），2026-11-27 Yanice 要求统一
export function AiStar({ size = 16, style }) {
  const id = 'ais' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" aria-hidden="true" style={{ flex: 'none', display: 'block', ...style }}>
      <defs><linearGradient id={id} x1="170.67" y1="42.67" x2="74.67" y2="213.33" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#4fe3e6" /><stop offset=".45" stopColor="#2f62f2" /><stop offset="1" stopColor="#1d0f8a" /></linearGradient></defs>
      <path fill={`url(#${id})`} d={SPARK} />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#8a8b91" strokeWidth="1.6" />
      <path d="M12 11v5.5M12 7.6v.4" fill="none" stroke="#8a8b91" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function HistoryDash() {
  return <svg width="14" height="2" viewBox="0 0 14 2" aria-hidden="true" style={{ flex: 'none' }}><path d="M0 1H14" fill="none" stroke="#161823" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" /></svg>;
}

// 标题行：标题 + AI 星形 + 右侧 ⓘ
export function CardHead({ title, infoLabel = 'About these scores', onInfo, act }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 24 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 17, lineHeight: '22px', fontWeight: 700, color: '#161823', minWidth: 0, overflowWrap: 'anywhere' }}>{title}</span>
        <AiStar />
      </span>
      <span style={{ flex: 1, minWidth: onInfo ? 12 : 0 }} />
      {onInfo && (
        <span style={{ position: 'relative', flex: 'none', width: 24, height: 24 }}>
          <button type="button" className="card-info-btn" aria-label={infoLabel} data-act={act} onClick={onInfo}
            style={{ appearance: 'none', border: 0, margin: 0, padding: 0, background: 'transparent', cursor: 'pointer', position: 'absolute', inset: -12, display: 'grid', placeItems: 'center' }}>
            <InfoIcon />
          </button>
        </span>
      )}
    </div>
  );
}

// 洞察块：2026-11-27 夜 Yanice「Performance summary 用一种颜色」——段落和要点统一 #161823，不再结论黑、其余灰（所有洞察块同一组件，一起改）。2026-11-27：结论句也是 400，不加粗（Yanice 规则：行、按钮、正文一律 400）
// 洞察块（2026-11-27 Yanice）：结论句（最多 2 行）+ 2 个要点（各 1 行，其中一条是下一步建议），总共不超过 4 行。
// 2026-11-27 晚 Yanice：洞察块里不要任何 CTA 链接。下一步只写成建议句放在要点里；数据里的 next 照收不渲染。
// 2026-11-28（Yanice 批准，优化项 3 + 5）：要点下方一行小字说明 AI 用的是哪段数据（Based on data from <窗口>），旁边是
// Helpful / Not helpful 两个文字按钮（一行放得下时在右侧，393pt 放不下时换到下一行左起），点了只记选中状态。窗口和 data-act 前缀由 build.js 按卡片登记（provenance.js），
// 调用方也可以直接传 basis / act。洞察文字（段落 + 要点）包在一层里，仍是单一 #161823；日期行是它下方的次级灰小字。
// eslint-disable-next-line no-unused-vars
// 2026-11-28 Yanice：洞察块下面有图（雷达、双横条、对比条、评分条）就只写段落，不写要点；下面没有图的纯文字卡
// （Viewer / Follower summary）可以有 1–2 条要点。要点只在调用方显式传 allowBullets 时才渲染，默认不渲染。
// 2026-11-28 Yanice: no provenance line / feedback buttons under the insight (removed).
export function KeyBlock({ k, rest, bullets, next, allowBullets = false, children }) { // eslint-disable-line no-unused-vars
  const pts = allowBullets ? (bullets || []).filter(Boolean).slice(0, 2) : [];
  return (
    <div style={{ padding: 12, borderRadius: 8, background: '#ebf3fb', fontSize: 15, lineHeight: '22px', color: '#161823' }}>
      <p style={{ margin: 0 }}><span style={{ fontWeight: 400 }}>{k}</span>{rest && !/^\s/.test(rest) ? ` ${rest}` : rest}{children}</p>
      {pts.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {pts.map((b) => (
            <li key={b} style={{ display: 'flex', gap: 8 }}>
              <span aria-hidden="true" style={{ flex: 'none', width: 4, height: 4, borderRadius: 2, background: '#8a8b91', marginTop: 9 }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 「下一步」的目的地。模型只能选这里的 id（prompt 包的 next.to），不能编新的去处。
// 2026-11-27 起洞察块不再渲染链接；保留这张表和 NEXT_TARGETS，prompt 包的 schema 仍按这些 id 校验 next.to。
export const NEXT = {
  followers_viewed: () => useApp.getState().push('creatorInspiration', { tab: 'posts', mode: 'recommended', rec: 'followers' }),
  schedule: () => useApp.getState().openModal('picker', { mode: 'upload' }),
  description_ideas: () => {
    const st = useApp.getState(); const d = st.drafts?.[0];
    if (!d) { st.openModal('picker', { mode: 'upload' }); return; }
    st.openModal('composer', { draftId: d.id });
    setTimeout(() => useApp.getState().openSheet('descIdeas', {}), 450);
  },
  curated_past: () => useApp.getState().switchTab('home'),
  retention: () => {
    const h = [...document.querySelectorAll('#phone-screen *')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Retention rate' && e.getClientRects().length);
    h?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  comments_reply: () => { const st = useApp.getState(); st.switchTab('manage'); st.setManage({ tab: 'comments' }); },
  create: () => useApp.getState().switchTab('create'),
};
export const NEXT_TARGETS = Object.keys(NEXT);
