import { expect, test } from '@playwright/test';
import {
  baselineSite,
  expectRejection,
  openUpload,
  rejectionMessage,
  signInAsOwner,
  unsafePath,
} from './b2-helpers.ts';

test('B2-AC3 unsafe path is rejected', async ({ page }) => {
  const site = baselineSite();
  expect(rejectionMessage('nan-unsafe.zip', site)).toContain(
    unsafePath('nan-unsafe.zip'),
  );

  await signInAsOwner(page);
  await openUpload(page);
  await expectRejection(page, 'nan-unsafe.zip', site);
});
