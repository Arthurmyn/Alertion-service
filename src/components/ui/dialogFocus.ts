type DialogKeyEvent = {
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
};

type FocusTarget = {
  focus: (options?: { focusVisible?: boolean }) => void;
};

function nextIndex(count: number, current: number, shift: boolean): number {
  if (current < 0 || current >= count) return shift ? count - 1 : 0;
  if (shift) return current === 0 ? count - 1 : current - 1;
  return current === count - 1 ? 0 : current + 1;
}

export function handleDialogKey(
  event: DialogKeyEvent,
  items: readonly FocusTarget[],
  activeIndex: number,
  onClose: () => void,
): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    onClose();
    return;
  }
  if (event.key !== 'Tab') return;

  event.preventDefault();
  if (items.length === 0) return;
  items[nextIndex(items.length, activeIndex, event.shiftKey)]?.focus({
    focusVisible: true,
  });
}
