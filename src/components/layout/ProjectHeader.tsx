import { Link, useLocation } from 'react-router-dom';
import { deploymentLabel } from '../../pages/project/Dashboard.copy.ts';
import { verificationFor } from '../../data/verification.ts';
import { activeVersion } from '../../data/workspace.ts';
import { projectPath } from '../../app/routing.ts';
import type { Site } from '../../state/types.ts';
import { deploymentTone } from '../project/deploymentTone.ts';
import { LinkButton } from '../ui/LinkButton.tsx';
import { StatusBadge, VerificationBadge } from '../ui/StatusBadge.tsx';
import styles from './ProjectHeader.module.css';

/** Second level for the tabs that own more than one page. */
const subpages = {
  '/versions': [
    { suffix: '/versions', label: 'Версии' },
    { suffix: '/upload', label: 'Загрузка' },
    { suffix: '/preview', label: 'Предпросмотр' },
  ],
  '/settings': [
    { suffix: '/settings', label: 'Общие' },
    { suffix: '/domain', label: 'Домен' },
    { suffix: '/plan', label: 'Пилотный план' },
  ],
} as const;

const tabs = [
  { suffix: '', label: 'Обзор', also: [] },
  {
    suffix: '/versions',
    label: 'Развёртывания',
    also: ['/upload', '/preview'],
  },
  { suffix: '/builds', label: 'Сборки', also: [] },
  { suffix: '/attestations', label: 'Аттестации', also: [] },
  { suffix: '/logs', label: 'Логи и метрики', also: [] },
  { suffix: '/settings', label: 'Настройки', also: ['/domain', '/plan'] },
] as const;

/** Project name, state and the tab bar shared by every page of one project. */
export function ProjectHeader({ site }: { site: Site }) {
  const { pathname } = useLocation();
  const base = projectPath(site.slug);
  const version = activeVersion(site);
  const group = (Object.keys(subpages) as (keyof typeof subpages)[]).find(
    (key) => subpages[key].some((page) => pathname === `${base}${page.suffix}`),
  );

  return (
    <div className={styles.header}>
      <nav aria-label="Путь" className={styles.crumbs}>
        <Link to="/manage/projects">Проекты</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className={styles.name}>
          {site.businessName}
        </span>
      </nav>
      <div className={styles.row}>
        <div className={styles.badges}>
          <StatusBadge tone={deploymentTone(site)}>
            {deploymentLabel[site.deployment]}
          </StatusBadge>
          {version ? (
            <VerificationBadge status={verificationFor(site, version)} />
          ) : null}
        </div>
        <LinkButton to={`/site/${site.slug}`} variant="secondary">
          Открыть сайт
        </LinkButton>
      </div>
      <nav aria-label="Разделы проекта" className={styles.tabs}>
        <ul>
          {tabs.map((tab) => {
            const to = `${base}${tab.suffix}`;
            const current =
              pathname === to ||
              tab.also.some((suffix) => pathname === `${base}${suffix}`);
            return (
              <li key={tab.label}>
                <Link
                  to={to}
                  aria-current={current ? 'page' : undefined}
                  className={
                    current ? `${styles.tab} ${styles.current}` : styles.tab
                  }
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {group ? (
        <nav aria-label="Подразделы" className={styles.subnav}>
          <ul>
            {subpages[group].map((page) => {
              const current = pathname === `${base}${page.suffix}`;
              return (
                <li key={page.suffix}>
                  <Link
                    to={`${base}${page.suffix}`}
                    aria-current={current ? 'page' : undefined}
                    className={
                      current
                        ? `${styles.pill} ${styles.pillCurrent}`
                        : styles.pill
                    }
                  >
                    {page.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
