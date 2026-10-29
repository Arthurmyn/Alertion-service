import { test } from '@playwright/test';
import {
  expectActiveVersion,
  openDashboard,
  ownerScenarios,
  scenarioTourTimeout,
} from './b6-dashboard.ts';

test('B6-AC1 active version matches the scenario', async ({ page }) => {
  test.setTimeout(scenarioTourTimeout);
  for (const scenario of ownerScenarios) {
    await test.step(scenario.id, async () => {
      await openDashboard(page, scenario.id, scenario.slug);
      await expectActiveVersion(page, scenario.activeLabel);
    });
  }
});
