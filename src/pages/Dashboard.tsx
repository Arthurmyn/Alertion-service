import { useEffect, useId, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert.tsx';
import { StorageMeter } from '../components/StorageMeter.tsx';
import { LIMITS } from '../data/limits.ts';
import { exampleUrl, storageUsedMb } from '../state/selectors.ts';
import { useStore } from '../state/store.tsx';
import type { DeploymentState, DomainState } from '../state/types.ts';
import {
  statusActive,
  statusFailed,
  statusPending,
} from '../components/statusWords.ts';
import { uploadArchiveLink } from './Versions.copy.ts';
import {
  activeVersionTerm,
  deferredDomainLine,
  deploymentLabel,
} from './Dashboard.copy.ts';
import { NotFound } from './NotFound.tsx';
import styles from './Dashboard.module.css';

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

function freshStorageText(updatedAt: string): string {
  return `Данные обновлены, ${formatUpdatedAt(updatedAt)}`;
}

function DomainValue({ slug, domain }: { slug: string; domain: DomainState }) {
  const to = `/manage/${slug}/domain`;
  switch (domain.status) {
    case 'notStarted':
      return <Link to={to}>Подключить домен</Link>;
    case 'deferred':
      return <>{deferredDomainLine}</>;
    case 'pending':
      return (
        <span className={styles.state}>
          <span className={styles.pending}>{statusPending}</span>
          <span className={styles.next}>
            Запись ещё не видна. <Link to={to}>Проверить снова</Link>
          </span>
        </span>
      );
    case 'active':
      return <span className={styles.ok}>{statusActive}</span>;
    case 'failed':
      return (
        <span className={styles.state}>
          <span className={styles.bad}>{statusFailed}</span>
          <span className={styles.next}>
            Значение TXT не совпало. <Link to={to}>Исправить запись</Link>
          </span>
        </span>
      );
  }
}

export function Dashboard() {
  const { slug = '' } = useParams();
  const { state, dispatch } = useStore();
  const staleId = useId();
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const [refreshedSlug, setRefreshedSlug] = useState<string | null>(null);
  const [focusFeedback, setFocusFeedback] = useState(0);
  const site = state.sites[slug];

  useEffect(() => {
    if (focusFeedback === 0) return;
    feedbackRef.current?.focus();
  }, [focusFeedback]);

  if (!site) return <NotFound />;

  const active = site.versions.find(
    (version) => version.id === site.activeVersionId,
  );
  const url = exampleUrl(site);
  const tone = deploymentTone(site.deployment);
  const storageFeedback =
    refreshedSlug === site.slug && site.storageDataStatus === 'current'
      ? freshStorageText(site.lastUpdatedAt)
      : '';

  function refreshStorage() {
    const updatedAt = new Date().toISOString();
    dispatch({ type: 'refreshStorage', slug: site.slug, updatedAt });
    setRefreshedSlug(site.slug);
    setFocusFeedback((nonce) => nonce + 1);
  }

  return (
    <>
      <h1>Управление сайтом</h1>
      <p className={styles.business}>{site.businessName}</p>
      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>{activeVersionTerm}</dt>
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
          <dd>
            <span className={styles.state}>
              <span className={tone === 'ok' ? styles.ok : styles.bad}>
                {deploymentLabel[site.deployment]}
              </span>
              {tone === 'bad' ? (
                <Link to={`/manage/${site.slug}/versions`}>Открыть версии</Link>
              ) : null}
            </span>
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
                  <span id={staleId}>
                    {staleStorageText(site.lastUpdatedAt)}
                  </span>
                </Alert>
                <button
                  type="button"
                  className={styles.refresh}
                  aria-describedby={staleId}
                  onClick={refreshStorage}
                >
                  Обновить
                </button>
              </div>
            ) : null}
            <div className={styles.live} aria-live="polite" aria-atomic="true">
              {storageFeedback ? (
                <p ref={feedbackRef} tabIndex={-1} className={styles.feedback}>
                  {storageFeedback}
                </p>
              ) : null}
            </div>
          </dd>
        </div>
      </dl>
      <p className={styles.actions}>
        <Link className={styles.primary} to={`/manage/${site.slug}/upload`}>
          {uploadArchiveLink}
        </Link>
      </p>
    </>
  );
}
