import { useId } from 'react';
import styles from './Field.module.css';

export function Field({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.req} title="обязательно">
            {' *'}
          </span>
        ) : null}
      </label>
      <input
        className={styles.input}
        id={id}
        name={name}
        type="text"
        value={value}
        required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
