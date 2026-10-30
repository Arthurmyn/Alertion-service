import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { accounts } from '../../data/accounts.ts';
import { initials, sessionSites } from '../../data/workspace.ts';
import { useStore } from '../../state/store.tsx';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCollapse,
  IconDefense,
  IconExpand,
  IconMore,
  IconSearch,
  IconSignIn,
} from '../ui/icons.tsx';
import { activeTop, allLeaves, navTop, type NavLeaf } from './navConfig.ts';
import { Popover } from '../ui/Popover.tsx';
import popover from '../ui/Popover.module.css';
import { WorkspaceSwitcher } from './WorkspaceSwitcher.tsx';
import styles from './Sidebar.module.css';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

function Item({
  leaf,
  current,
  hasChildren,
  iconOnly,
  onNavigate,
}: {
  leaf: NavLeaf;
  current: boolean;
  hasChildren?: boolean;
  iconOnly: boolean;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        to={leaf.to}
        className={current ? `${styles.link} ${styles.current}` : styles.link}
        aria-current={current ? 'page' : undefined}
        title={iconOnly ? leaf.label : undefined}
        aria-label={iconOnly ? leaf.label : undefined}
        onClick={onNavigate}
      >
        <leaf.Icon />
        <span className={styles.name}>{leaf.label}</span>
        {hasChildren ? (
          <span className={styles.more}>
            <IconChevronRight />
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function Find({
  onNavigate,
  onResults,
}: {
  onNavigate: () => void;
  onResults: (node: React.ReactNode | null) => void;
}) {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'f') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      inputRef.current?.focus({ focusVisible: true });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const needle = query.trim().toLowerCase();
  useEffect(() => {
    if (needle === '') {
      onResults(null);
      return;
    }
    const pages = allLeaves().filter((leaf) =>
      leaf.label.toLowerCase().includes(needle),
    );
    const projects = sessionSites(state).filter((site) =>
      site.businessName.toLowerCase().includes(needle),
    );
    const done = () => {
      setQuery('');
      onNavigate();
    };
    onResults(
      pages.length + projects.length === 0 ? (
        <p className={styles.noResults}>Ничего не найдено.</p>
      ) : (
        <ul className={styles.nav} aria-label="Результаты поиска">
          {projects.map((site) => (
            <li key={site.slug}>
              <Link
                to={`/manage/${site.slug}`}
                className={styles.link}
                onClick={done}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {initials(site.businessName)}
                </span>
                <span className={styles.name}>{site.businessName}</span>
              </Link>
            </li>
          ))}
          {pages.map((leaf) => (
            <li key={leaf.to}>
              <Link to={leaf.to} className={styles.link} onClick={done}>
                <leaf.Icon />
                <span className={styles.name}>{leaf.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      ),
    );
    // The results depend on session data and the query only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, state.sites, state.sessionAccountId]);

  return (
    <div className={styles.find}>
      <label htmlFor={id} className={styles.findIcon}>
        <IconSearch />
        <span className="visually-hidden">Найти страницу или проект</span>
      </label>
      <input
        ref={inputRef}
        id={id}
        type="search"
        placeholder="Найти"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <kbd className={styles.key} aria-hidden="true">
        F
      </kbd>
    </div>
  );
}

function ProfileRow({ iconOnly }: { iconOnly: boolean }) {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const account = accounts.find((item) => item.id === state.sessionAccountId);
  if (!account) return null;
  return (
    <div className={styles.profile}>
      <span className={styles.avatar} aria-hidden="true">
        {initials(account.ownerName)}
      </span>
      <span className={styles.profileName}>{account.ownerName}</span>
      <button
        ref={anchor}
        type="button"
        className={styles.iconButton}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Меню профиля: ${account.ownerName}`}
        title={iconOnly ? account.ownerName : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <IconMore />
      </button>
      <Popover
        anchor={anchor}
        open={open}
        onClose={() => setOpen(false)}
        label="Профиль"
        width={200}
      >
        <div className={popover.list}>
          <button
            type="button"
            className={popover.item}
            onClick={() => {
              setOpen(false);
              dispatch({ type: 'signOut' });
              navigate('/login');
            }}
          >
            Выйти
          </button>
        </div>
      </Popover>
    </div>
  );
}

export function Sidebar({
  collapsed,
  drawerOpen,
  headerRef,
  navId,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  drawerOpen: boolean;
  headerRef: RefObject<HTMLElement | null>;
  navId: string;
  onToggleCollapsed: () => void;
  onNavigate: () => void;
}) {
  const { pathname } = useLocation();
  const { state } = useStore();
  const [results, setResults] = useState<React.ReactNode | null>(null);
  const signedIn = state.sessionAccountId !== null;
  const top = signedIn ? activeTop(pathname) : undefined;
  const drilled = top?.sections ? top : undefined;
  const collapseLabel = collapsed ? 'Развернуть меню' : 'Свернуть меню';

  let body: React.ReactNode;
  if (!signedIn) {
    body = (
      <ul className={styles.nav}>
        <li>
          <Link
            to="/login"
            className={
              pathname === '/login'
                ? `${styles.link} ${styles.current}`
                : styles.link
            }
            aria-current={pathname === '/login' ? 'page' : undefined}
            title={collapsed ? 'Вход' : undefined}
            aria-label={collapsed ? 'Вход' : undefined}
            onClick={onNavigate}
          >
            <IconSignIn />
            <span className={styles.name}>Вход</span>
          </Link>
        </li>
        <Item
          leaf={{ to: '/defense', label: 'Защита проекта', Icon: IconDefense }}
          current={pathname === '/defense'}
          iconOnly={collapsed}
          onNavigate={onNavigate}
        />
      </ul>
    );
  } else if (results !== null) {
    body = results;
  } else if (drilled?.sections) {
    body = (
      <>
        <Link
          to="/manage"
          className={styles.back}
          aria-label={`Назад: ${drilled.label}`}
          title={collapsed ? 'Назад' : undefined}
          onClick={onNavigate}
        >
          <IconChevronLeft />
          <span className={styles.name}>{drilled.label}</span>
        </Link>
        {drilled.sections.map((section, index) => (
          <div className={styles.group} key={section.heading ?? index}>
            {section.heading ? (
              <p className={styles.heading}>{section.heading}</p>
            ) : null}
            <ul className={styles.nav}>
              {section.items.map((leaf) => (
                <Item
                  key={leaf.to}
                  leaf={leaf}
                  current={pathname === leaf.to}
                  iconOnly={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </>
    );
  } else {
    body = (
      <ul className={styles.nav}>
        {navTop.map((entry) => (
          <Item
            key={entry.id}
            leaf={{ to: entry.to, label: entry.label, Icon: entry.Icon }}
            current={top?.id === entry.id}
            hasChildren={Boolean(entry.sections)}
            iconOnly={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    );
  }

  return (
    <header
      ref={headerRef}
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
          onClick={onToggleCollapsed}
        >
          {collapsed ? <IconExpand /> : <IconCollapse />}
          <span className={styles.srOnly}>{collapseLabel}</span>
        </button>
      </div>
      <div className={styles.switcher}>
        <WorkspaceSwitcher iconOnly={collapsed} onNavigate={onNavigate} />
      </div>
      {signedIn ? (
        <Find onNavigate={onNavigate} onResults={setResults} />
      ) : null}
      <nav id={navId} aria-label="Разделы" className={styles.groups}>
        {body}
      </nav>
      <ProfileRow iconOnly={collapsed} />
    </header>
  );
}
