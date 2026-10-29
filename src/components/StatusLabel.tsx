import type { DomainStatus } from '../state/types.ts';
import styles from './StatusLabel.module.css';

export function StatusLabel({ status }: { status: DomainStatus }) {
  switch (status) {
    case 'notStarted':
      return null;
    case 'pending':
      return <span className={styles.pending}>Ожидание</span>;
    case 'active':
      return <span className={styles.active}>Активен</span>;
    case 'failed':
      return <span className={styles.failed}>Ошибка</span>;
    case 'deferred':
      return (
        <span className={styles.deferred}>
          Недоступно в этой версии прототипа
        </span>
      );
  }
}
