import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { accounts, baseline } from '../../data/accounts.ts';
import {
  demoRunning,
  scenarioById,
  scenarios,
  scenarioState,
} from '../../data/scenarios.ts';
import { initials } from '../../data/workspace.ts';
import { useStore } from '../../state/store.tsx';
import { IconCheck, IconChevronsUpDown } from '../ui/icons.tsx';
import { Popover } from '../ui/Popover.tsx';
import popover from '../ui/Popover.module.css';
import styles from './WorkspaceSwitcher.module.css';

export const lockedReason = 'Смена сценария недоступна, пока идёт демо.';

/** The two fixture accounts are the workspaces; every other preset is a scenario. */
const workspaceScenarios = ['a-home', 'b-home'] as const;

function ownerOf(scenarioId: string): string | null {
  const id =
    scenarioId === 'a-home' ? 'a' : scenarioId === 'b-home' ? 'b' : null;
  return accounts.find((item) => item.id === id)?.ownerName ?? null;
}

export function WorkspaceList({
  query,
  onQuery,
  currentId,
  onChoose,
  onReset,
}: {
  query: string;
  onQuery: (value: string) => void;
  currentId: string | null;
  onChoose: (id: string) => void;
  onReset: () => void;
}) {
  const needle = query.trim().toLowerCase();
  const match = (title: string) => title.toLowerCase().includes(needle);
  const workspaces = scenarios.filter(
    (item) =>
      (workspaceScenarios as readonly string[]).includes(item.id) &&
      match(item.title),
  );
  const others = scenarios.filter(
    (item) =>
      !(workspaceScenarios as readonly string[]).includes(item.id) &&
      match(item.title),
  );

  function move(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        `input, button:not(:disabled)`,
      ),
    ];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'ArrowDown' ? at + 1 : at - 1;
    const target = items[(next + items.length) % items.length];
    if (!target) return;
    event.preventDefault();
    target.focus({ focusVisible: true });
  }

  function option(id: string, title: string, meta?: string | null) {
    const current = currentId === id;
    return (
      <li key={id}>
        <button
          type="button"
          className={popover.item}
          aria-current={current ? 'true' : undefined}
          onClick={() => onChoose(id)}
        >
          <span className={popover.itemText}>
            {title}
            {meta ? <span className={popover.itemMeta}>{meta}</span> : null}
          </span>
          {current ? (
            <span className={popover.check}>
              <IconCheck />
            </span>
          ) : null}
        </button>
      </li>
    );
  }

  return (
    <div onKeyDown={move} className={styles.list}>
      <div className={popover.search}>
        <input
          type="text"
          role="searchbox"
          aria-label="Найти пространство или сценарий"
          placeholder="Найти пространство или сценарий…"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </div>
      <div className={popover.list}>
        {workspaces.length > 0 ? (
          <>
            <p className={popover.heading}>Рабочие пространства</p>
            <ul className={styles.options}>
              {workspaces.map((item) =>
                option(item.id, item.title, ownerOf(item.id)),
              )}
            </ul>
          </>
        ) : null}
        {others.length > 0 ? (
          <>
            <p className={popover.heading}>Сценарии</p>
            <ul className={styles.options}>
              {others.map((item) => option(item.id, item.title))}
            </ul>
          </>
        ) : null}
        {workspaces.length + others.length === 0 ? (
          <p className={popover.empty}>Ничего не найдено.</p>
        ) : null}
      </div>
      <div className={popover.footer}>
        <button type="button" className={popover.item} onClick={onReset}>
          Сбросить
        </button>
      </div>
    </div>
  );
}

export function WorkspaceSwitcher({
  iconOnly = false,
  onNavigate,
}: {
  iconOnly?: boolean;
  onNavigate?: () => void;
}) {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reasonId = useId();
  const locked = demoRunning(state.demo);
  const account = accounts.find((item) => item.id === state.sessionAccountId);
  const name = account ? account.businessName : 'Выберите пространство';
  const plan = account
    ? state.planSelected[account.id]
      ? 'Пилотный'
      : 'Без плана'
    : null;

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  function choose(id: string) {
    if (locked) return;
    const scenario = scenarioById(id);
    if (!scenario) return;
    dispatch({ type: 'load', state: scenarioState(scenario) });
    close();
    navigate(scenario.route);
    onNavigate?.();
    triggerRef.current?.focus({ focusVisible: true });
  }

  function reset() {
    if (locked) return;
    dispatch({ type: 'load', state: baseline });
    close();
    triggerRef.current?.focus({ focusVisible: true });
  }

  return (
    <div className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Рабочее пространство: ${name}`}
        title={iconOnly ? name : undefined}
        disabled={locked}
        aria-describedby={locked ? reasonId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className={styles.avatar} aria-hidden="true">
          {account ? initials(account.businessName) : '?'}
        </span>
        <span className={styles.name}>{name}</span>
        {plan ? <span className={styles.plan}>{plan}</span> : null}
        <span className={styles.chevron}>
          <IconChevronsUpDown />
        </span>
      </button>
      {locked ? (
        <p id={reasonId} className={styles.reason}>
          {lockedReason}
        </p>
      ) : null}
      <Popover
        anchor={triggerRef}
        open={open && !locked}
        onClose={close}
        label="Рабочие пространства и сценарии"
        width={296}
      >
        <WorkspaceList
          query={query}
          onQuery={setQuery}
          currentId={state.scenarioId}
          onChoose={choose}
          onReset={reset}
        />
      </Popover>
    </div>
  );
}
