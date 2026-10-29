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
  siteLimitLine,
  storageLimitLine,
  unpackedLimitLine,
} from './PlanText.ts';
import styles from './Plan.module.css';

const limitRows = [
  { term: 'Сайты', text: siteLimitLine },
  { term: 'Сжатый архив', text: archiveLimitLine },
  { term: 'Распакованная версия', text: unpackedLimitLine },
  { term: 'Хранилище', text: storageLimitLine },
] as const;

export function Plan() {
  const { slug = '' } = useParams();
  const { state, dispatch } = useStore();
  const site = state.sites[slug];
  if (!site) return <NotFound />;

  const selected = state.planSelected[site.ownerId];
  const notice = addSiteNotice(state.lastResult);
  const owned = ownedSites(state, site.ownerId);

  return (
    <>
      <h1>Пилотный план</h1>
      <p role="status">
        {selected ? 'Пилотный план выбран.' : 'Пилотный план не выбран.'}
      </p>
      <p>Сжатый архив и распакованная версия проверяются отдельно.</p>
      <dl className={styles.list} aria-label="Лимиты пилотного плана">
        {limitRows.map((row) => (
          <div className={styles.row} key={row.term}>
            <dt className={styles.term}>{row.term}</dt>
            <dd className={styles.detail}>{row.text()}</dd>
          </div>
        ))}
      </dl>
      <p>Загрузка сверх лимита не проходит. Активная версия не меняется.</p>
      {selected ? (
        <p>
          <Link to={`/manage/${site.slug}/upload`}>Перейти к загрузке</Link>
        </p>
      ) : (
        <div className={styles.actions}>
          <Button
            onClick={() =>
              dispatch({ type: 'selectPlan', accountId: site.ownerId })
            }
          >
            Выбрать пилотный план
          </Button>
        </div>
      )}
      <h2>Второй сайт</h2>
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
