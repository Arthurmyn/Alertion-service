import { test } from '@playwright/test';
import {
  activeMenu,
  candidateOnly,
  expectFailedPublication,
  expectPublicMenu,
  openScenario,
} from './support/b3-helpers.ts';

test('B3-AC3 a failed publication keeps A active', async ({ page }) => {
  await openScenario(page, 'publish-fail');
  await expectFailedPublication(page);
  await expectPublicMenu(page, activeMenu, candidateOnly);
});
