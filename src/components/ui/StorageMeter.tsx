import { storageCaption } from './storageText.ts';
import styles from './StorageMeter.module.css';

/** 0–100, so the bar length is the share of the limit. */
function storagePercent(usedMb: number, limitMb: number): number {
  if (!(limitMb > 0) || !Number.isFinite(usedMb) || usedMb <= 0) return 0;
  return Math.min(100, Math.round((usedMb / limitMb) * 100));
}

export function StorageMeter({
  usedMb,
  limitMb,
}: {
  usedMb: number;
  limitMb: number;
}) {
  const caption = storageCaption(usedMb, limitMb);
  const percent = storagePercent(usedMb, limitMb);
  const max = limitMb > 0 ? limitMb : 0;
  const now = Math.min(Math.max(usedMb, 0), max);

  return (
    <div className={styles.meter}>
      <div
        className={styles.bar}
        role="meter"
        aria-label="Хранилище"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={now}
        aria-valuetext={caption}
      >
        <svg
          className={styles.track}
          viewBox="0 0 100 10"
          width="100%"
          height="10"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <rect
            className={styles.trackBg}
            x="0"
            y="0"
            width="100"
            height="10"
          />
          <rect
            className={percent >= 90 ? styles.fillHigh : styles.fill}
            x="0"
            y="0"
            width={percent}
            height="10"
          />
        </svg>
      </div>
      <p className={styles.caption}>{caption}</p>
    </div>
  );
}
