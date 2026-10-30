import { expect, test, type Page } from '@playwright/test';
import { scenarioSelect } from './support/b8-support.ts';

async function ownerHome(page: Page) {
  await page.goto('/app/manage/nan?scenario=a-home');
  await expect(
    page.getByRole('heading', { name: 'Управление сайтом', exact: true }),
  ).toBeVisible();
}

async function expectNoPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test('desktop rail keeps section names, active route and saved collapse choice', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await ownerHome(page);
  const nav = page.getByRole('navigation', { name: 'Разделы', exact: true });
  // Inside a project the sidebar keeps "Проекты" marked.
  const home = nav.getByRole('link', { name: 'Проекты', exact: true });
  await expect(home).toHaveAttribute('aria-current', 'page');
  await page
    .getByRole('button', { name: 'Свернуть меню', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Развернуть меню', exact: true }),
  ).toBeVisible();
  await expect(home).toHaveAccessibleName('Проекты');
  await expect(home).toHaveAttribute('title', 'Проекты');
  // "Развёртывания" has sub-pages, so the sidebar drills into them.
  await nav.getByRole('link', { name: 'Развёртывания', exact: true }).click();
  await expect(
    nav.getByRole('link', { name: 'Обзор', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Развернуть меню', exact: true }),
  ).toBeVisible();
  await expectNoPageOverflow(page);
});

for (const width of [375, 360]) {
  test(`mobile ${width}: repeated dismissals restore focus and release the page`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    await ownerHome(page);
    const nav = page.getByRole('navigation', { name: 'Разделы', exact: true });
    const opener = page.getByRole('button', {
      name: 'Открыть меню',
      exact: true,
    });
    await expect(nav).toBeHidden();
    for (let cycle = 0; cycle < 3; cycle++) {
      await opener.click();
      await expect(nav).toBeVisible();
      await expect(
        nav.getByRole('link', { name: 'Проекты', exact: true }),
      ).toBeFocused();
      await expect(page.locator('main')).toHaveAttribute('inert', '');
      await expect(scenarioSelect(page)).toBeVisible();
      if (cycle === 1) {
        await page.mouse.click(width - 12, 300);
      } else {
        await page.keyboard.press('Escape');
      }
      await expect(nav).toBeHidden();
      await expect(opener).toBeFocused();
      await expect(page.locator('main')).not.toHaveAttribute('inert');
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
        'hidden',
      );
    }
    await opener.click();
    await nav.getByRole('link', { name: 'Развёртывания', exact: true }).click();
    await expect(nav).toBeHidden();
    await expect(
      page.getByRole('heading', { name: 'Развёртывания', exact: true }),
    ).toBeFocused();
    await expectNoPageOverflow(page);
  });

  test(`mobile ${width}: Escape dismisses the drawer before the running demo`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/app/defense#demo');
    await page
      .getByRole('button', { name: 'Запустить демо', exact: true })
      .click();
    const demo = page.getByRole('region', { name: 'Демо', exact: true });
    await expect(demo.getByText('Шаг 1 из 10', { exact: true })).toBeVisible();
    await page
      .getByRole('button', { name: 'Открыть меню', exact: true })
      .click();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('navigation', { name: 'Разделы', exact: true }),
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Открыть меню', exact: true }),
    ).toBeFocused();
    await expect(demo).toBeVisible();
    await expect(demo.getByText('Шаг 1 из 10', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(demo).toHaveCount(0);
  });
}

test('public demo steps keep public navigation boundaries and the demo controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/app/defense#demo');
  await page
    .getByRole('button', { name: 'Запустить демо', exact: true })
    .click();
  const demo = page.getByRole('region', { name: 'Демо', exact: true });
  for (let step = 1; step <= 7; step++) {
    await expect(
      demo.getByText(`Шаг ${step} из 10`, { exact: true }),
    ).toBeVisible();
    if (step === 2 || step === 7) {
      await expect(
        page.getByRole('navigation', { name: 'Разделы', exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Открыть меню', exact: true }),
      ).toHaveCount(0);
      await expect(page.locator('header a[href^="/app/manage/"]')).toHaveCount(
        0,
      );
      await expectNoPageOverflow(page);
    }
    if (step < 7)
      await demo.getByRole('button', { name: 'Далее', exact: true }).click();
  }
});

test('mobile confirmation Escape cancels only the dialog and restores its action', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/app/defense#demo');
  await page
    .getByRole('button', { name: 'Запустить демо', exact: true })
    .click();
  const demo = page.getByRole('region', { name: 'Демо', exact: true });
  for (let step = 1; step < 4; step++) {
    await demo.getByRole('button', { name: 'Далее', exact: true }).click();
  }
  await page
    .getByRole('navigation', { name: 'Разделы проекта', exact: true })
    .getByRole('link', { name: 'Развёртывания', exact: true })
    .click();
  const publish = page.getByRole('button', {
    name: 'Опубликовать версию B',
    exact: true,
  });
  await publish.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const cancel = dialog.getByRole('button', { name: 'Отмена', exact: true });
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    dialog.getByRole('button', { name: 'Опубликовать версию B', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(publish).toBeFocused();
  await expect(demo.getByText('Шаг 4 из 10', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Разделы', exact: true }),
  ).toBeHidden();
});

test('a stored desktop rail becomes a labelled mobile drawer and survives resizing', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await ownerHome(page);
  await page
    .getByRole('button', { name: 'Свернуть меню', exact: true })
    .click();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Открыть меню', exact: true }).click();
  const nav = page.getByRole('navigation', { name: 'Разделы', exact: true });
  await expect(nav.getByText('Развёртывания', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(
    page.getByRole('button', { name: 'Развернуть меню', exact: true }),
  ).toBeVisible();
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    'hidden',
  );
  await expectNoPageOverflow(page);
});

test('reset on the same route keeps keyboard focus and updates the open drawer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ownerHome(page);
  await page.goto('/app/defense');
  await page.getByRole('button', { name: 'Открыть меню', exact: true }).click();
  const picker = scenarioSelect(page);
  await picker.click();
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click();
  await expect(page).toHaveURL(/\/defense$/);
  await expect(picker).toBeFocused();
  const nav = page.getByRole('navigation', { name: 'Разделы', exact: true });
  await expect(
    nav.getByRole('link', { name: 'Вход', exact: true }),
  ).toBeVisible();
  await expect(nav.locator('a[href^="/app/manage/"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Открыть меню', exact: true }),
  ).toBeFocused();
  await expect(page.locator('main')).not.toHaveAttribute('inert');
});
