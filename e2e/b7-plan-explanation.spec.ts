import { expect, test } from '@playwright/test';
import { expectPlanLimits, main, openSection, signIn } from './b7-support.ts';

test.use({ actionTimeout: 5_000 });

test('B7 task pilot plan explanation uses the section 1 values', async ({
  page,
}) => {
  await test.step('a-home', async () => {
    await signIn(page);
    await openSection(page, 'Пилотный план');
  });

  const region = main(page);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Пилотный план', exact: true }),
  ).toBeVisible();
  await expectPlanLimits(page);
  await expect(region).toContainText(/архив/i);
  await expect(region).toContainText(/распакован/i);
  await expect(region).toContainText(/хранилищ/i);
  await expect(page.getByRole('switch')).toHaveCount(0);
  await expect(region.getByRole('radiogroup')).toHaveCount(0);
});
