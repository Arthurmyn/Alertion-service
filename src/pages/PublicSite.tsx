import { useParams } from 'react-router-dom';
import { useStore } from '../state/store.tsx';
import { NotFound } from './NotFound.tsx';

export function PublicSite() {
  const { slug = '' } = useParams();
  const { state } = useStore();
  if (!state.sites[slug]) return <NotFound />;
  return <h1>Публичная страница</h1>;
}
