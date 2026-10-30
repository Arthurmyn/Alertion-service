import { expect, test } from '@playwright/test';
import {
  activeVersion,
  baselineSite,
  checkArchive,
  examplePath,
  expectActiveSample,
  openUpload,
  signInAsOwner,
} from './support/b2-helpers.ts';

test('B2-AC1 valid upload reaches the example URL', async ({ page }) => {
  const active = activeVersion(baselineSite());
  const path = examplePath();

  await signInAsOwner(page);
  await openUpload(page);
  await checkArchive(page, 'nan-v2.zip');

  const link = page.locator('main').getByRole('link', { name: path });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    new RegExp(`^(?:https?:\\/\\/[^/]+)?${path}/?$`),
  );
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expectActiveSample(page, active.archiveName);
});
