import { useEffect } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { demoRunning } from '../data/scenarios.ts';
import { accountSlug } from '../routing.ts';
import { consumeScenarioQuery, useStore } from '../state/store.tsx';
import styles from './AppShell.module.css';
import { DemoBar } from './DemoBar.tsx';
import { ScenarioPanel } from './ScenarioPanel.tsx';

const sections = [
  { suffix: '', label: 'Управление сайтом' },
  { suffix: '/upload', label: 'Загрузка' },
  { suffix: '/preview', label: 'Предпросмотр' },
  { suffix: '/versions', label: 'Версии' },
  { suffix: '/domain', label: 'Домен' },
  { suffix: '/plan', label: 'Пилотный план' },
] as const;

function readSlug(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function manageSlug(pathname: string): string | null {
  return readSlug(/^\/manage\/([^/]+)/.exec(pathname)?.[1]);
}

function publicSlug(pathname: string): string | null {
  return readSlug(/^\/site\/([^/]+)$/.exec(pathname)?.[1]);
}

function linkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.link} ${styles.current}` : styles.link;
}

export function AppShell() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { state } = useStore();
  const running = demoRunning(state.demo);

  useEffect(() => {
    consumeScenarioQuery(search, pathname, navigate);
  }, [pathname, search, navigate]);
  const navSlug = manageSlug(pathname) ?? accountSlug(state.sessionAccountId);
  const siteSlug = publicSlug(pathname);
  const publicSite = siteSlug ? state.sites[siteSlug] : undefined;

  return (
    <div
      className={running ? `${styles.shell} ${styles.withDemo}` : styles.shell}
    >
      <header className={publicSite ? styles.publicHeader : styles.header}>
        <Link to="/" className={styles.brand}>
          <img src="/logo.png" alt="" width={260} height={308} />
          Alertion
        </Link>
        {publicSite ? (
          <span className={styles.publicName}>{publicSite.businessName}</span>
        ) : null}
        {publicSite ? null : (
          <nav aria-label="Разделы">
            <ul className={styles.nav}>
              {state.sessionAccountId === null ? (
                <li>
                  <NavLink to="/login" end className={linkClass}>
                    Вход
                  </NavLink>
                </li>
              ) : null}
              {navSlug
                ? sections.map((section) => (
                    <li key={section.label}>
                      <NavLink
                        to={`/manage/${navSlug}${section.suffix}`}
                        end
                        className={linkClass}
                      >
                        {section.label}
                      </NavLink>
                    </li>
                  ))
                : null}
              <li>
                <NavLink to="/defense" end className={linkClass}>
                  Защита проекта
                </NavLink>
              </li>
            </ul>
          </nav>
        )}
        <ScenarioPanel />
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <DemoBar />
    </div>
  );
}
