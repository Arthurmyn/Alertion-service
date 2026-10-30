import { Link, useParams } from 'react-router-dom';
import { SampleSite } from '../../components/project/SampleSite.tsx';
import { sampleSites } from '../../data/sampleSites.ts';
import { useStore } from '../../state/store.tsx';
import { NotFound } from '../NotFound.tsx';
import styles from './Preview.module.css';
import {
  activeVersionLine,
  candidateVersionLine,
  noCandidateLine,
  previewAudience,
  uploadArchiveLink,
  versionById,
} from './Versions.copy.ts';

export function Preview() {
  const { slug = '' } = useParams();
  const { state } = useStore();
  const site = state.sites[slug];
  if (!site) return <NotFound />;

  const active = versionById(site, site.activeVersionId);
  const candidate = versionById(site, site.candidateVersionId);
  const html = candidate ? sampleSites[candidate.archiveName] : undefined;
  const candidateLine = candidate ? candidateVersionLine(candidate.label) : '';

  return (
    <>
      <h1>Предпросмотр</h1>
      {active ? <p>{activeVersionLine(active.label)}</p> : null}
      <p>{previewAudience}</p>
      {candidate && html ? (
        <div className={styles.frame}>
          <p className={styles.caption}>{candidateLine}</p>
          <SampleSite html={html} />
        </div>
      ) : null}
      {candidate && !html ? (
        <p className={styles.caption}>{candidateLine}</p>
      ) : null}
      {!candidate ? (
        <>
          <p>{noCandidateLine}</p>
          <p>
            <Link to={`/manage/${slug}/upload`}>{uploadArchiveLink}</Link>
          </p>
        </>
      ) : null}
    </>
  );
}
