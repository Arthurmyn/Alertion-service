import { useLayoutEffect, useRef } from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useParams,
} from 'react-router-dom';
import { AccessDenied } from '../../pages/AccessDenied.tsx';
import { NotFound } from '../../pages/NotFound.tsx';
import { useStore } from '../../state/store.tsx';
import { ownerOnlyNote } from './ownerCopy.ts';
import styles from './RequireOwner.module.css';

export function RequireOwner() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const dashboard = useMatch({ path: '/manage/:slug', end: true });
  const { state } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const site = state.sites[slug];
  const signedOut = state.sessionAccountId === null;
  const allowed =
    !signedOut && site !== undefined && site.ownerId === state.sessionAccountId;

  useLayoutEffect(() => {
    if (!allowed) return;
    const heading = panelRef.current?.querySelector('h1');
    const target =
      noteRef.current ?? (heading instanceof HTMLElement ? heading : null);
    if (!target) return;
    target.tabIndex = -1;
    if (target !== noteRef.current) {
      target.style.width = 'fit-content';
      target.style.maxWidth = '100%';
    }
    target.focus();
  }, [allowed, location.pathname, location.search]);

  if (signedOut) {
    const next = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?${new URLSearchParams({ next }).toString()}`}
        replace
      />
    );
  }

  if (!site) return <NotFound />;
  if (site.ownerId !== state.sessionAccountId) return <AccessDenied />;

  return (
    <div ref={panelRef}>
      {dashboard ? (
        <p ref={noteRef} className={styles.note}>
          {ownerOnlyNote}
        </p>
      ) : null}
      <Outlet />
    </div>
  );
}
