import { test } from '@playwright/test';
import {
  baselineSite,
  expectRejection,
  openUpload,
  signInAsOwner,
} from './b2-helpers.ts';

test('B2-AC2 missing entry page is rejected', async ({ page }) => {
  await signInAsOwner(page);
  await openUpload(page);
  await expectRejection(page, 'nan-no-index.zip', baselineSite());
});
