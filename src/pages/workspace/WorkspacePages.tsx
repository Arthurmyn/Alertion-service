import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card.tsx';
import { DataTable, type Column } from '../../components/ui/DataTable.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { FeaturePage } from '../../components/ui/FeaturePage.tsx';
import { LinkButton } from '../../components/ui/LinkButton.tsx';
import { PageHeader } from '../../components/ui/PageHeader.tsx';
import {
  StatusBadge,
  VerificationBadge,
} from '../../components/ui/StatusBadge.tsx';
import { StorageMeter } from '../../components/ui/StorageMeter.tsx';
import { accounts } from '../../data/accounts.ts';
import { LIMITS } from '../../data/limits.ts';
import {
  verificationHint,
  type VerificationStatus,
} from '../../data/verification.ts';
import {
  deploymentRows,
  formatDate,
  sessionSites,
  type DeploymentRow,
} from '../../data/workspace.ts';
import { projectPath } from '../../app/routing.ts';
import { storageUsedMb } from '../../state/selectors.ts';
import { useStore } from '../../state/store.tsx';
import type { Site } from '../../state/types.ts';
import {
  statusActive,
  statusFailed,
  statusPending,
} from '../../components/ui/statusWords.ts';
import {
  accountLimitLine,
  archiveLimitLine,
  planStatus,
  siteLimitLine,
  storageLimitLine,
  unpackedLimitLine,
} from '../project/PlanText.ts';
import { versionSizeLine } from '../project/Versions.copy.ts';
import styles from './Workspace.module.css';

export function Compute() {
  return (
    <FeaturePage
      title="Вычисления"
      lead="Рабочие нагрузки в защищённых аппаратных анклавах."
      needs="Нужны серверы с поддержкой confidential computing и сервис, который запускает образы в анклавах. В прототипе их нет, поэтому ничего не запускается."
      capabilities={[
        {
          term: 'Рабочие нагрузки',
          detail: 'Список приложений, запущенных в анклавах, и их состояние.',
        },
        {
          term: 'Образы анклавов',
          detail:
            'Воспроизводимые образы, собранные из проверенного исходного кода.',
        },
        {
          term: 'Ресурсы',
          detail: 'Процессор, память и размер анклава для каждой нагрузки.',
        },
      ]}
    />
  );
}

export function Secrets() {
  return (
    <FeaturePage
      title="Секреты"
      lead="Переменные окружения и ключи, доступные только внутри анклава."
      needs="Хранилище секретов не реализовано. Значения не принимаются и нигде не сохраняются."
      capabilities={[
        {
          term: 'Переменные окружения',
          detail: 'Значения, привязанные к проекту и среде.',
        },
        { term: 'Доступ', detail: 'Кто и когда читал или менял секрет.' },
      ]}
    />
  );
}

function StorageRow({ site }: { site: Site }) {
  return (
    <div>
      <dt>{site.businessName}</dt>
      <dd>
        <StorageMeter usedMb={storageUsedMb(site)} limitMb={LIMITS.storageMb} />
      </dd>
    </div>
  );
}

const archiveColumns: Column<DeploymentRow>[] = [
  {
    key: 'project',
    header: 'Проект',
    render: (row) => (
      <Link to={projectPath(row.site.slug)}>{row.site.businessName}</Link>
    ),
  },
  {
    key: 'version',
    header: 'Версия',
    render: (row) => `Версия ${row.version.label}`,
  },
  {
    key: 'archive',
    header: 'Артефакт',
    render: (row) => <code>{row.version.archiveName}</code>,
  },
  {
    key: 'size',
    header: 'Размер',
    render: (row) => versionSizeLine(row.version),
  },
  {
    key: 'date',
    header: 'Загружен',
    render: (row) => formatDate(row.version.uploadedAt),
  },
  {
    key: 'repro',
    header: 'Воспроизводимость',
    render: () => <StatusBadge tone="neutral">Недоступно</StatusBadge>,
  },
];

