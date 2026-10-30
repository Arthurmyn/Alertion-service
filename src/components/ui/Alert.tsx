import type { ReactNode } from 'react';
import styles from './Alert.module.css';

export function Alert({
  children,
  tone = 'error',
}: {
  children: ReactNode;
  tone?: 'error' | 'warn';
}) {
  const warn = tone === 'warn';
  return (
    <div
      className={warn ? styles.warn : styles.error}
      role={warn ? 'status' : 'alert'}
    >
      {children}
    </div>
  );
}
