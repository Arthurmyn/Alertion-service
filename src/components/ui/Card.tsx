import type { ReactNode } from 'react';
import styles from './Card.module.css';

/** A titled surface. The heading level is chosen by the caller. */
export function Card({
  title,
  action,
  children,
  as: Heading = 'h2',
  flush = false,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  as?: 'h2' | 'h3';
  /** Content that draws its own edge, such as a table, sits flush with the card. */
  flush?: boolean;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <Heading className={styles.title}>{title}</Heading>
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
      <div className={flush ? styles.flush : styles.body}>{children}</div>
    </section>
  );
}
