import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { accountSlug } from '../routing.ts';
import { useStore } from '../state/store.tsx';
import styles from './AppShell.module.css';

const sections = [
  { suffix: '', label: 'Управление сайтом' },
  { suffix: '/upload', label: 'Загрузка' },
  { suffix: '/preview', label: 'Предпросмотр' },
  { suffix: '/versions', label: 'Версии' },
  { suffix: '/domain', label: 'Домен' },
  { suffix: '/plan', label: 'Пилотный план' },
] as const;

function pathSlug(pathname: string): string | null {
  const match = /^\/(?:manage|site)\/([^/]+)/.exec(pathname);
  const slug = match?.[1];
  if (!slug) return null;
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function linkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.link} ${styles.current}` : styles.link;
}

export function AppShell() {
  const { pathname } = useLocation();
  const { state } = useStore();
  const slug = pathSlug(pathname);
  const publicSite = /^\/site\/[^/]+$/.test(pathname);
  const navSlug = slug ?? accountSlug(state.sessionAccountId);
  const site = slug ? state.sites[slug] : undefined;

  return (
    <div className={styles.shell}>
      <header className={publicSite ? styles.publicHeader : styles.header}>
        <Link to="/" className={styles.brand}>
          <img src="/logo.png" alt="" width={260} height={308} />
          Alertion
        </Link>
        {publicSite && site ? (
          <span className={styles.publicName}>{site.businessName}</span>
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
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
