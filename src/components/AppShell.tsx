import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
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
import {
  IconCollapse,
  IconDashboard,
  IconDefense,
  IconDomain,
  IconExpand,
  IconMenu,
  IconPlan,
  IconPreview,
  IconSignIn,
  IconUpload,
  IconVersions,
} from './icons.tsx';
import {
  browserStorage,
  readNavCollapsed,
  writeNavCollapsed,
} from './navState.ts';
import styles from './AppShell.module.css';
import { DemoBar } from './DemoBar.tsx';
import { ScenarioPanel } from './ScenarioPanel.tsx';

const sections = [
  { suffix: '', label: 'Управление сайтом', Icon: IconDashboard },
  { suffix: '/upload', label: 'Загрузка', Icon: IconUpload },
  { suffix: '/preview', label: 'Предпросмотр', Icon: IconPreview },
  { suffix: '/versions', label: 'Версии', Icon: IconVersions },
  { suffix: '/domain', label: 'Домен', Icon: IconDomain },
  { suffix: '/plan', label: 'Пилотный план', Icon: IconPlan },
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

function focusMain(): void {
  const heading = document.querySelector('main h1');
  if (!(heading instanceof HTMLElement)) return;
  heading.tabIndex = -1;
  heading.focus({ focusVisible: true });
}

function NavItem({
  to,
  label,
  iconOnly,
  onNavigate,
  children,
}: {
  to: string;
  label: string;
  iconOnly: boolean;
  onNavigate: () => void;
  children: ReactNode;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end
        className={linkClass}
        title={iconOnly ? label : undefined}
        aria-label={iconOnly ? label : undefined}
        onClick={onNavigate}
      >
        {children}
        <span className={styles.name}>{label}</span>
      </NavLink>
    </li>
  );
}

export function AppShell() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { state } = useStore();
  const [collapsed, setCollapsed] = useState(() =>
    readNavCollapsed(browserStorage()),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pathMark, setPathMark] = useState(pathname);
  const [focusRequest, setFocusRequest] = useState<{
    kind: 'menu' | 'page';
    id: number;
  } | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const topbarRef = useRef<HTMLDivElement>(null);
  const navId = useId();

  function queueFocus(kind: 'menu' | 'page') {
    setFocusRequest((current) => ({
      kind,
      id: (current?.id ?? 0) + 1,
    }));
  }

  if (pathMark !== pathname) {
    setPathMark(pathname);
    if (drawerOpen) {
      queueFocus('page');
      setDrawerOpen(false);
    }
  }

  const navSlug = manageSlug(pathname) ?? accountSlug(state.sessionAccountId);
  const siteSlug = publicSlug(pathname);
  const publicSite = siteSlug ? state.sites[siteSlug] : undefined;
  const isPublic = Boolean(publicSite);
  const running = demoRunning(state.demo);

  useEffect(() => {
    consumeScenarioQuery(search, pathname, navigate);
  }, [pathname, search, navigate]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(max-width: 768px)');
    const onChange = () => {
      if (!media.matches) setDrawerOpen(false);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const node = topbarRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const apply = () => {
      document.documentElement.style.setProperty(
        '--topbar-h',
        `${node.offsetHeight}px`,
      );
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isPublic]);

  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.kind === 'menu') {
      menuRef.current?.focus({ focusVisible: true });
    }
    if (focusRequest.kind === 'page') focusMain();
  }, [focusRequest]);

  useEffect(() => {
    if (!drawerOpen) return;

    sidebarRef.current
      ?.querySelector<HTMLElement>('nav a')
      ?.focus({ focusVisible: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      queueFocus('menu');
      setDrawerOpen(false);
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      writeNavCollapsed(browserStorage(), next);
      return next;
    });
  }

  function openDrawer() {
    setDrawerOpen(true);
  }

  function dismissDrawer() {
    queueFocus('menu');
    setDrawerOpen(false);
  }

  function onNavigate() {
    if (!drawerOpen) return;
    queueFocus('page');
    setDrawerOpen(false);
  }

  if (publicSite) {
    return (
      <div
        className={
          running ? `${styles.public} ${styles.withDemo}` : styles.public
        }
      >
        <header className={styles.publicHeader}>
          <Link to="/" className={styles.publicBrand}>
            <img src="/logo.png" alt="" width={260} height={308} />
            Alertion
          </Link>
          <span className={styles.publicName}>{publicSite.businessName}</span>
          <div className={styles.publicTools}>
            <ScenarioPanel />
          </div>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
        <DemoBar />
      </div>
    );
  }

  const collapseLabel = collapsed ? 'Развернуть меню' : 'Свернуть меню';
  const menuLabel = drawerOpen ? 'Закрыть меню' : 'Открыть меню';

  return (
    <div
      className={[
        styles.app,
        collapsed ? styles.rail : '',
        running ? styles.withDemo : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header
        ref={sidebarRef}
        className={
          drawerOpen ? `${styles.sidebar} ${styles.open}` : styles.sidebar
        }
      >
        <div className={styles.brandRow}>
          <Link
            to="/"
            className={styles.brand}
            title={collapsed ? 'Alertion' : undefined}
            onClick={onNavigate}
          >
            <img src="/logo.png" alt="" width={260} height={308} />
            <span className={styles.name}>Alertion</span>
          </Link>
          <button
            className={styles.toggle}
            type="button"
            aria-expanded={!collapsed}
            aria-controls={navId}
            title={collapsed ? collapseLabel : undefined}
            onClick={toggleCollapsed}
          >
            {collapsed ? <IconExpand /> : <IconCollapse />}
            <span className={styles.name}>{collapseLabel}</span>
          </button>
        </div>
        <nav id={navId} aria-label="Разделы">
          <ul className={styles.nav}>
            {state.sessionAccountId === null ? (
              <NavItem
                to="/login"
                label="Вход"
                iconOnly={collapsed}
                onNavigate={onNavigate}
              >
                <IconSignIn />
              </NavItem>
            ) : null}
            {navSlug
              ? sections.map((section) => (
                  <NavItem
                    key={section.label}
                    to={`/manage/${navSlug}${section.suffix}`}
                    label={section.label}
                    iconOnly={collapsed}
                    onNavigate={onNavigate}
                  >
                    <section.Icon />
                  </NavItem>
                ))
              : null}
            <NavItem
              to="/defense"
              label="Защита проекта"
              iconOnly={collapsed}
              onNavigate={onNavigate}
            >
              <IconDefense />
            </NavItem>
          </ul>
        </nav>
      </header>
      {drawerOpen ? (
        <button
          className={styles.backdrop}
          type="button"
          aria-label="Закрыть меню"
          tabIndex={-1}
          onClick={dismissDrawer}
        />
      ) : null}
      <div className={styles.workspace}>
        <div className={styles.topbar} ref={topbarRef}>
          <button
            ref={menuRef}
            className={styles.menu}
            type="button"
            aria-expanded={drawerOpen}
            aria-controls={navId}
            onClick={drawerOpen ? dismissDrawer : openDrawer}
          >
            <IconMenu />
            <span className={styles.srOnly}>{menuLabel}</span>
          </button>
          <ScenarioPanel />
        </div>
        <main className={styles.main} inert={drawerOpen ? true : undefined}>
          <Outlet />
        </main>
        <DemoBar />
      </div>
    </div>
  );
}
