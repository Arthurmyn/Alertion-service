import { test } from '@playwright/test';
import {
  domainScenarios,
  expectDomainState,
  openDashboard,
  openDomainScreen,
  scenarioTourTimeout,
} from './b6-dashboard.ts';

test('B6-AC4 domain state matches the scenario', async ({ page }) => {
  test.setTimeout(scenarioTourTimeout);
  for (const scenario of domainScenarios) {
    await test.step(scenario.id, async () => {
      await openDashboard(page, scenario.id, scenario.slug);
      await expectDomainState(page, scenario.domain);
      await openDomainScreen(page, scenario.slug);
      await expectDomainState(page, scenario.domain);
    });
  }
});
