// Module C — S4 topic search results: the topic card (insight sentence, three score bars, then the existing lower half).
// Ported from design_final/post_topic/project/IMS-C-Blue.dc.html (inline style values are the spec).
// All content comes from the `insight` prop (default: demo/moduleC.js). `children` = the real "Creators are posting … Post now" block.
import { useState } from 'react';
import demo from './demo/moduleC.js';
import { InsightDrawer } from './ModuleE.jsx';
import { CardHead, KeyBlock, CARD_STYLE } from './CardParts.jsx';
import { useEntering } from './entrance.js';

export function ModuleC({ insight = demo, children, className }) {
  const D = insight || demo;
  const ui = D.ui || {};
  const rows = D.rows || [];
  const [drawer, setDrawer] = useState('');
  const entering = useEntering(1100);
  const items = D.info || (ui.intro ? [ui.intro] : []).concat(rows.map((x) => ({ ic: x.ic, t: x.name, lines: [x.desc] })));
  return (
    <div data-insight="C" className={[className, entering && 'enter-card'].filter(Boolean).join(' ') || undefined}
      style={{ ...CARD_STYLE, margin: 0, border: 0, boxShadow: '0 0 0 0.5px rgba(22, 24, 35, 0.12), 0 2px 12px rgba(22, 24, 35, 0.05)' }}>
      {/* Final：标题 Topic scores + AI 星形 + ⓘ（data-act 沿用旧卡的 ai-info，e2e 在用），洞察在浅蓝块里 */}
      <CardHead title={D.cardTitle || 'Topic Analysis'} infoLabel={ui.infoLabel || 'About this analysis'} act="ai-info" onInfo={() => setDrawer('info')} />
      <KeyBlock k={D.key} rest={D.rest} bullets={D.bullets} next={D.next} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((r, ri) => (
          <div key={r.name} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0px' }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span className="imc-name" style={{ flex: '1 1 auto', minWidth: 0, fontSize: 13, lineHeight: '18px', fontWeight: 400, color: '#57585e', overflowWrap: 'anywhere' }}>
                {r.name}
              </span>
              <span className="imc-score" style={{ flex: 'none', minWidth: 32, textAlign: 'right', fontSize: 15, lineHeight: '20px', fontWeight: 400, color: '#161823', fontVariantNumeric: 'tabular-nums' }}>{r.score}</span>
            </span>
            <span style={{ position: 'relative', display: 'block', height: 8, borderRadius: 4, background: '#f1f1f2', overflow: 'hidden' }}>
              <span className={entering ? 'enter-grow-x' : undefined} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.score}%`, borderRadius: 4, background: r.color, animationDelay: entering ? `${0.12 + ri * 0.06}s` : undefined }} />
            </span>
          </div>
        ))}
      </div>
      {/* lower half: in the canvas this is a 345 × 258 screenshot with margin-top −8 */}
      {children != null && <div style={{ marginTop: -8 }}>{children}</div>}
      {drawer === 'info' && <InsightDrawer title={D.title} items={items} onClose={() => setDrawer('')} />}
    </div>
  );
}

export default ModuleC;
