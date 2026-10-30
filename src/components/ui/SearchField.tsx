import { useEffect, useId, useRef } from 'react';
import { IconSearch } from './icons.tsx';
import styles from './SearchField.module.css';

/** A search box. "/" focuses it from anywhere that is not a text field. */
export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      ref.current?.focus({ focusVisible: true });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.icon}>
        <IconSearch />
        <span className="visually-hidden">{label}</span>
      </label>
      <input
        ref={ref}
        id={id}
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <kbd className={styles.key} aria-hidden="true">
        /
      </kbd>
    </div>
  );
}
