import { expect, test } from '@playwright/test';
import {
  expectActivationLocked,
  expectDomainExamples,
  expectSetupOrder,
  openDomainScenario,
} from './b5-support.ts';

test('B5 task ownership and DNS instructions use fictional domain values', async ({
  page,
}) => {
  await openDomainScenario(page, 'domain-pending');
  await expectSetupOrder(page);
  await expectDomainExamples(page);
  await expect(
    page.getByRole('button', { name: 'Проверить', exact: true }),
  ).toBeVisible();
  await expectActivationLocked(page);
});
