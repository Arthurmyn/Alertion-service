import { test } from '@playwright/test';
import {
  deploymentScenarios,
  expectDeployment,
  openDashboard,
  scenarioTourTimeout,
} from './support/b6-dashboard.ts';

test('B6-AC3 deployment state matches the scenario', async ({ page }) => {
  test.setTimeout(scenarioTourTimeout);
  for (const scenario of deploymentScenarios) {
    await test.step(scenario.id, async () => {
      await openDashboard(page, scenario.id, scenario.slug);
      await expectDeployment(page, scenario.deployment);
    });
  }
});
