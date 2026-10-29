import { expect, test } from '@playwright/test';

test('B5-AC4 section 3.2 smaller version is recorded on goals', async ({
  page,
}) => {
  await page.goto('/defense#goals');
  await expect(page).toHaveURL(/\/defense#goals$/);
  await expect(
    page.getByText(
      'B5 не сокращали; сокращённый вариант из §3.2 не понадобился',
    ),
  ).toBeVisible();
});
