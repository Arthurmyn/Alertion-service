import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sprintWorkHours } from '../../data/backlogItems.ts';
import {
  planRemaining,
  simulatedRemaining,
  sprintStart,
  workingDays,
} from '../../data/metrics.ts';
import { BurndownChart } from './BurndownChart.tsx';

describe('BurndownChart', () => {
  it('draws a plan line and a simulated line', () => {
    const html = renderToStaticMarkup(
      createElement(BurndownChart, {
        sprint: 1,
        dates: workingDays(sprintStart[1]),
        plan: planRemaining(sprintWorkHours(1)),
        simulated: simulatedRemaining[1],
      }),
    );
    expect(html.match(/<polyline /g)).toHaveLength(2);
    expect(html).toContain('>план<');
    expect(html).toContain('>симуляция<');
    expect(html).toContain('28.10');
    expect(html).toContain('старт');
    expect(html).toContain(
      'aria-label="Спринт 1: линия плана и линия симуляции"',
    );
    expect(html).toContain('aria-describedby="burndown-s1"');
    expect(html).toContain('id="burndown-s1"');
    expect(html).toContain('>30 ч<');
  });
});
