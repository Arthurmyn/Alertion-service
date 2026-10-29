import { expect, test } from '@playwright/test';
import {
  deferredDashboardPattern,
  openDashboard,
  scenarioById,
} from './b6-dashboard.ts';

test('B6-AC6 deferred domain is labelled unavailable', async ({ page }) => {
  const scenario = scenarioById('domain-deferred');
  await openDashboard(page, scenario.id, scenario.slug);
  await expect(page.getByText(deferredDashboardPattern())).toBeVisible();
});
