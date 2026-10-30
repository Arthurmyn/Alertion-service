import { expect, test } from '@playwright/test';
import {
  expectActiveVersion,
  expectDeployment,
  expectExampleLink,
  expectStaleNotice,
  expectStorage,
  openDashboard,
  scenarioById,
} from './support/b6-dashboard.ts';

test('B6 stale storage data can be refreshed', async ({ page }) => {
  const scenario = scenarioById('storage-stale');
  await openDashboard(page, scenario.id, scenario.slug);
  await expectActiveVersion(page, scenario.activeLabel);
  await expectExampleLink(page, scenario.slug);
  await expectDeployment(page, scenario.deployment);
  await expectStorage(page, scenario.usedMb);
  await expectStaleNotice(page);

  await page.getByRole('button', { name: 'Обновить', exact: true }).click();

  await expect(page.getByText(/Данные устарели/)).toBeHidden();
  await expectActiveVersion(page, scenario.activeLabel);
  await expectStorage(page, scenario.usedMb);
});
