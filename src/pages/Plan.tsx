import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert.tsx';
import { Button } from '../components/ui/Button.tsx';
import { useStore } from '../state/store.tsx';
import { NotFound } from './NotFound.tsx';
import {
  accountLimitLine,
  addSiteButton,
  addSiteNotice,
  archiveLimitLine,
  ownedSites,
  planStatus,
  siteLimitLine,
  storageLimitLine,
  unpackedLimitLine,
} from './PlanText.ts';
import styles from './Plan.module.css';

const limitRows = [
  { term: 'Сайт', text: siteLimitLine },
  { term: 'Архив', text: archiveLimitLine },
  { term: 'Распакованная версия', text: unpackedLimitLine },
  { term: 'Хранилище', text: storageLimitLine },
] as const;

export function Plan() {
  const { slug = '' } = useParams();
  const { state, dispatch } = useStore();
  const site = state.sites[slug];
  const uploadRef = useRef<HTMLAnchorElement>(null);
  const rejectRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef<'upload' | 'reject' | null>(null);
  const [rejectStamp, setRejectStamp] = useState(0);
  const selected = Boolean(site && state.planSelected[site.ownerId]);
  const notice = site
    ? addSiteNotice(state.lastResult, site.businessName)
    : null;

  useEffect(() => {
    const target = moveFocus.current;
    if (!target) return;
    const node = target === 'upload' ? uploadRef.current : rejectRef.current;
    if (!node) return;
    moveFocus.current = null;
    node.focus({ focusVisible: true });
  }, [selected, rejectStamp, notice]);

  if (!site) return <NotFound />;

  const owned = ownedSites(state, site.ownerId);

  function choosePlan() {
    moveFocus.current = 'upload';
    dispatch({ type: 'selectPlan', accountId: site.ownerId });
  }

  function tryAddSite() {
    moveFocus.current = 'reject';
    setRejectStamp((stamp) => stamp + 1);
    dispatch({ type: 'addSite' });
  }

  return (
    <>
      <h1>Пилотный план</h1>
      <p id="plan-status" role="status" aria-live="polite" aria-atomic="true">
        {planStatus(selected)}
      </p>
      <div className={styles.actions}>
        {selected ? (
          <Link
            ref={uploadRef}
            to={`/manage/${site.slug}/upload`}
            aria-describedby="plan-status"
          >
            Перейти к загрузке
          </Link>
        ) : (
          <Button onClick={choosePlan}>Выбрать пилотный план</Button>
        )}
      </div>
      <h2 id="limits-title">Лимиты</h2>
      <dl className={styles.list} aria-labelledby="limits-title">
        {limitRows.map((row) => (
          <div className={styles.row} key={row.term}>
            <dt className={styles.term}>{row.term}</dt>
            <dd className={styles.detail}>{row.text()}</dd>
          </div>
        ))}
      </dl>
      <p>Загрузка сверх лимита не проходит. Активная версия не меняется.</p>
      <h2>Ещё один сайт</h2>
      <p>{accountLimitLine(owned)}</p>
      <div className={styles.actions}>
        <Button onClick={tryAddSite}>{addSiteButton}</Button>
      </div>
      {notice ? (
        <div ref={rejectRef} tabIndex={-1} className={styles.rejection}>
          <Alert key={rejectStamp}>{notice}</Alert>
        </div>
      ) : null}
    </>
  );
}
