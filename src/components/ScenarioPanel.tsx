import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { baseline } from '../data/accounts.ts';
import {
  demoRunning,
  scenarioById,
  scenarios,
  scenarioState,
} from '../data/scenarios.ts';
import { useStore } from '../state/store.tsx';
import styles from './ScenarioPanel.module.css';

const lockedReason = 'Смена сценария недоступна, пока идёт демо.';

export function ScenarioPanel() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const selectId = useId();
  const reasonId = useId();
  const locked = demoRunning(state.demo);

  function reset() {
    if (locked) return;
    dispatch({ type: 'load', state: baseline });
  }

  function choose(id: string) {
    if (locked) return;
    if (id === '') {
      reset();
      return;
    }
    const scenario = scenarioById(id);
    if (!scenario) return;
    dispatch({ type: 'load', state: scenarioState(scenario) });
    navigate(scenario.route);
  }

  return (
    <div className={styles.panel}>
      <label className={styles.label} htmlFor={selectId}>
        Сценарий
      </label>
      <select
        id={selectId}
        className={styles.select}
        value={state.scenarioId ?? ''}
        disabled={locked}
        aria-describedby={locked ? reasonId : undefined}
        onChange={(event) => choose(event.target.value)}
      >
        <option value="" disabled>
          Не выбран
        </option>
        {scenarios.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <button
        className={styles.reset}
        type="button"
        disabled={locked}
        aria-describedby={locked ? reasonId : undefined}
        onClick={reset}
      >
        Сбросить
      </button>
      {locked ? (
        <p className={styles.reason} id={reasonId}>
          {lockedReason}
        </p>
      ) : null}
    </div>
  );
}
