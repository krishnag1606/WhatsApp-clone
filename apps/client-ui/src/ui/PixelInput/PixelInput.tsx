import React from 'react';
import styles from './PixelInput.module.scss';

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  wrapperClassName?: string;
}

const PixelInput = React.forwardRef<HTMLInputElement, PixelInputProps>(
  ({ icon, label, wrapperClassName = '', className = '', ...rest }, ref) => (
    <div className={`${styles.wrapper} ${wrapperClassName}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputRow}>
        {icon && <span className={styles.iconSlot}>{icon}</span>}
        <input
          ref={ref}
          className={`${styles.input} ${className}`}
          {...rest}
        />
      </div>
    </div>
  )
);

PixelInput.displayName = 'PixelInput';

export default PixelInput;
