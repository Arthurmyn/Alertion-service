import { test } from '@playwright/test';
import {
  baselineSite,
  expectRejection,
  openScenario,
  openUpload,
  signInAsOwner,
  storageScenarioSite,
} from './b2-helpers.ts';

test('B2-AC4 oversized archive is rejected', async ({ page }) => {
  await signInAsOwner(page);
  await openUpload(page);
  await expectRejection(page, 'nan-28mb.zip', baselineSite());
});

test('B2-AC4 oversized unpacked version is rejected', async ({ page }) => {
  await signInAsOwner(page);
  await openUpload(page);
  await expectRejection(page, 'nan-unpack-60.zip', baselineSite());
});

test('B2-AC4 retained storage over the limit is rejected', async ({ page }) => {
  await openScenario(page, 'reject-storage');
  await expectRejection(page, 'nan-storage.zip', storageScenarioSite());
});
