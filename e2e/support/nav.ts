import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Project pages are reached through the project tabs and, for the two tabs that
 * own several pages, a second row of sub-pages. The names below are the page
 * names the specs use; each maps to its tab and optional sub-page.
 */
const route: Record<string, readonly [tab: string, subpage?: string]> = {
  'Управление сайтом': ['Обзор'],
  Версии: ['Развёртывания', 'Версии'],
  Загрузка: ['Развёртывания', 'Загрузка'],
  Предпросмотр: ['Развёртывания', 'Предпросмотр'],
  Домен: ['Настройки', 'Домен'],
  'Пилотный план': ['Настройки', 'Пилотный план'],
};

export function projectTabs(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Разделы проекта', exact: true });
}

export function projectSubpages(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Подразделы', exact: true });
}

export function sidebar(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Разделы', exact: true });
}

export async function openProjectSection(
  page: Page,
  name: string,
): Promise<void> {
  const target = route[name];
  if (!target) throw new Error(`unknown project section ${name}`);
  const [tab, subpage] = target;
  // The URL changes before the page is drawn; decide only once the project's tabs exist.
  await expect(projectTabs(page)).toBeVisible();

  if (subpage) {
    const pill = projectSubpages(page).getByRole('link', {
      name: subpage,
      exact: true,
    });
    if ((await pill.count()) > 0) {
      // Already there is a valid answer; clicking the current link only re-navigates.
      if ((await pill.getAttribute('aria-current')) !== 'page') {
        await pill.click();
      }
      return;
    }
  }
  const tabLink = projectTabs(page).getByRole('link', {
    name: tab,
    exact: true,
  });
  await tabLink.click();
  // Let the tab's own navigation finish before looking for its sub-pages.
  await expect(tabLink).toHaveAttribute('aria-current', 'page');
  if (subpage && tab !== subpage) {
    const pill = projectSubpages(page).getByRole('link', {
      name: subpage,
      exact: true,
    });
    if ((await pill.getAttribute('aria-current')) !== 'page') {
      await pill.click();
    }
  }
}

/** From anywhere in the workspace into the one project the account owns. */
export async function openOwnProject(
  page: Page,
  businessName: string,
): Promise<void> {
  await sidebar(page)
    .getByRole('link', { name: 'Проекты', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Обзор пространства' }),
  ).toBeAttached();
  await page
    .locator('main')
    .getByRole('link', { name: businessName, exact: true })
    .click();
}
