import { describe, expect, it } from 'vitest';
import { sprintWorkHours } from './backlogItems.ts';
import {
  completedHours,
  planRemaining,
  pointsAttr,
  seriesPoints,
  simulatedRemaining,
  sprintStart,
  WORKING_DAYS,
  workingDays,
} from './metrics.ts';

describe('sprint calendar', () => {
  it('uses five working days and skips the weekend', () => {
    expect(workingDays(sprintStart[1])).toEqual([
      '28.10',
      '29.10',
      '30.10',
      '02.11',
      '03.11',
    ]);
    expect(workingDays(sprintStart[2])).toEqual([
      '04.11',
      '05.11',
      '06.11',
      '09.11',
      '10.11',
    ]);
    expect(workingDays(sprintStart[3])).toEqual([
      '11.11',
      '12.11',
      '13.11',
      '16.11',
      '17.11',
    ]);
  });
});

describe('burndown series', () => {
  it('burns the sprint plan from full to zero', () => {
    expect(planRemaining(sprintWorkHours(1))).toEqual([30, 24, 18, 12, 6, 0]);
    expect(completedHours(planRemaining(sprintWorkHours(2)))).toBe(
      sprintWorkHours(2),
    );
  });

  it('starts the simulation at the plan and keeps one point per day', () => {
    for (const sprint of [1, 2, 3] as const) {
      const series = simulatedRemaining[sprint];
      expect(series[0]).toBe(sprintWorkHours(sprint));
      expect(series).toHaveLength(WORKING_DAYS + 1);
      expect(completedHours(series)).toBe(
        series[0] - series[series.length - 1],
      );
    }
    expect(completedHours(simulatedRemaining[1])).toBe(27);
    expect(completedHours(simulatedRemaining[2])).toBe(30);
    expect(completedHours(simulatedRemaining[3])).toBe(29);
  });

  it('maps the plan line from the top-left to the bottom-right', () => {
    const frame = { x0: 0, y0: 0, x1: 100, y1: 50 };
    const points = seriesPoints([30, 0], frame, 30);
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ]);
    expect(pointsAttr(points)).toBe('0,0 100,50');
  });
});
