import { expect, type Locator, type Page } from '@playwright/test';
import { accounts, domainExamples } from '../src/data/accounts.ts';
import { scenarioById } from '../src/data/scenarios.ts';

const accountA = accounts.find((account) => account.id === 'a');

if (accountA === undefined) {
  throw new Error('Account A is missing from accounts');
}

export const owner = accountA;

export const domainScenarios = [
  'domain-pending',
  'domain-active',
  'domain-failed',
  'domain-deferred',
] as const;

const exampleTld = '.example';

export const exampleHosts = [
  owner.domainName,
  domainExamples.txtName,
  domainExamples.cnameName,
  domainExamples.cnameTarget,
] as const;

export const exampleValues = [
  owner.domainName,
  domainExamples.txtName,
  domainExamples.txtValue,
  domainExamples.cnameName,
  domainExamples.cnameTarget,
  domainExamples.certificate,
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function openDomainScenario(
  page: Page,
  scenarioId: string,
): Promise<void> {
  const scenario = scenarioById(scenarioId);
  if (scenario === undefined) {
    throw new Error(`Unknown scenario ${scenarioId}`);
  }

  const domainPath = `/manage/${owner.slug}/domain`;
  await page.goto('/login');
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(domainPath);
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByText('Войдите, чтобы управлять сайтом')).toBeVisible();
  await page
    .getByRole('button', {
      name: `Войти как ${owner.ownerName}, ${owner.businessName}`,
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(domainPath)}$`));

  await page.goto(`/?scenario=${scenarioId}`);
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(scenario.route)}$`));
  if (scenario.route !== domainPath) {
    await page.goto(domainPath);
  }
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(domainPath)}$`));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Домен', exact: true }),
  ).toBeVisible();
}

export function activateButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Активировать домен' });
}

export async function expectActivationLocked(page: Page): Promise<void> {
  const activate = activateButton(page);
  if ((await activate.count()) === 0) {
    await expect(activate).toHaveCount(0);
    return;
  }
  await expect(activate).toBeDisabled();
}

export async function expectMarkedExample(
  page: Page,
  value: string,
): Promise<void> {
  const pattern = escapeRegExp(value);
  const nodes = page.getByText(value);
  await expect(nodes.first()).toBeVisible();

  const count = await nodes.count();
  let marked = 0;

  for (let index = 0; index < count; index += 1) {
    const node = nodes.nth(index);
    if (!(await node.isVisible())) continue;

    const info = await node.evaluate((el, expected) => {
      const text = el.textContent ?? '';
      const exact = new RegExp(`(?<![\\w.-])${expected}(?![\\w.-])`, 'u');
      if (!exact.test(text)) return null;

      const childHasValue = [...el.children].some((child) =>
        exact.test(child.textContent ?? ''),
      );
      if (childHasValue) return null;

      const parentText = el.parentElement?.innerText ?? '';
      const nextText = el.nextElementSibling?.textContent ?? '';
      return {
        font: getComputedStyle(el).fontFamily,
        around: `${text}\n${parentText}\n${nextText}`,
      };
    }, pattern);

    if (info === null) continue;

    expect(info.font).toMatch(/IBM Plex Mono/);
    expect(info.around).toContain('пример');
    marked += 1;
  }

  expect(marked).toBeGreaterThan(0);
}

export async function expectDomainExamples(page: Page): Promise<void> {
  for (const host of exampleHosts) {
    expect(host.endsWith(exampleTld)).toBe(true);
  }

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Запись TXT' })).toBeVisible();
  await expect(
    main.getByRole('heading', { name: 'Запись CNAME' }),
  ).toBeVisible();

  const seen = new Set<string>();
  for (const value of exampleValues) {
    if (seen.has(value)) continue;
    seen.add(value);
    await expectMarkedExample(page, value);
  }
}

export async function expectSetupOrder(page: Page): Promise<void> {
  const text = await page.getByRole('main').innerText();
  const nameAt = boundedIndex(text, owner.domainName);
  const txtNameAt = boundedIndex(text, domainExamples.txtName);
  const txtValueAt = text.indexOf(domainExamples.txtValue);
  // The step list repeats «Проверить» before the records. The control is last.
  const checkAt = text.lastIndexOf('Проверить');

  expect(nameAt).toBeGreaterThanOrEqual(0);
  expect(txtNameAt).toBeGreaterThan(nameAt);
  expect(txtValueAt).toBeGreaterThan(txtNameAt);
  expect(checkAt).toBeGreaterThan(txtValueAt);
}

function boundedIndex(text: string, value: string): number {
  const match = new RegExp(
    `(?<![\\w.-])${escapeRegExp(value)}(?![\\w.-])`,
    'u',
  ).exec(text);
  return match?.index ?? -1;
}

export async function mainText(page: Page): Promise<string> {
  return page.getByRole('main').innerText();
}
