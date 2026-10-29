import type { ReactNode } from 'react';
import styles from './Defense.module.css';
import { tableScrollNote } from './links.ts';

export function WideTable({
  noteId,
  children,
}: {
  noteId: string;
  children: ReactNode;
}) {
  return (
    <>
      <p id={noteId} className={styles.note}>
        {tableScrollNote}
      </p>
      <div className={styles.scroll} tabIndex={0} aria-labelledby={noteId}>
        {children}
      </div>
    </>
  );
}
