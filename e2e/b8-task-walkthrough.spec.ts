import { expect, test } from '@playwright/test';
import { memberShort } from '../src/data/team.ts';

test('B8 task observation sheet stays deferred until the walkthrough', async ({
  page,
}) => {
  await page.goto('/app/defense#goals');
  const goals = page.locator('#goals');
  await expect(goals).toContainText('G1');
  await expect(goals).toContainText('G5');
  const sheet = goals.getByRole('table').filter({ hasText: 'отложено' });
  await expect(sheet).toBeVisible();
  for (const member of memberShort) {
    const row = sheet.getByRole('row', { name: member });
    await expect(row).toContainText('отложено');
  }
});
