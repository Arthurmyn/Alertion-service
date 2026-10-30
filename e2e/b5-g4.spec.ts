import { expect, test } from '@playwright/test';
import { domainExamples } from '../src/data/accounts.ts';
import {
  activateButton,
  expectActivationLocked,
  openDomainScenario,
} from './support/b5-support.ts';

test('G4 domain and HTTPS states are distinct and verification comes first', async ({
  page,
}) => {
  await openDomainScenario(page, 'domain-pending');
  await expect(page.getByText('HTTPS', { exact: true })).toBeVisible();
  await expect(
    page.getByText(domainExamples.certificate).first(),
  ).toBeVisible();
  await expect(
    page.getByText('Ожидание', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('Активен', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Ошибка', { exact: true })).toHaveCount(0);
  await expectActivationLocked(page);

  await page.getByRole('button', { name: 'Проверить', exact: true }).click();
  await expect(page.getByText('Контроль подтверждён')).toBeVisible();
  await expect(page.getByText('Активен', { exact: true })).toHaveCount(0);
  await expect(activateButton(page)).toBeEnabled();
  await activateButton(page).click();
  await expect(
    page.getByText('Активен', { exact: true }).first(),
  ).toBeVisible();

  await openDomainScenario(page, 'domain-active');
  await expect(page.getByText('HTTPS', { exact: true })).toBeVisible();
  await expect(
    page.getByText(domainExamples.certificate).first(),
  ).toBeVisible();
  await expect(
    page.getByText('Активен', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('Ожидание', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Ошибка', { exact: true })).toHaveCount(0);

  await openDomainScenario(page, 'domain-failed');
  await expect(page.getByText('HTTPS', { exact: true })).toBeVisible();
  await expect(
    page.getByText(domainExamples.certificate).first(),
  ).toBeVisible();
  await expect(page.getByText('Ошибка', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Ожидание', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Активен', { exact: true })).toHaveCount(0);
  await expectActivationLocked(page);
});

test('G4 records that the domain scope was not reduced', async ({ page }) => {
  await page.goto('/app/defense#goals');
  await expect(page.getByText(/объём не сокращали/i)).toBeVisible();
});
