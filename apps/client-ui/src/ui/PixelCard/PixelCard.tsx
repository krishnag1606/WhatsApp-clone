import React from 'react';
import styles from './PixelCard.module.scss';

type CardVariant = 'primary' | 'cyan' | 'yellow';

interface PixelCardProps {
  title?: string;
  variant?: CardVariant;
  shadow?: boolean;
  className?: string;
  children: React.ReactNode;
}

const PixelCard: React.FC<PixelCardProps> = ({
  title,
  variant = 'primary',
  shadow = true,
  className = '',
  children,
}) => (
  <div
    className={[
      styles.card,
      styles[variant],
      shadow ? styles.shadow : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {title && (
      <div className={styles.titleBar}>
        <span className={styles.titleIcon}>■</span>
        <span className={styles.titleText}>{title}</span>
      </div>
    )}
    <div className={styles.body}>{children}</div>
  </div>
);

export default PixelCard;
