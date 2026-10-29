import { useParams } from 'react-router-dom';
import { SampleSite } from '../components/SampleSite.tsx';
import { sampleSites } from '../data/sampleSites.ts';
import { exampleUrl } from '../state/selectors.ts';
import { useStore } from '../state/store.tsx';
import { NotFound } from './NotFound.tsx';

export function PublicSite() {
  const { slug = '' } = useParams();
  const { state } = useStore();
  const site = state.sites[slug];
  if (!site) return <NotFound />;

  const version = site.versions.find(
    (item) => item.id === site.activeVersionId,
  );
  const html = version ? sampleSites[version.archiveName] : undefined;
  const url = exampleUrl(site);

  return (
    <>
      <h1>Публичная страница</h1>
      <p>Опубликованная страница. Данных управления здесь нет.</p>
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
