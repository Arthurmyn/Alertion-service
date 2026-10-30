import { test } from '@playwright/test';
import {
  baselineSite,
  expectRejection,
  openScenario,
  openUpload,
  signInAsOwner,
  storageScenarioSite,
} from './support/b2-helpers.ts';

test('G3 unsafe upload is rejected', async ({ page }) => {
  await signInAsOwner(page);
  await openUpload(page);
  await expectRejection(page, 'nan-unsafe.zip', baselineSite());
});

test('G3 over-limit archive upload is rejected', async ({ page }) => {
  await signInAsOwner(page);
  await openUpload(page);
  await expectRejection(page, 'nan-28mb.zip', baselineSite());
});

test('G3 over-limit unpacked upload is rejected', async ({ page }) => {
  await signInAsOwner(page);
  await openUpload(page);
  await expectRejection(page, 'nan-unpack-60.zip', baselineSite());
});

test('G3 over-limit storage upload is rejected', async ({ page }) => {
  await openScenario(page, 'reject-storage');
  await expectRejection(page, 'nan-storage.zip', storageScenarioSite());
});
