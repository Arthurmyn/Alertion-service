import { expect, test } from '@playwright/test';

test.describe('landing at /', () => {
  test('opens with the hero, the pilot-plan facts and a way into the service', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: /который можно проверить/ }),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.getByText('архив до 20 МБ')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Открыть сервис' }).first(),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Открыть сервис' }).last().click();
    await expect(page).toHaveURL(/\/app\/login$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Вход' }),
    ).toBeVisible();
  });

  test('has the sections the navigation points to', async ({ page }) => {
    await page.goto('/');
    for (const [href, heading] of [
      ['#how', /за пять шагов/],
      ['#features', /в прототипе/],
      ['#verify', /а «проверено»/],
      ['#team', /не коммерческий/],
    ] as const) {
      await page.locator(`nav a[href="${href}"]`).first().click();
      await expect(page.locator(href)).toBeInViewport();
      await expect(
        page.locator(href).getByRole('heading', { level: 2, name: heading }),
      ).toBeVisible();
    }
  });

  test('says plainly that verification is not available', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#verify');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toContainText('Статус «Проверено» не появится');
    await expect(section.getByText('Недоступно')).toHaveCount(3);
    await expect(section.getByText('Доступно', { exact: true })).toHaveCount(1);
  });

  test('links to the service security page and the defense page under /app', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: 'Посмотреть панель безопасности' }),
    ).toHaveAttribute('href', '/app/manage/security');
    await expect(
      page.getByRole('link', { name: 'Страница защиты проекта' }),
    ).toHaveAttribute('href', '/app/defense');
  });

  test('fits a phone without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test('shows content without motion when the visitor prefers none', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('#team').scrollIntoViewIfNeeded();
    await expect(page.locator('#team h2')).toBeVisible();
    await context.close();
  });
});

test.describe('the service under /app', () => {
  test('keeps working at its new address', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app\/login$/);
  });

  test('forwards addresses from before the move', async ({ page }) => {
    await page.goto('/manage/nan');
    await expect(page).toHaveURL(/\/app\/login\?next=%2Fmanage%2Fnan$/);
    await page.goto('/defense#goals');
    await expect(page).toHaveURL(/\/app\/defense#goals$/);
  });
});
