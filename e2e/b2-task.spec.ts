import { expect, test } from '@playwright/test';
import {
  activeVersion,
  baselineSite,
  expectActiveSample,
  fixture,
  openUpload,
  ownerA,
  signInAsOwner,
} from './support/b2-helpers.ts';

const taskFixtures = [
  'nan-v2.zip',
  'nan-v3.zip',
  'nan-v4.zip',
  'nan-no-index.zip',
  'nan-unsafe.zip',
  'nan-28mb.zip',
  'nan-unpack-60.zip',
  'nan-storage.zip',
] as const;

test('B2 task lists the sample and rejection fixtures', async ({ page }) => {
  await signInAsOwner(page);
  await openUpload(page);
  for (const name of taskFixtures) {
    await expect(
      page.getByRole('radio', { name: fixture(name).name }),
    ).toBeVisible();
  }
});

test('B2 task serves harmless sample HTML', async ({ page }) => {
  const active = activeVersion(baselineSite());
  await page.goto(`/app/site/${ownerA.slug}`);
  await expectActiveSample(page, active.archiveName);
  await expect(
    page.frameLocator('iframe[title="Страница сайта"]').locator('style'),
  ).toHaveCount(1);
});
