import { sprintWorkHours, type SprintNumber } from './backlogItems.ts';

export const WORKING_DAYS = 5;

export const sprintStart: Record<SprintNumber, string> = {
  1: '2026-10-28',
  2: '2026-11-04',
  3: '2026-11-11',
};

const simulatedTail: Record<SprintNumber, readonly number[]> = {
  1: [27, 21, 15, 9, 3],
  2: [28, 16, 9, 3, 0],
  3: [28, 19, 13, 7, 1],
};

export const simulatedRemaining: Record<SprintNumber, readonly number[]> = {
  1: [sprintWorkHours(1), ...simulatedTail[1]],
  2: [sprintWorkHours(2), ...simulatedTail[2]],
  3: [sprintWorkHours(3), ...simulatedTail[3]],
};

export function workingDays(startIso: string, count = WORKING_DAYS): string[] {
  const [year, month, day] = startIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const days: string[] = [];
  while (days.length < count) {
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      days.push(`${dd}.${mm}`);
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}

export function planRemaining(
  totalHours: number,
  days = WORKING_DAYS,
): number[] {
  return Array.from(
    { length: days + 1 },
    (_, day) => (totalHours * (days - day)) / days,
  );
}

export function completedHours(remaining: readonly number[]): number {
  const start = remaining[0] ?? 0;
  const end = remaining[remaining.length - 1] ?? 0;
  return start - end;
}

export interface PlotFrame {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function seriesPoints(
  values: readonly number[],
  frame: PlotFrame,
  max: number,
): Array<{ x: number; y: number }> {
  if (values.length === 0) return [];
  const last = Math.max(values.length - 1, 1);
  const span = max === 0 ? 1 : max;
  return values.map((value, index) => ({
    x: frame.x0 + ((frame.x1 - frame.x0) * index) / last,
    y: frame.y1 - ((frame.y1 - frame.y0) * value) / span,
  }));
}

export function pointsAttr(
  points: readonly { x: number; y: number }[],
): string {
  return points.map((point) => `${trim(point.x)},${trim(point.y)}`).join(' ');
}

function trim(value: number): string {
  return String(Math.round(value * 10) / 10);
}
