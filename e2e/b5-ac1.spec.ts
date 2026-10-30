import { expect, test } from '@playwright/test';
import {
  activateButton,
  expectActivationLocked,
  expectSetupOrder,
  openDomainScenario,
} from './support/b5-support.ts';

test('B5-AC1 domain-control verification comes before activation', async ({
  page,
}) => {
  await openDomainScenario(page, 'domain-pending');
  await expectSetupOrder(page);
  await expect(
    page.getByText('Ожидание', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('Контроль подтверждён')).toHaveCount(0);
  await expect(page.getByText('Активен', { exact: true })).toHaveCount(0);
  await expectActivationLocked(page);

  await page.getByRole('button', { name: 'Проверить', exact: true }).click();
  await expect(page.getByText('Контроль подтверждён')).toBeVisible();
  await expect(page.getByText('Активен', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Ожидание', { exact: true }).first(),
  ).toBeVisible();
  await expect(activateButton(page)).toBeEnabled();

  await activateButton(page).click();
  await expect(
    page.getByText('Активен', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('Ожидание', { exact: true })).toHaveCount(0);
});
