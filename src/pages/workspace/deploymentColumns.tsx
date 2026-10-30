import { Link } from 'react-router-dom';
import type { Column } from '../../components/ui/DataTable.tsx';
import { IconAttestation, IconBuild } from '../../components/ui/icons.tsx';
import {
  VerificationBadge,
  VersionBadge,
} from '../../components/ui/StatusBadge.tsx';
import {
  formatDate,
  initials,
  type DeploymentRow,
} from '../../data/workspace.ts';
import { projectPath } from '../../app/routing.ts';
import styles from './Workspace.module.css';

export const environment = {
  active: 'Production',
  candidate: 'Preview',
  previous: 'Архив',
} as const;

/** Commit and branch need a connected repository, which the prototype does not have. */
const noRepository = 'Репозиторий не подключён';

export const deploymentColumns: Column<DeploymentRow>[] = [
  {
    key: 'project',
    header: 'Проект',
    render: (row) => (
      <span className={styles.project}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(row.site.businessName)}
        </span>
        <Link to={projectPath(row.site.slug)}>{row.site.businessName}</Link>
      </span>
    ),
  },
  {
    key: 'version',
    header: 'Версия',
    render: (row) => (
      <Link to={projectPath(row.site.slug, '/versions')}>
        Версия {row.version.label} · {row.version.archiveName}
      </Link>
    ),
  },
  {
    key: 'status',
    header: 'Статус',
    render: (row) => (
      <VersionBadge role={row.role} deployment={row.site.deployment} />
    ),
  },
  {
    key: 'env',
    header: 'Среда',
    render: (row) => (
      <span className={styles.envPill}>{environment[row.role]}</span>
    ),
  },
  {
    key: 'commit',
    header: 'Коммит',
    render: () => (
      <span className={styles.iconText} title={noRepository}>
        <IconBuild />—
      </span>
    ),
  },
  {
    key: 'branch',
    header: 'Ветка',
    render: () => (
      <span className={styles.iconText} title={noRepository}>
        <IconAttestation />—
      </span>
    ),
  },
  {
    key: 'date',
    header: 'Дата',
    render: (row) => formatDate(row.version.uploadedAt),
  },
  {
    key: 'verification',
    header: 'Проверка',
    render: (row) => <VerificationBadge status={row.verification} />,
  },
];
