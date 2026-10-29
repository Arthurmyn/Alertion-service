import { Link, useParams } from 'react-router-dom';
import { SampleSite } from '../components/SampleSite.tsx';
import { sampleSites } from '../data/sampleSites.ts';
import { useStore } from '../state/store.tsx';
import { NotFound } from './NotFound.tsx';
import styles from './Preview.module.css';
import { activeVersionLine, versionById } from './Versions.copy.ts';

const previewAudience =
  'Предпросмотр видите только вы, пока выполнен вход в аккаунт этого сайта. Посетители и другие аккаунты видят активную версию.';

export function Preview() {
  const { slug = '' } = useParams();
  const { state } = useStore();
  const site = state.sites[slug];
  if (!site) return <NotFound />;

  const active = versionById(site, site.activeVersionId);
  const candidate = versionById(site, site.candidateVersionId);
  const html = candidate ? sampleSites[candidate.archiveName] : undefined;

  return (
    <>
      <h1>Предпросмотр</h1>
      {active ? <p>{activeVersionLine(active.label)}</p> : null}
      {candidate ? (
        <>
          <p>{previewAudience}</p>
          <p className={styles.candidate}>Кандидат: версия {candidate.label}</p>
          {html ? <SampleSite html={html} /> : null}
        </>
      ) : (
        <>
          <p>Кандидата нет.</p>
          <p>
            <Link to={`/manage/${slug}/upload`}>Загрузить архив</Link>
          </p>
          <p>{previewAudience}</p>
        </>
      )}
    </>
  );
}
