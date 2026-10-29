import type { ReactNode } from 'react';
import styles from './Button.module.css';

export function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  describedBy,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  describedBy?: string;
}) {
  return (
    <button
      className={styles.button}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-describedby={describedBy}
    >
      {children}
    </button>
  );
}
