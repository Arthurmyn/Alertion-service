import type { DomainStatus } from '../../state/types.ts';
import styles from './StatusLabel.module.css';
import {
  statusActive,
  statusDeferred,
  statusFailed,
  statusPending,
} from './statusWords.ts';

export function StatusLabel({ status }: { status: DomainStatus }) {
  switch (status) {
    case 'notStarted':
      return null;
    case 'pending':
      return <span className={styles.pending}>{statusPending}</span>;
    case 'active':
      return <span className={styles.active}>{statusActive}</span>;
    case 'failed':
      return <span className={styles.failed}>{statusFailed}</span>;
    case 'deferred':
      return <span className={styles.deferred}>{statusDeferred}</span>;
  }
}
