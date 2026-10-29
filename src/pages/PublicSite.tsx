import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SampleSite } from '../components/SampleSite.tsx';
import { sampleSites } from '../data/sampleSites.ts';
import { exampleUrl } from '../state/selectors.ts';
import { useStore } from '../state/store.tsx';
import { NotFound } from './NotFound.tsx';
import { publicBoundary, publicHeading } from './PublicSite.copy.ts';
import styles from './PublicSite.module.css';

export function PublicSite() {
  const { slug = '' } = useParams();
  const { state } = useStore();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const site = state.sites[slug];

  useEffect(() => {
    headingRef.current?.focus();
  }, [slug]);

  if (!site) return <NotFound />;

  const version = site.versions.find(
    (item) => item.id === site.activeVersionId,
  );
  const html = version ? sampleSites[version.archiveName] : undefined;
  const url = exampleUrl(site);

  return (
    <>
      <h1 ref={headingRef} className={styles.title} tabIndex={-1}>
        {publicHeading}
      </h1>
      <p>{publicBoundary}</p>
      <p>
        Адрес сайта{' '}
        <a href={url}>
          <code>{url}</code>
        </a>
      </p>
      {html ? (
        <SampleSite html={html} />
      ) : (
        <p>Содержимое страницы не найдено.</p>
      )}
    </>
  );
}
