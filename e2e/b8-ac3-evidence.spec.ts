import { expect, test } from '@playwright/test';
import { sprintNumbers } from '../src/data/metrics.ts';
import {
  EMPTY_SLOT_LABEL,
  evidenceFileName,
  evidenceSlots,
} from '../src/data/sprintEvidence.ts';

test('B8-AC3 members capture evidence during each sprint', async ({ page }) => {
  await test.step('each sprint has a labelled empty slot per check', async () => {
    await page.goto('/app/defense#evidence-log');
    const log = page.locator('#evidence-log');
    await expect(
      log.getByRole('heading', { name: /Журнал доказательств/ }),
    ).toBeVisible();
    for (const sprint of sprintNumbers) {
      await expect(
        log.getByRole('heading', { name: `Спринт ${sprint}` }),
      ).toBeVisible();
    }
    for (const slot of evidenceSlots) {
      const item = log
        .locator('li')
        .filter({ hasText: evidenceFileName(slot) });
      await expect(item).toContainText(`${slot.sprint}`);
      await expect(item).toContainText(slot.backlogId);
      await expect(item).toContainText(slot.check);
      await expect(item).toContainText(EMPTY_SLOT_LABEL);
      await expect(item).not.toContainText('пройдено');
    }
  });

  await test.step('the process criterion is listed with the other non-checks', async () => {
    await page.goto('/app/defense');
    const heading = page.getByRole('heading', {
      name: /Невыполненные и непроверяемые/,
    });
    await expect(heading).toBeVisible();
    const section = page.locator('section').filter({ has: heading });
    await expect(section).toContainText('B8-AC3');
    await expect(section).toContainText('не выполнено');
    await expect(section).toContainText('4.2');
    await expect(section).toContainText(/ревью/);
    await expect(section).toContainText(/час/);
    await expect(section).toContainText(/рол/);
    await expect(section).toContainText(/IEEE|оформлен/);
    await expect(section).toContainText(/реч|выступлен/);
  });
});
