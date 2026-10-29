import {
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useParams,
} from 'react-router-dom';
import { AccessDenied } from '../pages/AccessDenied.tsx';
import { NotFound } from '../pages/NotFound.tsx';
import { useStore } from '../state/store.tsx';

export function RequireOwner() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const dashboard = useMatch({ path: '/manage/:slug', end: true });
  const { state } = useStore();

  if (state.sessionAccountId === null) {
    const next = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?${new URLSearchParams({ next }).toString()}`}
        replace
      />
    );
  }

  const site = state.sites[slug];
  if (!site) return <NotFound />;
  if (site.ownerId !== state.sessionAccountId) return <AccessDenied />;

  return (
    <>
      {dashboard ? <p>Управление сайтом, видно только владельцу</p> : null}
      <Outlet />
    </>
  );
}
