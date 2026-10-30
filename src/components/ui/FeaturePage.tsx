import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader.tsx';
import { StatusBadge } from './StatusBadge.tsx';
import styles from './FeaturePage.module.css';

export interface Capability {
  term: string;
  detail: string;
}

/**
 * A section the prototype does not implement. It says so, names what is
 * missing, and lists what the section is for. Data that does exist is passed
 * as children and shown first.
 */
export function FeaturePage({
  title,
  lead,
  needs,
  capabilities,
  actions,
  children,
}: {
  title: string;
  lead: string;
  needs: string;
  capabilities: readonly Capability[];
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} lead={lead} actions={actions} />
      {children}
      <section className={styles.panel} aria-label="Состояние раздела">
        <StatusBadge tone="neutral">Не реализовано в прототипе</StatusBadge>
        <p className={styles.needs}>{needs}</p>
        <dl className={styles.list}>
          {capabilities.map((item) => (
            <div className={styles.row} key={item.term}>
              <dt>{item.term}</dt>
              <dd>{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
