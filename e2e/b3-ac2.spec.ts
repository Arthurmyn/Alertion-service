import { test } from '@playwright/test';
import {
  activeMenu,
  candidateLabel,
  candidateMenu,
  candidateOnly,
  confirmPublish,
  expectDashboardActive,
  expectPublicMenu,
  openScenario,
} from './support/b3-helpers.ts';

test('B3-AC2 confirmation makes B active', async ({ page }) => {
  await openScenario(page, 'preview-b');
  await expectPublicMenu(page, activeMenu, candidateOnly);

  await confirmPublish(page);
  await expectDashboardActive(page, candidateLabel);
  await expectPublicMenu(page, candidateMenu, []);

  await openScenario(page, 'publish-ok');
  await expectDashboardActive(page, candidateLabel);
  await expectPublicMenu(page, candidateMenu, []);
});
