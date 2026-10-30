import { useCallback, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { initials, sessionSites } from '../../data/workspace.ts';
import { useCreateProject } from '../../pages/overview/useCreateProject.ts';
import { useStore } from '../../state/store.tsx';
import { IconChevronsUpDown, IconPlus } from '../ui/icons.tsx';
import { inProject } from './navConfig.ts';
import { Popover } from '../ui/Popover.tsx';
import popover from '../ui/Popover.module.css';
import styles from './ProjectSwitcher.module.css';

/** "Все проекты" in the top bar: jump to any project, or try to create one. */
export function ProjectSwitcher() {
  const { state } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { create } = useCreateProject();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const anchor = useRef<HTMLButtonElement>(null);
  const sites = sessionSites(state);
  const slug = inProject(pathname)
    ? /^\/manage\/([^/]+)/.exec(pathname)?.[1]
    : undefined;
  const current = slug ? state.sites[slug] : undefined;
  const needle = query.trim().toLowerCase();
  const shown = sites.filter((site) =>
    site.businessName.toLowerCase().includes(needle),
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span>{current ? current.businessName : 'Все проекты'}</span>
        <span className={styles.chevron}>
          <IconChevronsUpDown />
        </span>
      </button>
      <Popover
        anchor={anchor}
        open={open}
        onClose={close}
        label="Проекты"
        width={320}
      >
        <div className={popover.search}>
          <input
            type="text"
            role="searchbox"
            aria-label="Найти проект"
            placeholder="Найти проект…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <ul className={popover.list}>
          {shown.map((site) => (
            <li key={site.slug}>
              <Link
                to={`/manage/${site.slug}`}
                className={popover.item}
                aria-current={slug === site.slug ? 'true' : undefined}
                onClick={close}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {initials(site.businessName)}
                </span>
                <span className={popover.itemText}>{site.businessName}</span>
              </Link>
            </li>
          ))}
          {shown.length === 0 ? (
            <li className={popover.empty}>Проектов не найдено.</li>
          ) : null}
        </ul>
        <div className={popover.footer}>
          <button
            type="button"
            className={popover.item}
            onClick={() => {
              close();
              create();
              navigate('/manage');
            }}
          >
            <IconPlus />
            <span className={popover.itemText}>Создать проект</span>
          </button>
        </div>
      </Popover>
    </>
  );
}
