import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Alert } from '../components/Alert.tsx';
import { accounts } from '../data/accounts.ts';
import { accountSlug } from '../app/routing.ts';
import { useStore } from '../state/store.tsx';
import {
  deniedBody,
  deniedLead,
  deniedTitle,
  ownSiteLink,
} from './AccessDenied.copy.ts';
import styles from './AccessDenied.module.css';

export function AccessDenied() {
  const { state } = useStore();
  const slug = accountSlug(state.sessionAccountId);
  const account = accounts.find((item) => item.id === state.sessionAccountId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    headingRef.current?.focus();
  }, [pathname]);

  return (
    <>
      <h1 ref={headingRef} className={styles.title} tabIndex={-1}>
        {deniedTitle}
      </h1>
      <Alert>
        {account ? `${deniedLead(account.ownerName)} ` : null}
        {deniedBody}
      </Alert>
      {slug !== null && account ? (
        <p>
          <Link to={`/manage/${slug}`}>
            {ownSiteLink(account.businessName)}
          </Link>
        </p>
      ) : (
        <p>
          <Link to="/login">Вход</Link>
        </p>
      )}
    </>
  );
}
