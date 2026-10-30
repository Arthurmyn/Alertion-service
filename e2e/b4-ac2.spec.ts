import { expect, test } from '@playwright/test';
import { baseline } from '../src/data/accounts.ts';
import {
  accountA,
  accountB,
  activeArchiveName,
  activeLine,
  expectNoHistory,
  openVersions,
  signIn,
  versionLabel,
  withApp,
} from './support/b4-helpers.ts';

test('B4-AC2 rollback is disabled when no history is available', async ({
  browser,
}) => {
  test.setTimeout(60000);

  await test.step('rollback-none: account A has no previous version', async () => {
    await withApp(browser, baseline, async (page) => {
      await signIn(page, accountA);
      await openVersions(page, accountA);
      await expect(
        page.getByText(
          activeLine(versionLabel(activeArchiveName(accountA.slug))),
          { exact: true },
        ),
      ).toBeVisible();
      await expectNoHistory(page);
    });
  });

  await test.step('b-home: account B has no previous version', async () => {
    await withApp(browser, baseline, async (page) => {
      await signIn(page, accountB);
      await openVersions(page, accountB);
      await expect(
        page.getByText(
          activeLine(versionLabel(activeArchiveName(accountB.slug))),
          { exact: true },
        ),
      ).toBeVisible();
      await expectNoHistory(page);
    });
  });
});
