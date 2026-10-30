import { expect, test } from '@playwright/test';
import { baseline } from '../src/data/accounts.ts';
import {
  accountA,
  activeLine,
  archiveA,
  archiveB,
  expectNoHistory,
  openVersions,
  publishedOf,
  rollbackName,
  signIn,
  versionLabel,
  withApp,
} from './support/b4-helpers.ts';

const labelA = versionLabel(archiveA);
const labelB = versionLabel(archiveB);

test('B4 define cases with and without version history using A/B records', async ({
  browser,
}) => {
  test.setTimeout(60000);

  await test.step('rollback-ok: previous version A can be restored while B is active', async () => {
    await withApp(browser, publishedOf(archiveB), async (page) => {
      await signIn(page, accountA);
      await openVersions(page, accountA);
      await expect(
        page.getByText(activeLine(labelB), { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: rollbackName(labelA), exact: true }),
      ).toBeEnabled();
    });
  });

  await test.step('rollback-none: no previous version, rollback stays unavailable', async () => {
    await withApp(browser, baseline, async (page) => {
      await signIn(page, accountA);
      await openVersions(page, accountA);
      await expect(
        page.getByText(activeLine(labelA), { exact: true }),
      ).toBeVisible();
      await expectNoHistory(page);
    });
  });
});
