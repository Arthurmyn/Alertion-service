import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable, type Column } from '../../components/ui/DataTable.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { PageHeader } from '../../components/ui/PageHeader.tsx';
import { SearchField } from '../../components/ui/SearchField.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import { StorageMeter } from '../../components/ui/StorageMeter.tsx';
import { LIMITS } from '../../data/limits.ts';
import { formatDate, initials, sessionSites } from '../../data/workspace.ts';
import { projectPath } from '../../app/routing.ts';
import { storageUsedMb } from '../../state/selectors.ts';
import { useStore } from '../../state/store.tsx';
import type { Site } from '../../state/types.ts';
import styles from './Workspace.module.css';

const columns: Column<Site>[] = [
  {
    key: 'name',
    header: 'Название',
    render: () => (
      <span>
        <strong>Архивы версий</strong>
        <br />
        <span className={styles.muted}>
          Статический сайт · лимит {LIMITS.storageMb} МБ
        </span>
      </span>
    ),
  },
  {
    key: 'project',
    header: 'Проект',
    render: (site) => (
      <span className={styles.project}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(site.businessName)}
        </span>
        <Link to={projectPath(site.slug)}>{site.businessName}</Link>
      </span>
    ),
  },
  {
    key: 'usage',
    header: 'Занято',
    render: (site) => (
      <StorageMeter usedMb={storageUsedMb(site)} limitMb={LIMITS.storageMb} />
    ),
  },
  {
    key: 'status',
    header: 'Состояние',
    render: (site) =>
      site.storageDataStatus === 'stale' ? (
        <StatusBadge tone="warning">Данные устарели</StatusBadge>
      ) : (
        <StatusBadge tone="success">Доступно</StatusBadge>
      ),
  },
  {
    key: 'updated',
    header: 'Обновлено',
    render: (site) => formatDate(site.lastUpdatedAt),
  },
  {
    key: 'open',
    header: '',
    align: 'end',
    render: (site) => (
      <Link to={projectPath(site.slug, '/logs')}>Открыть метрики</Link>
    ),
  },
];

export function Storage() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const sites = sessionSites(state).filter(
    (site) => needle === '' || site.businessName.toLowerCase().includes(needle),
  );
  return (
    <>
      <PageHeader title="Хранилище" />
      <div className={styles.toolbarRow}>
        <SearchField
          label="Найти хранилище"
          placeholder="Найти хранилище…"
          value={query}
          onChange={setQuery}
        />
      </div>
      {sites.length === 0 ? (
        <EmptyState title="Хранилищ не найдено">
          Хранилище создаётся вместе с проектом. Измените запрос или создайте
          проект.
        </EmptyState>
      ) : (
        <DataTable
          caption="Хранилища проектов"
          columns={columns}
          rows={sites}
          rowKey={(site) => site.slug}
        />
      )}
    </>
  );
}
