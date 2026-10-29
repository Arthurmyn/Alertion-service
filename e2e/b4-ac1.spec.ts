import { expect, test } from '@playwright/test';
import {
  accountA,
  activeLine,
  archiveA,
  archiveB,
  candidateOf,
  confirmAction,
  expectPublicSite,
  openVersions,
  publishName,
  rollbackName,
  signIn,
  versionLabel,
  withApp,
} from './b4-helpers.ts';

const labelA = versionLabel(archiveA);
const labelB = versionLabel(archiveB);

test('B4-AC1 rolling back after publishing B restores A', async ({
  browser,
}) => {
  test.setTimeout(60000);

  await withApp(browser, candidateOf(archiveB), async (page) => {
    await signIn(page, accountA);
    await openVersions(page, accountA);

    await confirmAction(page, publishName(labelB));
    await expect(
      page.getByText(activeLine(labelB), { exact: true }),
    ).toBeVisible();
    await expectPublicSite(page, accountA.slug, archiveB);

    await openVersions(page, accountA);
    await confirmAction(page, rollbackName(labelA));
    await expect(
      page.getByText(activeLine(labelA), { exact: true }),
    ).toBeVisible();
    await expectPublicSite(page, accountA.slug, archiveA, archiveB);
  });
});
