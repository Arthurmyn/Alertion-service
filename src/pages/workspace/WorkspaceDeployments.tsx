import { useCallback, useRef, useState } from 'react';
import { DataTable } from '../../components/ui/DataTable.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { IconClose, IconPlus } from '../../components/ui/icons.tsx';
import { PageHeader } from '../../components/ui/PageHeader.tsx';
import { Popover } from '../../components/ui/Popover.tsx';
import popover from '../../components/ui/Popover.module.css';
import {
  deploymentRows,
  sessionSites,
  type DeploymentRow,
} from '../../data/workspace.ts';
import { useStore } from '../../state/store.tsx';
import { deploymentColumns, environment } from './deploymentColumns.tsx';
import styles from './Workspace.module.css';

type Status = 'active' | 'candidate' | 'previous' | 'error';

const statusLabel: Record<Status, string> = {
  active: 'Активна',
  candidate: 'Кандидат',
  previous: 'Предыдущая',
  error: 'Ошибка',
};

interface Filters {
  project?: string;
  env?: string;
  status?: Status;
}

function statusOf(row: DeploymentRow): Status {
  if (
    row.role === 'active' &&
    (row.site.deployment === 'publishFailed' ||
      row.site.deployment === 'rollbackFailed')
  ) {
    return 'error';
  }
  return row.role;
}

export function WorkspaceDeployments() {
  const { state } = useStore();
  const [filters, setFilters] = useState<Filters>({});
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const sites = sessionSites(state);
  const rows = deploymentRows(sites).filter(
    (row) =>
      (!filters.project || row.site.slug === filters.project) &&
      (!filters.env || environment[row.role] === filters.env) &&
      (!filters.status || statusOf(row) === filters.status),
  );
  const applied = [
    filters.project
      ? {
          key: 'project' as const,
          name: 'Проект',
          value:
            sites.find((site) => site.slug === filters.project)?.businessName ??
            filters.project,
        }
      : null,
    filters.env
      ? { key: 'env' as const, name: 'Среда', value: filters.env }
      : null,
    filters.status
      ? {
          key: 'status' as const,
          name: 'Статус',
          value: statusLabel[filters.status],
        }
      : null,
  ].filter((chip) => chip !== null);

  function pick(next: Filters) {
    setFilters((current) => ({ ...current, ...next }));
    setOpen(false);
  }

  return (
    <>
      <PageHeader title="Развёртывания" />
      <div className={styles.chips}>
        <button
          ref={anchor}
          type="button"
          className={styles.chipButton}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <IconPlus />
          Добавить фильтр
        </button>
        <Popover
          anchor={anchor}
          open={open}
          onClose={close}
          label="Добавить фильтр"
          width={260}
        >
          <div className={popover.list}>
            <p className={popover.heading}>Проект</p>
            {sites.map((site) => (
              <button
                key={site.slug}
                type="button"
                className={popover.item}
                onClick={() => pick({ project: site.slug })}
              >
                <span className={popover.itemText}>{site.businessName}</span>
              </button>
            ))}
            <p className={popover.heading}>Среда</p>
            {Object.values(environment).map((env) => (
              <button
                key={env}
                type="button"
                className={popover.item}
                onClick={() => pick({ env })}
              >
                <span className={popover.itemText}>{env}</span>
              </button>
            ))}
            <p className={popover.heading}>Статус</p>
            {(Object.keys(statusLabel) as Status[]).map((status) => (
              <button
                key={status}
                type="button"
                className={popover.item}
                onClick={() => pick({ status })}
              >
                <span className={popover.itemText}>{statusLabel[status]}</span>
              </button>
            ))}
          </div>
        </Popover>
        {applied.map((chip) => (
          <span key={chip.key} className={styles.chip}>
            {chip.name} <strong>{chip.value}</strong>
            <button
              type="button"
              aria-label={`Убрать фильтр: ${chip.name} ${chip.value}`}
              onClick={() =>
                setFilters((current) => ({ ...current, [chip.key]: undefined }))
              }
            >
              <IconClose />
            </button>
          </span>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Развёртываний не найдено">
          {applied.length > 0
            ? 'Уберите фильтр или выберите другие значения.'
            : 'Откройте проект и загрузите архив сайта.'}
        </EmptyState>
      ) : (
        <DataTable
          headless
          caption="Развёртывания рабочего пространства"
          columns={deploymentColumns}
          rows={rows}
          rowKey={(row) => row.key}
        />
      )}
    </>
  );
}
