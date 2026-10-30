import { useCallback, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { accounts } from '../../data/accounts.ts';
import {
  demoRunning,
  scenarioById,
  scenarioState,
} from '../../data/scenarios.ts';
import { initials, sessionSites } from '../../data/workspace.ts';
import { useCreateProject } from '../../pages/overview/useCreateProject.ts';
import { useStore } from '../../state/store.tsx';
import { IconCheck, IconChevronsUpDown, IconPlus } from '../ui/icons.tsx';
import { inProject } from './navConfig.ts';
import { Popover } from '../ui/Popover.tsx';
import popover from '../ui/Popover.module.css';
import styles from './ProjectSwitcher.module.css';
import { lockedReason } from './WorkspaceSwitcher.tsx';

/**
 * The top bar's switcher: choose a workspace (one of the two fixture
 * accounts), jump to a project, or try to create one.
 */
export function ProjectSwitcher() {
  const { state, dispatch } = useStore();
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
  const workspaces = accounts.filter(
    (account) =>
      account.businessName.toLowerCase().includes(needle) ||
      account.ownerName.toLowerCase().includes(needle),
  );
  const locked = demoRunning(state.demo);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  function chooseWorkspace(accountId: string) {
    if (locked) return;
    if (accountId === state.sessionAccountId) {
      close();
      return;
    }
    const scenario = scenarioById(`${accountId}-home`);
    if (!scenario) return;
    dispatch({ type: 'load', state: scenarioState(scenario) });
    close();
    navigate(scenario.route);
  }

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
        label="Рабочие пространства и проекты"
        width={320}
      >
        <div className={popover.search}>
          <input
            type="text"
            role="searchbox"
            aria-label="Найти пространство или проект"
            placeholder="Найти пространство или проект…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={popover.list}>
          {workspaces.length > 0 ? (
            <>
              <p className={popover.heading}>Рабочие пространства</p>
              <ul className={styles.options}>
                {workspaces.map((account) => {
                  const current = account.id === state.sessionAccountId;
                  return (
                    <li key={account.id}>
                      <button
                        type="button"
                        className={popover.item}
                        aria-current={current ? 'true' : undefined}
                        disabled={locked && !current}
                        title={locked && !current ? lockedReason : undefined}
                        onClick={() => chooseWorkspace(account.id)}
                      >
                        <span className={styles.avatar} aria-hidden="true">
                          {initials(account.businessName)}
                        </span>
                        <span className={popover.itemText}>
                          {account.businessName}
                          <span className={popover.itemMeta}>
                            {account.ownerName}
                          </span>
                        </span>
                        {current ? (
                          <span className={popover.check}>
                            <IconCheck />
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          <p className={popover.heading}>Проекты</p>
          <ul className={styles.options}>
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
        </div>
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
