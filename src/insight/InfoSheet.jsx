// Shared frame for the AI cards' ⓘ sheets (Performance summary = rose-*, Post summary / Topic scores = ime-*).
// Same behaviour as SheetFrame (src/shell/Overlays.jsx): the header divider only fades in after the body scrolls
// (is-scrolled, 120ms opacity, none under reduced motion), and dragging the header down closes the sheet
// (> 110pt or a fast flick). `cls` keeps each card's own class names and entrance animation.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useDragControls } from 'framer-motion';
import './InfoSheet.css';

export function InfoSheet({ cls, host, title, onClose, scrimAct, closeAct, z = 600, children }) {
  const controls = useDragControls();
  const [scrolled, setScrolled] = useState(false);
  const onBodyScroll = (e) => { const s = e.currentTarget.scrollTop > 0; if (s !== scrolled) setScrolled(s); };
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const node = (
    <>
      <div className={`${cls}-scrim info-sheet-scrim`} data-act={scrimAct} onClick={onClose} style={{ zIndex: z }} />
      <motion.div className={`${cls} info-sheet${scrolled ? ' is-scrolled' : ''}`} role="dialog" aria-modal="true" aria-label={title} style={{ zIndex: z + 1 }}
        drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.9 }}
        onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}>
        <div className={`${cls}-head info-sheet-head`} onPointerDown={(e) => { if (!e.target.closest('button')) controls.start(e); }}>
          <span>{title}</span>
          <button type="button" aria-label="Close" data-act={closeAct} onClick={onClose} className="info-sheet-x">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={`${cls}-body info-sheet-body`} onScroll={onBodyScroll}>{children}</div>
      </motion.div>
    </>
  );
  return host ? createPortal(node, host) : node;
}
