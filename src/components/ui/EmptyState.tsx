import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

/** Says what is missing and what to do next. `action` is optional. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      <p className={styles.text}>{children}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
