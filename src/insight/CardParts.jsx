// Final 画板（2026-11-26）所有 AI 卡片共用的头部与洞察块：
// 标题 17/22 700 + 蓝色 AI 星形 16px + 右侧 ⓘ；下面一块浅蓝底 #ebf3fb 的洞察（结论 600 黑字 + 其余灰字），圆角 8、内边距 12。
// 卡片本身圆角 12、内边距 16、元素间距 12（IMO-Rose-Blue / IMQ-B-Rose-Blue / IMS-C-Blue / IMS6-Key-Blue / IMS5-Insight / IMC-Comment-Topics）。
export const CARD_STYLE = {
  boxSizing: 'border-box', width: '100%', borderRadius: 12, background: '#ffffff', padding: 16,
  display: 'flex', flexDirection: 'column', gap: 12, color: '#161823', textAlign: 'left',
  fontFamily: "var(--font, 'TikTok Sans', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif)",
};

const SPARK = 'M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z';

export function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#8a8b91" strokeWidth="1.6" />
      <path d="M12 11v5.5M12 7.6v.4" fill="none" stroke="#8a8b91" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 标题行：标题 + AI 星形 + 右侧 ⓘ
export function CardHead({ title, infoLabel = 'About these scores', onInfo, act }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 24 }}>
      <span style={{ fontSize: 17, lineHeight: '22px', fontWeight: 700, color: '#161823' }}>{title}</span>
      <svg width="16" height="16" viewBox="0 0 256 256" fill="#1e7ce8" aria-hidden="true" style={{ flex: 'none', display: 'block' }}><path d={SPARK} /></svg>
      <span style={{ flex: 1 }} />
      {onInfo && (
        <button type="button" className="card-info-btn" aria-label={infoLabel} data-act={act} onClick={onInfo}
          style={{ appearance: 'none', border: 0, margin: 0, padding: 0, background: 'transparent', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <InfoIcon />
        </button>
      )}
    </div>
  );
}

// 洞察块：结论加粗黑字，其余灰字（rest 自带开头空格）
export function KeyBlock({ k, rest, children }) {
  return (
    <p style={{ margin: 0, padding: 12, borderRadius: 8, background: '#ebf3fb', fontSize: 15, lineHeight: '22px', color: '#57585e' }}>
      <span style={{ color: '#161823', fontWeight: 600 }}>{k}</span>{rest}{children}
    </p>
  );
}
