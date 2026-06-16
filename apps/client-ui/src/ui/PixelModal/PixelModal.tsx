import React from 'react';
import styles from './PixelModal.module.scss';

interface PixelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

const PixelModal: React.FC<PixelModalProps> = ({
  isOpen,
  onClose,
  title = 'FLUX',
  children,
  footer,
  width = '480px',
}) => {
  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.window}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Windows 98-style title bar */}
        <div className={styles.titleBar}>
          <div className={styles.titleContent}>
            <span className={styles.titleIcon} aria-hidden="true">■</span>
            <span className={styles.titleText}>{title}</span>
          </div>
          <div className={styles.controls}>
            <button className={styles.controlMin} title="Minimize" tabIndex={-1}>─</button>
            <button className={styles.controlMax} title="Maximize" tabIndex={-1}>□</button>
            <button className={styles.controlClose} onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        <div className={styles.content}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default PixelModal;
