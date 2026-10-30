import { useState, type CSSProperties } from 'react';
import { LIMITS } from '../data/limits.ts';
import type { Risk } from './content.ts';
import { useLocale } from './locale.ts';
import styles from './Visuals.module.css';

type Active = 'A' | 'B';

/** Steps 4 and 5 of the path as a small working model instead of a recording. */
export function PublishModel() {
  const { t } = useLocale();
  const copy = t.publish;
  const [active, setActive] = useState<Active>('A');
  const [asking, setAsking] = useState(false);

  const rows: readonly { id: Active; file: string }[] = [
    { id: 'A', file: 'nan-v3.zip' },
    { id: 'B', file: 'nan-v4.zip' },
  ];

  const chip = (id: Active) => {
    if (id === active) return copy.active;
    return id === 'A' ? copy.previous : copy.candidate;
  };

  return (
    <div className={styles.card}>
      <p className={styles.label}>{copy.label}</p>
      <ul className={styles.versions}>
        {rows.map((row) => (
          <li
            key={row.id}
            className={styles.version}
            data-active={row.id === active}
          >
            <span className={styles.letter}>{row.id}</span>
            <code className={styles.file}>{row.file}</code>
            <span className={styles.chip} data-on={row.id === active}>
              {chip(row.id)}
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.fold} data-open={asking}>
        <div className={styles.foldInner}>
          <div
            className={styles.confirm}
            role="group"
            aria-label={copy.confirmTitle}
            inert={!asking}
          >
            <p className={styles.confirmTitle}>{copy.confirmTitle}</p>
            <p className={styles.confirmText}>{copy.confirmText}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  setActive('B');
                  setAsking(false);
                }}
              >
                {copy.confirm}
              </button>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => setAsking(false)}
              >
                {copy.cancel}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {active === 'A' ? (
          <button
            type="button"
            className={styles.primary}
            disabled={asking}
            onClick={() => setAsking(true)}
          >
            {copy.publishBtn}
          </button>
        ) : (
          <button
            type="button"
            className={styles.ghost}
            onClick={() => setActive('A')}
          >
            {copy.rollbackBtn}
          </button>
        )}
      </div>
      <p key={active} className={styles.status} role="status">
        {active === 'A' ? copy.statusA : copy.statusB}
      </p>
    </div>
  );
}

function Mark({ state }: { state: 'pass' | 'fail' | 'skipped' }) {
  if (state === 'pass') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.markPass}>
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path
          d="m4.8 8.2 2.2 2.2 4.2-4.6"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (state === 'fail') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.markFail}>
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path
          d="m5.6 5.6 4.8 4.8m0-4.8-4.8 4.8"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.markSkipped}>
      <circle
        cx="8"
        cy="8"
        r="6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2.4 2.4"
      />
    </svg>
  );
}

/** The strict order of archive checks, stopping at the first failure. */
export function ChecksModel() {
  const { t } = useLocale();
  const copy = t.checks;
  return (
    <div className={styles.card}>
      <p className={styles.label}>
        <code>{copy.file}</code>
      </p>
      <ol className={styles.checks}>
        {copy.rows.map((row, index) => (
          <li
            key={row.title}
            className={styles.check}
            data-state={row.state}
            style={{ '--i': index } as CSSProperties}
          >
            <Mark state={row.state} />
            <span className={styles.checkTitle}>{row.title}</span>
            <span className={styles.checkNote}>
              {row.state === 'skipped' ? copy.skipped : row.note}
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.result}>{copy.result}</p>
    </div>
  );
}

function Meter({
  label,
  value,
  max,
  unit,
  index,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  index: number;
}) {
  const share = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={styles.meter} style={{ '--i': index } as CSSProperties}>
      <div className={styles.meterHead}>
        <span>{label}</span>
        <span className={styles.meterValue}>
          {value} / {max}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className={styles.track} aria-hidden="true">
        <div
          className={styles.fill}
          style={{ '--share': `${share}%` } as CSSProperties}
        />
      </div>
    </div>
  );
}

/** Usage against the pilot limits, and the four verification states. */
export function UsageModel() {
  const { t } = useLocale();
  const copy = t.usage;
  return (
    <div className={styles.card}>
      <p className={styles.label}>{copy.label}</p>
      <div className={styles.meters}>
        <Meter label={copy.sites} value={1} max={LIMITS.sites} index={0} />
        <Meter
          label={copy.storage}
          value={45}
          max={LIMITS.storageMb}
          unit={copy.unit}
          index={1}
        />
        <Meter
          label={copy.archive}
          value={15}
          max={LIMITS.archiveMb}
          unit={copy.unit}
          index={2}
        />
      </div>
      <ul className={styles.states}>
        {copy.states.map((state, index) => (
          <li
            key={state}
            className={styles.state}
            data-current={index === copy.states.length - 1}
          >
            {state}
            {index === copy.states.length - 1 ? (
              <small>{copy.current}</small>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

const riskShare: Record<Risk, number> = { done: 2, medium: 1, high: 2 };

/** How much of the verifiable-launch checklist is done, named in words as well as colour. */
export function RiskModel() {
  const { t } = useLocale();
  const copy = t.risk;
  const levels: Risk[] = ['done', 'medium', 'high'];
  return (
    <div className={styles.card}>
      <p className={styles.label}>{copy.label}</p>
      <div className={styles.bar} aria-hidden="true">
        {levels.map((level) => (
          <span
            key={level}
            className={styles.segment}
            data-level={level}
            style={{ flexGrow: riskShare[level] }}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {levels.map((level) => (
          <li key={level} data-level={level}>
            {copy.legend[level]}
          </li>
        ))}
      </ul>
      <ul className={styles.riskCards}>
        {copy.cards.map((card, index) => (
          <li
            key={card.title}
            className={styles.riskCard}
            data-level={card.level}
            style={{ '--i': index } as CSSProperties}
          >
            <span className={styles.riskTitle}>{card.title}</span>
            <span className={styles.riskNote}>{card.note}</span>
            <span className={styles.riskBadge}>{copy.legend[card.level]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
