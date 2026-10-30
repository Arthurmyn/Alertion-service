import { Link, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card.tsx';
import { DataTable, type Column } from '../../components/ui/DataTable.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { FeaturePage } from '../../components/ui/FeaturePage.tsx';
import { PageHeader } from '../../components/ui/PageHeader.tsx';
import {
  StatusBadge,
  VerificationBadge,
} from '../../components/ui/StatusBadge.tsx';
import { StorageMeter } from '../../components/ui/StorageMeter.tsx';
import { LIMITS } from '../../data/limits.ts';
import { verificationFor } from '../../data/verification.ts';
import { activeVersion, formatDate } from '../../data/workspace.ts';
import { projectPath } from '../../app/routing.ts';
import { exampleUrl, storageUsedMb } from '../../state/selectors.ts';
import { useStore } from '../../state/store.tsx';
import type { Version } from '../../state/types.ts';
import { NotFound } from '../NotFound.tsx';
import { versionSizeLine } from './Versions.copy.ts';
import styles from '../workspace/Workspace.module.css';

function useProjectSite() {
  const { slug = '' } = useParams();
  const { state } = useStore();
  return state.sites[slug];
}

export function ProjectBuilds() {
  const site = useProjectSite();
  if (!site) return <NotFound />;
  const columns: Column<Version>[] = [
    { key: 'version', header: 'Версия', render: (v) => `Версия ${v.label}` },
    {
      key: 'archive',
      header: 'Артефакт',
      render: (v) => <code>{v.archiveName}</code>,
    },
    { key: 'size', header: 'Размер', render: (v) => versionSizeLine(v) },
    {
      key: 'date',
      header: 'Загружен',
      render: (v) => formatDate(v.uploadedAt),
    },
    {
      key: 'commit',
      header: 'Коммит',
      render: () => <span className={styles.muted}>—</span>,
    },
    {
      key: 'repro',
      header: 'Воспроизводимость',
      render: () => <StatusBadge tone="neutral">Недоступно</StatusBadge>,
    },
  ];
  return (
    <FeaturePage
      title="Сборки"
      lead="Артефакты, из которых состоят версии проекта."
      needs="Платформа принимает готовый архив и не собирает его из репозитория: исходный код, коммит и воспроизводимость сборки неизвестны."
      capabilities={[
        {
          term: 'Исходный репозиторий',
          detail: 'Подключённый git-репозиторий и ветка проекта.',
        },
        { term: 'Журнал сборки', detail: 'Шаги и вывод сборки каждой версии.' },
        {
          term: 'Воспроизводимость',
          detail: 'Совпадает ли повторная сборка с развёрнутым образом.',
        },
      ]}
    >
      <DataTable
        caption="Артефакты проекта"
        columns={columns}
        rows={site.versions}
        rowKey={(v) => v.id}
      />
    </FeaturePage>
  );
}

export function ProjectAttestations() {
  const site = useProjectSite();
  if (!site) return <NotFound />;
  const version = activeVersion(site);
  const missing = <span className={styles.muted}>—</span>;
  return (
    <FeaturePage
      title="Аттестации"
      lead="Свидетельства того, что работающая версия проекта соответствует проверенному коду."
      needs="Источник аттестации не подключён: нет анклава, который их выпускает. Ни одно значение ниже не получено и не придумано."
      capabilities={[
        {
          term: 'Историю аттестаций',
          detail: 'Каждая полученная аттестация с датой и результатом.',
        },
        {
          term: 'Сравнение с исходным кодом',
          detail: 'Отчёт о совпадении измерений с ожидаемыми.',
        },
      ]}
    >
      <Card title="Текущая аттестация">
        <dl className={styles.kv}>
          <div>
            <dt>Результат проверки</dt>
            <dd>
              {version ? (
                <VerificationBadge status={verificationFor(site, version)} />
              ) : (
                missing
              )}
            </dd>
          </div>
          <div>
            <dt>Аппаратная аттестация</dt>
            <dd>
              <StatusBadge tone="neutral">Недоступно</StatusBadge>
            </dd>
          </div>
          <div>
            <dt>Анклав</dt>
            <dd>{missing}</dd>
          </div>
          <div>
            <dt>Измерения</dt>
            <dd>{missing}</dd>
          </div>
        </dl>
      </Card>
    </FeaturePage>
  );
}

export function ProjectLogs() {
  const site = useProjectSite();
  if (!site) return <NotFound />;
  return (
    <>
      <PageHeader
        title="Логи и метрики"
        lead="Использование ресурсов проекта и журналы выполнения."
      />
      <div className={styles.grid}>
        <Card title="Хранилище">
          <StorageMeter
            usedMb={storageUsedMb(site)}
            limitMb={LIMITS.storageMb}
          />
        </Card>
        <Card title="Журналы выполнения">
          <EmptyState title="Журналов нет">
            Приложения не запускаются на платформе, поэтому логи и метрики
            запросов не собираются. Это не реализовано в прототипе.
          </EmptyState>
        </Card>
      </div>
    </>
  );
}

export function ProjectSettings() {
  const site = useProjectSite();
  if (!site) return <NotFound />;
  const url = exampleUrl(site);
  return (
    <>
      <PageHeader
        title="Настройки"
        lead="Параметры проекта, подключённый репозиторий, домен и план."
      />
      <div className={styles.grid}>
        <Card title="Проект">
          <dl className={styles.kv}>
            <div>
              <dt>Название</dt>
              <dd>{site.businessName}</dd>
            </div>
            <div>
              <dt>Адрес сайта</dt>
              <dd>
                <Link to={url} className={styles.mono}>
                  {url}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Репозиторий</dt>
              <dd>
                <StatusBadge tone="neutral">Не подключён</StatusBadge>
              </dd>
            </div>
            <div>
              <dt>Переменные окружения</dt>
              <dd>
                <StatusBadge tone="neutral">Не реализовано</StatusBadge>
              </dd>
            </div>
          </dl>
        </Card>
        <Card title="Разделы настроек">
          <ul className={styles.links}>
            <li>
              <Link to={projectPath(site.slug, '/domain')}>Домен</Link>
              <br />
              <span className={styles.muted}>
                Проверка владения и HTTPS (симуляция).
              </span>
            </li>
            <li>
              <Link to={projectPath(site.slug, '/plan')}>Пилотный план</Link>
              <br />
              <span className={styles.muted}>Лимиты и выбор плана.</span>
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
