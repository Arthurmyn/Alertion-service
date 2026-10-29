import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert.tsx';
import { Button } from '../components/Button.tsx';
import { StatusLabel } from '../components/StatusLabel.tsx';
import { StorageMeter } from '../components/StorageMeter.tsx';
import { LIMITS } from '../data/limits.ts';
import { exampleUrl, storageUsedMb } from '../state/selectors.ts';
import { useStore } from '../state/store.tsx';
import type { DeploymentState, DomainState } from '../state/types.ts';
import { NotFound } from './NotFound.tsx';
import styles from './Dashboard.module.css';

function deploymentText(deployment: DeploymentState): string {
  switch (deployment) {
    case 'published':
      return 'Опубликовано';
    case 'publishFailed':
      return 'Ошибка публикации';
    case 'rolledBack':
      return 'Откат выполнен';
    case 'rollbackFailed':
      return 'Ошибка отката';
  }
}

function deploymentTone(deployment: DeploymentState): 'ok' | 'bad' {
  if (deployment === 'publishFailed' || deployment === 'rollbackFailed') {
    return 'bad';
  }
  return 'ok';
}

/** Stored timestamps are UTC. Show that clock so the label does not follow the browser zone. */
function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function staleStorageText(updatedAt: string): string {
  return `Данные устарели, обновлено ${formatUpdatedAt(updatedAt)}`;
}

function DomainValue({ slug, domain }: { slug: string; domain: DomainState }) {
  switch (domain.status) {
    case 'notStarted':
      return <Link to={`/manage/${slug}/domain`}>Подключить домен</Link>;
    case 'deferred':
      return <>Домен: недоступно в этой версии прототипа</>;
    case 'pending':
    case 'active':
    case 'failed':
      return <StatusLabel status={domain.status} />;
  }
}

export function Dashboard() {
  const { slug = '' } = useParams();
  const { state, dispatch } = useStore();
  const site = state.sites[slug];
  if (!site) return <NotFound />;

  const active = site.versions.find(
    (version) => version.id === site.activeVersionId,
  );
  const url = exampleUrl(site);
  const tone = deploymentTone(site.deployment);

  return (
    <>
      <h1>Управление сайтом</h1>
      <p className={styles.business}>{site.businessName}</p>
      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Активная версия</dt>
          <dd>{active?.label ?? site.activeVersionId}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Адрес сайта</dt>
          <dd>
            <Link className={styles.url} to={url}>
              {url}
            </Link>
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Публикация</dt>
          <dd className={tone === 'ok' ? styles.ok : styles.bad}>
            {deploymentText(site.deployment)}
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Домен</dt>
          <dd>
            <DomainValue slug={site.slug} domain={site.domain} />
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Хранилище</dt>
          <dd>
            <StorageMeter
              usedMb={storageUsedMb(site)}
              limitMb={LIMITS.storageMb}
            />
            {site.storageDataStatus === 'stale' ? (
              <div className={styles.stale}>
                <Alert tone="warn">
                  {staleStorageText(site.lastUpdatedAt)}
                </Alert>
                <Button
                  onClick={() =>
                    dispatch({
                      type: 'refreshStorage',
                      slug: site.slug,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                >
                  Обновить
                </Button>
              </div>
            ) : null}
          </dd>
        </div>
      </dl>
      <p className={styles.actions}>
        <Link className={styles.primary} to={`/manage/${site.slug}/upload`}>
          Загрузить архив
        </Link>
      </p>
    </>
  );
}
