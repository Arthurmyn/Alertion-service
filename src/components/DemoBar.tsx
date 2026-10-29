import { useEffect, useId, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  demoCaption,
  demoRoute,
  demoState,
  demoStepCount,
  scenarioHref,
} from '../data/demoSteps.ts';
import { scenarioById } from '../data/scenarios.ts';
import { useStore } from '../state/store.tsx';
import styles from './DemoBar.module.css';

export function DemoScenarioList({
  ids,
  className,
}: {
  ids: readonly string[];
  className: string;
}) {
  return (
    <ul className={className}>
      {ids.map((id) => {
        const scenario = scenarioById(id);
        const href = scenarioHref(id);
        if (!scenario || !href) return null;
        return (
          <li key={id}>
            {scenario.title}{' '}
            <a href={href} aria-label={`Открыть: ${scenario.title}`}>
              Открыть
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function DemoBar() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const step = state.demo?.step ?? null;
  const stepRef = useRef<HTMLParagraphElement>(null);
  const backReasonId = useId();
  const nextReasonId = useId();

  useEffect(() => {
    if (step === null) return;
    if (step === demoStepCount && pathname === '/defense') {
      document.getElementById('demo')?.scrollIntoView();
    }
    stepRef.current?.focus({ preventScroll: true });
  }, [step, pathname]);

  if (step === null) return null;

  const backLocked = step <= 1;
  const nextLocked = step >= demoStepCount;

  function go(next: number) {
    dispatch({ type: 'load', state: demoState(next) });
    navigate(demoRoute(next));
  }

  function exit() {
    dispatch({ type: 'setDemo', demo: null });
  }

  return (
    <div className={styles.bar} role="region" aria-label="Демо">
      <p className={styles.step} tabIndex={-1} ref={stepRef}>
        {`Шаг ${step} из ${demoStepCount}`}
      </p>
      <p className={styles.caption} aria-live="polite">
        {demoCaption(state)}
      </p>
      <div className={styles.actions}>
        <button
          className={styles.quiet}
          type="button"
          disabled={backLocked}
          aria-describedby={backLocked ? backReasonId : undefined}
          onClick={() => go(step - 1)}
        >
          Назад
        </button>
        <button
          type="button"
          disabled={nextLocked}
          aria-describedby={nextLocked ? nextReasonId : undefined}
          onClick={() => go(step + 1)}
        >
          Далее
        </button>
        <button className={styles.quiet} type="button" onClick={exit}>
          Выйти
        </button>
      </div>
      {backLocked ? (
        <p className={styles.reason} id={backReasonId}>
          Это первый шаг.
        </p>
      ) : null}
      {nextLocked ? (
        <p className={styles.reason} id={nextReasonId}>
          Это последний шаг.
        </p>
      ) : null}
    </div>
  );
}
