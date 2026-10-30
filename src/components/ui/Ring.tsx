import styles from './Ring.module.css';

/** Share of a limit as a small ring. The number beside it carries the exact value. */
export function Ring({ used, limit }: { used: number; limit: number }) {
  const share = limit > 0 ? Math.min(1, Math.max(0, used / limit)) : 0;
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      className={styles.ring}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.track} cx="8" cy="8" r={radius} />
      <circle
        className={share >= 0.9 ? styles.high : styles.fill}
        cx="8"
        cy="8"
        r={radius}
        strokeDasharray={`${share * circumference} ${circumference}`}
        transform="rotate(-90 8 8)"
      />
    </svg>
  );
}
