import { useEffect, useId, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { demoRunning } from '../../data/scenarios.ts';
import { homePath } from '../../app/routing.ts';
import { consumeScenarioQuery, useStore } from '../../state/store.tsx';
import { IconMenu, IconPlus } from '../ui/icons.tsx';
import { titleFor } from './navConfig.ts';
import {
  browserStorage,
  readNavCollapsed,
  writeNavCollapsed,
} from './navState.ts';
import { useCreateProject } from '../../pages/overview/useCreateProject.ts';
import styles from './AppShell.module.css';
import { DemoBar } from '../demo/DemoBar.tsx';
import { ProjectSwitcher } from './ProjectSwitcher.tsx';
import { Sidebar } from './Sidebar.tsx';
import { WorkspaceSwitcher } from './WorkspaceSwitcher.tsx';

function readSlug(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function publicSlug(pathname: string): string | null {
  return readSlug(/^\/site\/([^/]+)$/.exec(pathname)?.[1]);
}

function focusMain(): void {
  const heading = document.querySelector('main h1');
  if (!(heading instanceof HTMLElement)) return;
  heading.tabIndex = -1;
  heading.focus({ focusVisible: true });
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
  const { create } = useCreateProject();
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

  const siteSlug = publicSlug(pathname);
  const publicSite = siteSlug ? state.sites[siteSlug] : undefined;
  const isPublic = Boolean(publicSite);
  const running = demoRunning(state.demo);
  const narrowPage = pathname === '/defense' || pathname === '/login';

  useEffect(() => {
    const fallbackPath =
      pathname === '/' ? homePath(state.sessionAccountId) : pathname;
    consumeScenarioQuery(search, fallbackPath, navigate);
  }, [pathname, search, navigate, state.sessionAccountId]);

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
            <WorkspaceSwitcher />
          </div>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
        <DemoBar />
      </div>
    );
  }

  const menuLabel = drawerOpen ? 'Закрыть меню' : 'Открыть меню';
  const title = titleFor(pathname);

  return (
    <div
      className={[
        styles.app,
        collapsed ? `${styles.rail} rail` : '',
        running ? styles.withDemo : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Sidebar
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        headerRef={sidebarRef}
        navId={navId}
        onToggleCollapsed={toggleCollapsed}
        onNavigate={onNavigate}
      />
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
          <div className={styles.topLeft}>
            {state.sessionAccountId !== null ? <ProjectSwitcher /> : null}
          </div>
          <p className={styles.topTitle}>{title}</p>
          <div className={styles.topRight}>
            {state.sessionAccountId !== null ? (
              <button
                type="button"
                className={styles.create}
                onClick={() => {
                  create();
                  navigate('/manage');
                }}
              >
                <IconPlus />
                <span>Создать проект</span>
              </button>
            ) : null}
          </div>
        </div>
        <main
          className={
            narrowPage ? `${styles.main} ${styles.narrow}` : styles.main
          }
          inert={drawerOpen ? true : undefined}
        >
          <Outlet />
        </main>
        <DemoBar />
      </div>
    </div>
  );
}
