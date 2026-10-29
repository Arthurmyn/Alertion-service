import { expect, test, type Page } from '@playwright/test';
import {
  accountA,
  activeMenu,
  demoSteps,
  publishedExtra,
  scenarioSelect,
  startDemo,
  stepLabel,
  urlEnding,
  type DemoStep,
} from './b8-support.ts';

async function expectStep(page: Page, step: DemoStep): Promise<void> {
  await expect(page.getByText(stepLabel(step.n))).toBeVisible();
  await expect(page.getByText(step.caption)).toBeVisible();
  if (step.path) await expect(page).toHaveURL(urlEnding(step.path));
}

async function expectMenu(page: Page, extra: boolean): Promise<void> {
  const frame = page.frameLocator('iframe');
  for (const item of activeMenu) {
    await expect(frame.getByText(item)).toBeVisible();
  }
  for (const item of publishedExtra) {
    const line = frame.getByText(item);
    if (extra) await expect(line).toBeVisible();
    else await expect(line).toHaveCount(0);
  }
}

test('demo section opens failure, denial and domain scenarios', async ({
  page,
}) => {
  await page.goto('/defense#demo');
  const demo = page.locator('#demo');
  await expect(
    demo.getByRole('heading', { level: 2, name: '3. Демо' }),
  ).toBeVisible();
  await expect(
    demo.getByRole('button', { name: 'Запустить демо' }),
  ).toBeVisible();
  for (const id of ['b-opens-a', 'publish-fail', 'domain-pending']) {
    await expect(demo.locator(`a[href*="scenario=${id}"]`)).toContainText(
      'Открыть',
    );
  }
});

test('B8 demo runner walks the ten steps', async ({ page }) => {
  await startDemo(page);
  await expect(scenarioSelect(page)).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Назад' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Далее' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();

  for (const step of demoSteps) {
    if (step.n > 1) {
      await page.getByRole('button', { name: 'Далее' }).click();
    }
    await expectStep(page, step);
    if (step.n === 2) {
      await expect(
        page.getByRole('navigation', { name: 'Разделы' }),
      ).toHaveCount(0);
      await expect(
        page
          .getByRole('banner')
          .getByText(accountA.businessName, { exact: true })
          .and(page.locator('span')),
      ).toBeVisible();
      await expectMenu(page, false);
    }
    if (step.n === 7) await expectMenu(page, true);
    if (step.n === 10) {
      await expect(page.getByText('Демо завершено.')).toBeVisible();
      const failures = page.locator(
        'a[href*="scenario=reject-"], a[href*="scenario=publish-fail"], a[href*="scenario=rollback-fail"]',
      );
      await expect.poll(() => failures.count()).toBeGreaterThanOrEqual(2);
    }
  }
});

test('demo runner steps back by replaying and leaves the select usable', async ({
  page,
}) => {
  await startDemo(page);
  await expect(scenarioSelect(page)).toBeDisabled();
  for (let n = 0; n < 3; n += 1) {
    await page.getByRole('button', { name: 'Далее' }).click();
  }
  const reached = demoSteps[3];
  if (!reached) throw new Error('demo step 4 is missing');
  await expectStep(page, reached);

  await page.getByRole('button', { name: 'Назад' }).click();
  const previous = demoSteps[2];
  if (!previous) throw new Error('demo step 3 is missing');
  await expectStep(page, previous);
  await expect(page.getByText(reached.caption)).toHaveCount(0);

  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByText(stepLabel(1))).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Далее' })).toHaveCount(0);
  await expect(scenarioSelect(page)).toBeEnabled();
});
