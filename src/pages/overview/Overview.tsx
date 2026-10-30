import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import {
  IconBell,
  IconFilter,
  IconGrid,
  IconList,
} from '../../components/ui/icons.tsx';
import { Popover } from '../../components/ui/Popover.tsx';
import popover from '../../components/ui/Popover.module.css';
import { ProjectCard } from '../../components/project/ProjectCard.tsx';
import { Ring } from '../../components/ui/Ring.tsx';
import { SearchField } from '../../components/ui/SearchField.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import { LIMITS } from '../../data/limits.ts';
import { formatDate, sessionSites } from '../../data/workspace.ts';
import { projectPath } from '../../app/routing.ts';
import { storageUsedMb } from '../../state/selectors.ts';
import { useStore } from '../../state/store.tsx';
import type { Site } from '../../state/types.ts';
import { ruCount } from '../project/PlanText.ts';
import { siteAlerts } from './siteAlerts.ts';
import { useCreateProject } from './useCreateProject.ts';
import styles from './Overview.module.css';

type StatusFilter = 'all' | 'live' | 'attention';

const filterLabel: Record<StatusFilter, string> = {
  all: 'Все статусы',
  live: 'Опубликованные',
  attention: 'Требуют внимания',
};

function mb(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} МБ`;
}

function needsAttention(site: Site): boolean {
  return (
    site.deployment === 'publishFailed' || site.deployment === 'rollbackFailed'
  );
}

function Usage({ sites }: { sites: readonly Site[] }) {
  const versions = sites.flatMap((site) => site.versions);
  const stored = sites.reduce((sum, site) => sum + storageUsedMb(site), 0);
  const largestArchive = Math.max(0, ...versions.map((v) => v.archiveMb));
  const largestUnpacked = Math.max(0, ...versions.map((v) => v.unpackedMb));
  const rows = [
    {
      label: 'Хранилище',
      used: stored,
      limit: LIMITS.storageMb,
      text: `${mb(stored)} / ${mb(LIMITS.storageMb)}`,
    },
    {
      label: 'Сайты',
      used: sites.length,
      limit: LIMITS.sites,
      text: `${sites.length} / ${LIMITS.sites}`,
    },
    {
      label: 'Самый большой архив',
      used: largestArchive,
      limit: LIMITS.archiveMb,
      text: `${mb(largestArchive)} / ${mb(LIMITS.archiveMb)}`,
    },
    {
      label: 'Самая большая версия',
      used: largestUnpacked,
      limit: LIMITS.unpackedMb,
      text: `${mb(largestUnpacked)} / ${mb(LIMITS.unpackedMb)}`,
    },
  ];
  return (
    <section className={styles.block} aria-labelledby="overview-usage">
      <h2 id="overview-usage" className={styles.blockTitle}>
        Использование
      </h2>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <span>Пилотный план</span>
          <Link to="/manage/billing" className={styles.small}>
            Лимиты плана
          </Link>
        </div>
        <ul className={styles.usage}>
          {rows.map((row) => (
            <li key={row.label}>
              <Ring used={row.used} limit={row.limit} />
              <span className={styles.usageLabel}>{row.label}</span>
              <span className={styles.usageValue}>{row.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Alerts({ sites }: { sites: readonly Site[] }) {
  const alerts = siteAlerts(sites);
  return (
    <section className={styles.block} aria-labelledby="overview-alerts">
      <h2 id="overview-alerts" className={styles.blockTitle}>
        Уведомления
      </h2>
      {alerts.length === 0 ? (
        <div className={`${styles.panel} ${styles.centered}`}>
          <span className={styles.bell}>
            <IconBell />
          </span>
          <p>
            Здесь появятся сбои публикации, ошибки домена и устаревшие данные
            хранилища.
          </p>
          <p className={styles.muted}>Сейчас всё в порядке.</p>
        </div>
      ) : (
        <ul className={`${styles.panel} ${styles.alerts}`}>
          {alerts.map((alert) => (
            <li key={alert.key}>
              <StatusBadge tone={alert.tone}>
                {alert.tone === 'error' ? 'Ошибка' : 'Внимание'}
              </StatusBadge>
              <div>
                <p className={styles.alertTitle}>{alert.title}</p>
                <p className={styles.muted}>{alert.project}</p>
              </div>
              <Link to={alert.to}>{alert.action}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Previews({ sites }: { sites: readonly Site[] }) {
  const items = sites.flatMap((site) => {
    const version = site.versions.find(
      (item) => item.id === site.candidateVersionId,
    );
    return version ? [{ site, version }] : [];
  });
  return (
    <section className={styles.block} aria-labelledby="overview-previews">
      <h2 id="overview-previews" className={styles.blockTitle}>
        Недавние предпросмотры
      </h2>
      {items.length === 0 ? (
        <EmptyState title="Нет версий-кандидатов">
          Загрузите архив: проверенная версия появится здесь до публикации.
        </EmptyState>
      ) : (
        <ul className={`${styles.panel} ${styles.previews}`}>
          {items.map(({ site, version }) => (
            <li key={`${site.slug}/${version.id}`}>
              <div>
                <p className={styles.alertTitle}>
                  Версия {version.label} · {version.archiveName}
                </p>
                <p className={styles.muted}>
                  {site.businessName} · {formatDate(version.uploadedAt)}
                </p>
              </div>
              <Link to={projectPath(site.slug, '/preview')}>Предпросмотр</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProjectsGrid({ sites }: { sites: readonly Site[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLButtonElement>(null);
  const closeFilter = useCallback(() => setFilterOpen(false), []);
  const needle = query.trim().toLowerCase();

  const shown = sites.filter((site) => {
    if (status === 'live' && needsAttention(site)) return false;
    if (status === 'attention' && !needsAttention(site)) return false;
    return (
      needle === '' ||
      site.businessName.toLowerCase().includes(needle) ||
      site.slug.toLowerCase().includes(needle)
    );
  });

  return (
    <section className={styles.block} aria-labelledby="overview-projects">
      <h2 id="overview-projects" className={styles.blockTitle}>
        Проекты
      </h2>
      <div className={styles.toolbar}>
        <SearchField
          label="Поиск проектов"
          placeholder="Поиск проектов"
          value={query}
          onChange={setQuery}
        />
        <button
          ref={filterRef}
          type="button"
          className={styles.toolButton}
          aria-haspopup="true"
          aria-expanded={filterOpen}
          aria-label={`Фильтр по статусу: ${filterLabel[status]}`}
          data-active={status !== 'all' ? 'true' : undefined}
          onClick={() => setFilterOpen((value) => !value)}
        >
          <IconFilter />
        </button>
        <Popover
          anchor={filterRef}
          open={filterOpen}
          onClose={closeFilter}
          label="Фильтр по статусу"
          align="end"
          width={220}
        >
          <ul className={popover.list}>
            {(Object.keys(filterLabel) as StatusFilter[]).map((key) => (
              <li key={key}>
                <button
                  type="button"
                  className={popover.item}
                  aria-current={status === key ? 'true' : undefined}
                  onClick={() => {
                    setStatus(key);
                    setFilterOpen(false);
                  }}
                >
                  <span className={popover.itemText}>{filterLabel[key]}</span>
                </button>
              </li>
            ))}
          </ul>
        </Popover>
        <div className={styles.segment} role="group" aria-label="Вид списка">
          <button
            type="button"
            aria-pressed={view === 'grid'}
            aria-label="Сетка"
            onClick={() => setView('grid')}
          >
            <IconGrid />
          </button>
          <button
            type="button"
            aria-pressed={view === 'list'}
            aria-label="Список"
            onClick={() => setView('list')}
          >
            <IconList />
          </button>
        </div>
      </div>
      <p className={styles.count} role="status" aria-live="polite">
        {ruCount(shown.length, 'проект', 'проекта', 'проектов')}
      </p>
      {sites.length === 0 ? (
        <EmptyState title="Проектов пока нет">
          Создайте проект и загрузите архив сайта: он появится здесь.
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState title="Ничего не найдено">
          Измените запрос или статус, чтобы увидеть проекты.
        </EmptyState>
      ) : (
        <ul className={view === 'grid' ? styles.cards : styles.rows}>
          {shown.map((site) => (
            <ProjectCard key={site.slug} site={site} row={view === 'list'} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function Overview() {
  const { state } = useStore();
  const { notice } = useCreateProject();
  const sites = sessionSites(state);
  return (
    <>
      <h1 className="visually-hidden">Обзор пространства</h1>
      {notice ? (
        <div className={styles.notice}>
          <Alert>{notice}</Alert>
        </div>
      ) : null}
      <div className={styles.layout}>
        <div className={styles.side}>
          <Usage sites={sites} />
          <Alerts sites={sites} />
          <Previews sites={sites} />
        </div>
        <ProjectsGrid sites={sites} />
      </div>
    </>
  );
}
