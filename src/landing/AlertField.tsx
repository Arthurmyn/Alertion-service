import { useEffect, useRef } from 'react';
import type { FieldVariant } from './alertScene.ts';
import styles from './AlertField.module.css';

/**
 * Red 3D alert signs that drift behind the content. The scene is its own chunk
 * and starts only once the canvas is near the viewport.
 */
export function AlertField({ variant }: { variant: FieldVariant }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let stop: (() => void) | undefined;
    let cancelled = false;

    const start = () => {
      void import('./alertScene.ts')
        .then(({ mountAlertScene }) => {
          if (!cancelled) stop = mountAlertScene(canvas, variant);
        })
        .catch(() => undefined);
    };

    if (typeof IntersectionObserver === 'undefined') {
      start();
      return () => {
        cancelled = true;
        stop?.();
      };
    }
    const waiting = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        waiting.disconnect();
        start();
      },
      { rootMargin: '240px' },
    );
    waiting.observe(canvas);
    return () => {
      cancelled = true;
      waiting.disconnect();
      stop?.();
    };
  }, [variant]);

  return (
    <canvas
      ref={ref}
      className={styles.field}
      data-variant={variant}
      aria-hidden="true"
    />
  );
}
