import React from 'react';
import styles from './PixelButton.module.scss';

type Variant = 'primary' | 'cyan' | 'lime' | 'yellow' | 'ghost' | 'danger' | 'icon';
type Size = 'sm' | 'md' | 'lg';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      className={[styles.button, styles[variant], styles[size], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
);

PixelButton.displayName = 'PixelButton';

export default PixelButton;
