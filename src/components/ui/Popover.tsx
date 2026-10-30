import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Popover.module.css';

/**
 * A floating panel anchored to a trigger. It is portalled to the body so the
 * sidebar's own clipping never cuts it, closes on Escape or an outside press,
 * and hands focus back to the trigger.
 */
export function Popover({
  anchor,
  open,
  onClose,
  label,
  align = 'start',
  width = 288,
  children,
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  label: string;
  align?: 'start' | 'end';
  width?: number;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const node = anchor.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const room = window.innerWidth - width - 8;
      const left = Math.max(
        8,
        Math.min(align === 'end' ? rect.right - width : rect.left, room),
      );
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      if (below >= 240 || below >= above) {
        setPlace({ left, top: rect.bottom + 6, maxHeight: below - 6 });
      } else {
        setPlace({
          left,
          bottom: window.innerHeight - rect.top + 6,
          maxHeight: above - 6,
        });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, anchor, align, width]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      'input, button:not(:disabled), a[href]',
    );
    first?.focus({ focusVisible: true });

    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchor.current?.contains(target)) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
      anchor.current?.focus({ focusVisible: true });
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, anchor, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      ref={panelRef}
      role="group"
      aria-label={label}
      className={styles.panel}
      style={{
        width,
        left: place?.left ?? 0,
        top: place?.top,
        bottom: place?.bottom,
        maxHeight: place?.maxHeight,
        visibility: place ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
