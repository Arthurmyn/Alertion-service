import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { FeaturePage } from '../../components/ui/FeaturePage.tsx';
import { IconChevronRight } from '../../components/ui/icons.tsx';
import { PageHeader } from '../../components/ui/PageHeader.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import { StorageMeter } from '../../components/ui/StorageMeter.tsx';
import { LIMITS } from '../../data/limits.ts';
import { sessionSites } from '../../data/workspace.ts';
import { storageUsedMb } from '../../state/selectors.ts';
import { useStore } from '../../state/store.tsx';
import type { Version } from '../../state/types.ts';
import styles from './Observability.module.css';

function SizeBars({ versions }: { versions: readonly Version[] }) {
  const top = Math.max(1, ...versions.map((item) => item.unpackedMb));
  const label = versions
    .map(
      (item) =>
        `Версия ${item.label}: архив ${item.archiveMb} МБ, распакованная ${item.unpackedMb} МБ`,
    )
    .join('; ');
  return (
    <figure className={styles.chart}>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <line className={styles.axis} x1="0" y1="39.5" x2="100" y2="39.5" />
        {versions.map((item, index) => {
          const slot = 100 / versions.length;
          const width = Math.min(10, slot * 0.28);
          const x = index * slot + slot / 2;
          const unpacked = (item.unpackedMb / top) * 36;
          const archive = (item.archiveMb / top) * 36;
          return (
            <g key={item.id}>
              <rect
                className={styles.barLight}
                x={x - width}
                y={39 - unpacked}
                width={width}
                height={unpacked}
              />
              <rect
                className={styles.barDark}
                x={x}
                y={39 - archive}
                width={width}
                height={archive}
              />
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.legend}>
        <span className={styles.keyLight}>Распакованная версия</span>
        <span className={styles.keyDark}>Архив</span>
      </figcaption>
    </figure>
  );
}

function MetricCard({
  title,
  to,
  children,
}: {
  title: string;
  to?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h2>{title}</h2>
        {to ? (
          <Link to={to} aria-label={`Открыть: ${title}`}>
            <IconChevronRight />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Observability() {
  const { state } = useStore();
  const sites = sessionSites(state);
  const versions = sites.flatMap((site) => site.versions);
  const stored = sites.reduce((sum, site) => sum + storageUsedMb(site), 0);
  return (
    <>
      <PageHeader title="Наблюдаемость" />
      <div className={styles.grid}>
        <MetricCard title="Развёртывания" to="/manage/deployments">
          <p className={styles.label}>Версий</p>
          <p className={styles.value}>{versions.length}</p>
          {versions.length > 0 ? (
            <SizeBars versions={versions} />
          ) : (
            <p className={styles.empty}>
              Загрузите архив, чтобы увидеть размеры.
            </p>
          )}
        </MetricCard>
        <MetricCard title="Хранилище" to="/manage/storage">
          <p className={styles.label}>Занято</p>
          <p className={styles.value}>
            {Math.round(stored * 10) / 10} МБ
            <span className={styles.of}> из {LIMITS.storageMb} МБ</span>
          </p>
          <div className={styles.meters}>
            {sites.map((site) => (
              <div key={site.slug}>
                <p className={styles.label}>{site.businessName}</p>
                <StorageMeter
                  usedMb={storageUsedMb(site)}
                  limitMb={LIMITS.storageMb}
                />
              </div>
            ))}
          </div>
        </MetricCard>
        <MetricCard title="Запросы к сайту">
          <p className={styles.label}>Запросы</p>
          <p className={styles.value}>н/д</p>
          <p className={styles.empty}>
            Нет данных за выбранный период: запросы к сайту не собираются.
          </p>
          <div className={styles.badge}>
            <StatusBadge tone="neutral">Не реализовано в прототипе</StatusBadge>
          </div>
        </MetricCard>
        <MetricCard title="Журналы выполнения" to="/manage/observability/logs">
          <p className={styles.label}>Записей</p>
          <p className={styles.value}>н/д</p>
          <p className={styles.empty}>
            Приложения не запускаются на платформе, поэтому журналов нет.
          </p>
          <div className={styles.badge}>
            <StatusBadge tone="neutral">Не реализовано в прототипе</StatusBadge>
          </div>
        </MetricCard>
      </div>
    </>
  );
}

export function Logs() {
  return (
    <FeaturePage
      title="Логи"
      lead="Журналы выполнения приложений по проектам."
      needs="Журналы не собираются: приложения не запускаются на платформе. Фильтры и поиск появятся вместе с источником данных."
      capabilities={[
        {
          term: 'Поиск и фильтры',
          detail: 'По проекту, среде, уровню и времени записи.',
        },
        {
          term: 'Связь с развёртыванием',
          detail: 'Запись ведёт к версии и коммиту, которые её выпустили.',
        },
      ]}
    >
      <EmptyState title="Журналов нет">
        Здесь будут записи выполнения, когда появится запущенное приложение.
      </EmptyState>
    </FeaturePage>
  );
}

export function Query() {
  return (
    <FeaturePage
      title="Запросы"
      lead="Произвольные запросы к метрикам и журналам."
      needs="Нет хранилища метрик и журналов, по которому можно выполнять запросы."
      capabilities={[
        {
          term: 'Запросы',
          detail: 'Выборки по запросам, ошибкам и задержкам с группировкой.',
        },
        {
          term: 'Сохранённые отчёты',
          detail:
            'Повторяемые запросы для аудита и сверки с отчётами проверки.',
        },
      ]}
    />
  );
}
