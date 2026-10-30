import { expect, test } from '@playwright/test';
import { goalCases, goalMarks, scopeNote } from './support/b8-support.ts';

test('B8-AC2 every goal is marked met, unmet or deferred', async ({ page }) => {
  await page.goto('/app/defense#goals');
  const goals = page.locator('#goals');
  await expect(
    goals.getByRole('heading', { level: 2, name: /Цели G1–G5/ }),
  ).toBeVisible();
  await expect(goals).toContainText(scopeNote);

  for (const goal of goalCases) {
    const row = goals.getByRole('row').filter({ hasText: goal.id });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(goal.quote);
    const cells = await row.getByRole('cell').allInnerTexts();
    expect(cells.length).toBeGreaterThanOrEqual(3);
    for (const cell of cells) expect(cell.trim()).not.toBe('');

    const marks = goalMarks(await row.innerText());
    expect(marks.deferred || marks.met || marks.unmet).toBe(true);
    if (goal.deferred) expect(marks.deferred).toBe(true);
    if (marks.met) {
      await expect(row).toContainText('проверено в прототипе');
      await expect(row.getByRole('link')).toBeVisible();
    }
  }
});
