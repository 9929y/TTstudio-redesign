// 底部弹层 / 系统 Alert / Toast —— 统一在手机屏幕内渲染
import { useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { useApp } from '../store.js';
import { I } from '../ui/Icons.jsx';

// 美国 2026-11-22 录屏（60fps，1:45 分析弹层）逐帧追踪上沿：16 帧 = 267ms，进度曲线拟合 cubic-bezier(.45,.2,.6,1)，均方根误差 0.005；不是弹簧
const SHEET_T = { type: 'tween', ease: [0.45, 0.2, 0.6, 1], duration: 0.27 };

// 通用弹层外壳：标题居中 + 右上角 ×（o1g_0248、91F_0225），可下拉关闭
export function SheetFrame({ title, children, footer, onClose, full, noHeader, dark, height }) {
  const close = useApp((s) => s.closeSheet);
  const controls = useDragControls();
  const doClose = onClose || close;
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') doClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [doClose]);
  return (
    <>
      <motion.div className="sheet-scrim" data-act="sheet-scrim-close" onClick={doClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
      <motion.div role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} className={`sheet ${full ? 'full' : ''} ${dark ? 'dark' : ''}`} style={height ? { height } : undefined}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={SHEET_T}
        drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.9 }}
        onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) doClose(); }}>
        <div className="sheet-grab" onPointerDown={(e) => controls.start(e)} data-act="sheet-drag">
          {!noHeader && (
            <div className="sheet-head">
              <div className="sheet-title">{title}</div>
              <button className="sheet-x" data-act="sheet-close" onClick={doClose} aria-label="Close"><I.close size={22} /></button>
            </div>
          )}
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </motion.div>
    </>
  );
}

export function SheetHost({ registry }) {
  const sheet = useApp((s) => s.sheet);
  const Comp = sheet ? registry[sheet.type] : null;
  return <AnimatePresence>{sheet && Comp && <Comp key={sheet.id} {...sheet.props} />}</AnimatePresence>;
}

// iOS 系统对话框（rpfqP_0252「Continue to TikTok app?」）
export function AlertHost() {
  const a = useApp((s) => s.alert);
  const close = useApp((s) => s.closeAlert);
  return (
    <AnimatePresence>
      {a && (
        <motion.div className="alert-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div role="alertdialog" aria-modal="true" aria-label={a.title} className="alert" initial={{ scale: 1.15, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="alert-text">
              <div className="alert-title">{a.title}</div>
              {a.message && <div className="alert-msg">{a.message}</div>}
            </div>
            <div className={`alert-actions ${a.actions.length > 2 ? 'stack' : ''}`}>
              {a.actions.map((ac) => (
                <button key={ac.label} data-act={`alert-${ac.label}`} className={`${ac.bold ? 'bold' : ''} ${ac.destructive ? 'destructive' : ''}`}
                  onClick={() => { close(); ac.onPress?.(); }}>{ac.label}</button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast：pill = 顶部小黑条（o1g_0450「Draft saved」）；center = 居中方块带对勾（zaDQ_0146「Post scheduled」）
export function ToastHost() {
  const t = useApp((s) => s.toast);
  return (
    <AnimatePresence>
      {t && t.kind === 'pill' && (
        <motion.div key={t.id} role="status" aria-live="polite" className="toast-pill" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {t.text}
        </motion.div>
      )}
      {t && t.kind === 'center' && (
        <motion.div key={t.id} role="status" aria-live="polite" className="toast-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <I.check size={34} />
          <div>{t.text}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
