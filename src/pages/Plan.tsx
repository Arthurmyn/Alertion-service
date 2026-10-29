import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert.tsx';
import { Button } from '../components/Button.tsx';
import { useStore } from '../state/store.tsx';
import { NotFound } from './NotFound.tsx';
import {
  accountLimitLine,
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
  if (!site) return <NotFound />;

  const selected = state.planSelected[site.ownerId];
  const notice = addSiteNotice(state.lastResult, site.businessName);
  const owned = ownedSites(state, site.ownerId);

  return (
    <>
      <h1>Пилотный план</h1>
      <p id="plan-status" role="status" aria-live="polite" aria-atomic="true">
        {planStatus(selected)}
      </p>
      <div className={styles.actions}>
        {selected ? (
          <Link
            to={`/manage/${site.slug}/upload`}
            aria-describedby="plan-status"
          >
            Перейти к загрузке
          </Link>
        ) : (
          <Button
            onClick={() =>
              dispatch({ type: 'selectPlan', accountId: site.ownerId })
            }
          >
            Выбрать пилотный план
          </Button>
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
        <Button onClick={() => dispatch({ type: 'addSite' })}>
          Добавить сайт
        </Button>
      </div>
      {notice ? <Alert>{notice}</Alert> : null}
    </>
  );
}
