import { expect, test } from '@playwright/test';
import {
  dashboardStorageLine,
  expectPlanLimits,
  expectUploadLimits,
  main,
  openSection,
  signIn,
} from './support/b7-support.ts';

test.use({ actionTimeout: 5_000 });

test('B7-AC1 plan, upload and dashboard values agree', async ({ page }) => {
  await test.step('a-home', async () => {
    await signIn(page);
  });

  await test.step('plan', async () => {
    await openSection(page, 'Пилотный план');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Пилотный план',
        exact: true,
      }),
    ).toBeVisible();
    await expectPlanLimits(page);
  });

  await test.step('upload', async () => {
    await openSection(page, 'Загрузка');
    await expectUploadLimits(page);
  });

  await test.step('dashboard', async () => {
    await openSection(page, 'Управление сайтом');
    await expect(main(page)).toContainText(dashboardStorageLine());
  });
});
