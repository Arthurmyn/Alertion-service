import { test } from '@playwright/test';
import {
  baselineSite,
  expectRejection,
  openScenario,
  openUpload,
  signInAsOwner,
  storageScenarioSite,
} from './b2-helpers.ts';

const baselineRejections = [
  ['missing entry page', 'nan-no-index.zip'],
  ['unsafe path', 'nan-unsafe.zip'],
  ['oversized archive', 'nan-28mb.zip'],
  ['oversized unpacked version', 'nan-unpack-60.zip'],
] as const;

for (const [title, archiveName] of baselineRejections) {
  test(`B2-AC5 ${title} keeps the active version`, async ({ page }) => {
    await signInAsOwner(page);
    await openUpload(page);
    await expectRejection(page, archiveName, baselineSite());
  });
}

test('B2-AC5 retained storage keeps the active version', async ({ page }) => {
  await openScenario(page, 'reject-storage');
  await expectRejection(page, 'nan-storage.zip', storageScenarioSite());
});
