import { expect, test } from '@playwright/test';
import { expectResultRow, resultCases } from './support/b8-support.ts';

test('B8-AC1 each result links to evidence', async ({ page }) => {
  await page.goto('/defense#results');
  const results = page.locator('#results');
  await expect(
    results.getByRole('heading', { level: 2, name: /Результаты сценариев/ }),
  ).toBeVisible();

  for (const item of resultCases) {
    await expectResultRow(results, item);
  }
});
