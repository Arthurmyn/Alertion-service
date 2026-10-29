import { test } from '@playwright/test';
import {
  followExampleLink,
  openDashboard,
  ownerScenarios,
  scenarioTourTimeout,
} from './b6-dashboard.ts';

test('B6-AC2 example URL matches the scenario', async ({ page }) => {
  test.setTimeout(scenarioTourTimeout);
  for (const scenario of ownerScenarios) {
    await test.step(scenario.id, async () => {
      await openDashboard(page, scenario.id, scenario.slug);
      await followExampleLink(page, scenario.slug);
    });
  }
});