export function Builds() {
  const { state } = useStore();
  const rows = deploymentRows(sessionSites(state));
  return (
    <FeaturePage
      title="Сборки и исходники"
      lead="Из какого кода и как получен каждый артефакт."
      needs="Платформа принимает готовый архив и не собирает его из репозитория. Исходный код, коммит и воспроизводимость сборки неизвестны."
      capabilities={[
        {
          term: 'Исходный репозиторий',
          detail: 'Подключённый git-репозиторий и ветка.',
        },
        {
          term: 'Коммит',
          detail: 'Точная ревизия, из которой собрана версия.',
        },
        {
          term: 'Воспроизводимость',
          detail: 'Результат повторной сборки: совпадает ли образ побайтно.',
        },
      ]}
    >
      {rows.length === 0 ? (
        <EmptyState title="Артефактов пока нет">
          Загрузите архив сайта в проекте: он появится здесь как артефакт.
        </EmptyState>
      ) : (
        <DataTable
          caption="Артефакты сборки"
          columns={archiveColumns}
          rows={rows}
          rowKey={(row) => row.key}
        />
      )}
    </FeaturePage>
  );
}

const states: VerificationStatus[] = [
  'verified',
  'failed',
  'pending',
  'unavailable',
];

function StateLegend() {
  return (
    <dl className={styles.kv}>
      {states.map((status) => (
        <div key={status}>
          <dt>
            <VerificationBadge status={status} />
          </dt>
          <dd>{verificationHint[status]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Attestations() {
  return (
    <FeaturePage
      title="Аттестации"
      lead="Криптографические свидетельства того, что работает в продакшене."
      needs="Источник аттестации не подключён: нет анклава, который их выпускает. Все развёртывания показываются как «Проверка недоступна»."
      capabilities={[
        {
          term: 'Аппаратная аттестация',
          detail: 'Подпись процессора, что код выполняется в анклаве.',
        },
        {
          term: 'Измерения',
          detail:
            'Криптографические хеши образа, конфигурации и среды выполнения.',
        },
        {
          term: 'История',
          detail: 'Все полученные аттестации по времени и проектам.',
        },
      ]}
    />
  );
}

export function Reports() {
  return (
    <FeaturePage
      title="Отчёты проверки"
      lead="Совпадает ли работающая нагрузка с исходным кодом, сборкой, конфигурацией и средой."
      needs="Отчёты не формируются: проверять нечего, пока нет аттестаций и исходного кода. Ниже состояния, которые покажет интерфейс."
      capabilities={[
        {
          term: 'Исходный код',
          detail: 'Совпадение коммита с развёрнутой версией.',
        },
        {
          term: 'Сборка и конфигурация',
          detail: 'Совпадение образа и параметров запуска.',
        },
        {
          term: 'Среда выполнения',
          detail: 'Совпадение измерений анклава с ожидаемыми.',
        },
      ]}
    >
      <Card title="Состояния проверки">
        <StateLegend />
      </Card>
    </FeaturePage>
  );
}

function domainState(site: Site): {
  tone: 'success' | 'warning' | 'error' | 'neutral';
  text: string;
} {
  switch (site.domain.status) {
    case 'active':
      return { tone: 'success', text: statusActive };
    case 'pending':
      return { tone: 'warning', text: statusPending };
    case 'failed':
      return { tone: 'error', text: statusFailed };
    case 'deferred':
      return { tone: 'neutral', text: 'Недоступно в этой версии прототипа' };
    default:
      return { tone: 'neutral', text: 'Не подключён' };
  }
}

export function Networking() {
  const { state } = useStore();
  const sites = sessionSites(state);
  const columns: Column<Site>[] = [
    {
      key: 'project',
      header: 'Проект',
      render: (site) => (
        <Link to={projectPath(site.slug)}>{site.businessName}</Link>
      ),
    },
    {
      key: 'domain',
      header: 'Домен',
      render: (site) =>
        site.domain.name ? (
          <code>{site.domain.name}</code>
        ) : (
          <span className={styles.muted}>Не указан</span>
        ),
    },
    {
      key: 'state',
      header: 'Состояние',
      render: (site) => {
        const item = domainState(site);
        return <StatusBadge tone={item.tone}>{item.text}</StatusBadge>;
      },
    },
    {
      key: 'action',
      header: '',
      align: 'end',
      render: (site) => (
        <Link to={projectPath(site.slug, '/domain')}>Настроить домен</Link>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Сеть"
        lead="Домены проектов, проверка владения и HTTPS. Проверка DNS и выпуск сертификата в прототипе симулируются."
      />
      {sites.length === 0 ? (
        <EmptyState title="Доменов нет">
          Домен подключается внутри проекта. Сначала создайте проект.
        </EmptyState>
      ) : (
        <DataTable
          caption="Домены проектов"
          columns={columns}
          rows={sites}
          rowKey={(site) => site.slug}
        />
      )}
    </>
  );
}

export function Team() {
  const { state } = useStore();
  const account = accounts.find((item) => item.id === state.sessionAccountId);
  return (
    <FeaturePage
      title="Команда и доступ"
      lead="Кто может управлять проектами этого рабочего пространства."
      needs="Приглашения, роли и журнал доступа не реализованы. Сайтом управляет только его владелец, и это проверяется на клиенте."
      capabilities={[
        { term: 'Приглашения', detail: 'Добавление участников по почте.' },
        {
          term: 'Роли',
          detail: 'Владелец, разработчик, аудитор с правом только на чтение.',
        },
        {
          term: 'Журнал доступа',
          detail: 'Кто и когда менял развёртывания и настройки.',
        },
      ]}
    >
      <Card title="Участники">
        {account ? (
          <dl className={styles.kv}>
            <div>
              <dt>{account.ownerName}</dt>
              <dd>Владелец · {account.businessName}</dd>
            </div>
          </dl>
        ) : null}
      </Card>
    </FeaturePage>
  );
}

export function Billing() {
  const { state } = useStore();
  const account = accounts.find((item) => item.id === state.sessionAccountId);
  const sites = sessionSites(state);
  const site = sites[0];
  const selected = account ? state.planSelected[account.id] : false;
  return (
    <>
      <PageHeader
        title="Биллинг"
        lead="План рабочего пространства и использование лимитов. Оплата и счета в прототипе не реализованы."
        actions={
          site ? (
            <LinkButton
              to={projectPath(site.slug, '/plan')}
              variant="secondary"
            >
              Лимиты плана
            </LinkButton>
          ) : null
        }
      />
      <div className={styles.grid}>
        <Card title="Пилотный план">
          <p>{planStatus(selected)}</p>
          <dl className={styles.kv}>
            <div>
              <dt>Сайты</dt>
              <dd>{siteLimitLine()}</dd>
            </div>
            <div>
              <dt>Архив</dt>
              <dd>{archiveLimitLine()}</dd>
            </div>
            <div>
              <dt>Распакованная версия</dt>
              <dd>{unpackedLimitLine()}</dd>
            </div>
            <div>
              <dt>Хранилище</dt>
              <dd>{storageLimitLine()}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Использование">
          <p>{accountLimitLine(sites)}</p>
          {sites.length > 0 ? (
            <dl className={styles.kv}>
              {sites.map((item) => (
                <StorageRow key={item.slug} site={item} />
              ))}
            </dl>
          ) : null}
        </Card>
      </div>
    </>
  );
}

export function WorkspaceSettings() {
  const { state } = useStore();
  const account = accounts.find((item) => item.id === state.sessionAccountId);
  return (
    <FeaturePage
      title="Настройки"
      lead="Параметры рабочего пространства."
      needs="Изменение настроек не реализовано: имя и владелец заданы тестовыми данными."
      capabilities={[
        { term: 'Название', detail: 'Имя рабочего пространства и его адрес.' },
        {
          term: 'Безопасность',
          detail: 'Политики доступа и обязательная проверка перед публикацией.',
        },
      ]}
    >
      {account ? (
        <Card title="Рабочее пространство">
          <dl className={styles.kv}>
            <div>
              <dt>Название</dt>
              <dd>{account.businessName}</dd>
            </div>
            <div>
              <dt>Владелец</dt>
              <dd>{account.ownerName}</dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </FeaturePage>
  );
}

export function Connections() {
  return (
    <FeaturePage
      title="Подключения"
      lead="Внешние сервисы, из которых платформа берёт код и образы."
      needs="Интеграции не реализованы: репозиторий не подключается, образы не собираются. Это первый шаг пути «подключить → собрать → развернуть → аттестовать → проверить»."
      capabilities={[
        {
          term: 'GitHub',
          detail:
            'Репозиторий и ветка, из которых собирается каждое развёртывание.',
        },
        {
          term: 'Реестр образов',
          detail: 'Хранилище воспроизводимых образов для запуска в анклавах.',
        },
      ]}
    />
  );
}
