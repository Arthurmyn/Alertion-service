import { useLayoutEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../../state/store.tsx';

/** Workspace pages belong to a signed-in account; anyone else is sent to sign in. */
export function RequireAccount() {
  const { state } = useStore();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const signedOut = state.sessionAccountId === null;

  useLayoutEffect(() => {
    if (signedOut) return;
    const heading = panelRef.current?.querySelector('h1');
    if (!(heading instanceof HTMLElement)) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [signedOut, location.pathname, location.search]);

  if (signedOut) {
    const next = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?${new URLSearchParams({ next }).toString()}`}
        replace
      />
    );
  }

  return (
    <div ref={panelRef}>
      <Outlet />
    </div>
  );
}
