import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './LinkButton.module.css';

/** A link that looks like a button. Use it for navigation, not for actions. */
export function LinkButton({
  to,
  children,
  variant = 'primary',
}: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Link
      to={to}
      className={`${styles.link} ${variant === 'primary' ? styles.primary : styles.secondary}`}
    >
      {children}
    </Link>
  );
}
