import { expect, test } from '@playwright/test';
import {
  accountA,
  activeLine,
  archiveA,
  archiveB,
  confirmAction,
  expectPublicSite,
  openVersions,
  publishedOf,
  rollbackFailedLine,
  rollbackName,
  signIn,
  versionLabel,
  withApp,
} from './support/b4-helpers.ts';

const labelA = versionLabel(archiveA);
const labelB = versionLabel(archiveB);

test('B4-AC3 a failed rollback preserves the current version label', async ({
  browser,
}) => {
  test.setTimeout(60000);

  await withApp(
    browser,
    publishedOf(archiveB, { rollbackFails: true }),
    async (page) => {
      await signIn(page, accountA);
      await openVersions(page, accountA);
      await expect(
        page.getByText(activeLine(labelB), { exact: true }),
      ).toBeVisible();

      await confirmAction(page, rollbackName(labelA));

      await expect(
        page.getByText(rollbackFailedLine(labelB), { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(activeLine(labelB), { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: rollbackName(labelA), exact: true }),
      ).toBeEnabled();
      await expectPublicSite(page, accountA.slug, archiveB);
    },
  );
});
