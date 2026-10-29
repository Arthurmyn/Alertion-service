import { expect, test } from '@playwright/test';
import {
  accountA,
  activeLine,
  archiveA,
  archiveB,
  candidateLine,
  candidateOf,
  confirmAction,
  expectFrameMenu,
  expectPublicSite,
  openVersions,
  publishFailedLine,
  publishName,
  publishedOf,
  rollbackFailedLine,
  rollbackName,
  signIn,
  versionLabel,
  withApp,
} from './b4-helpers.ts';

const labelA = versionLabel(archiveA);
const labelB = versionLabel(archiveB);

test('G2 preview with A still active, publish B, rollback to A, failed actions keep the label', async ({
  browser,
}) => {
  test.setTimeout(90000);

  await test.step('preview B while A is active, then publish B and roll back to A', async () => {
    await withApp(browser, candidateOf(archiveB), async (page) => {
      await signIn(page, accountA);
      await page.goto(`/manage/${accountA.slug}/preview`);
      await expect(
        page.getByText(activeLine(labelA), { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(candidateLine(labelB), { exact: true }),
      ).toBeVisible();
      await expectFrameMenu(page, archiveB);
      await expectPublicSite(page, accountA.slug, archiveA, archiveB);

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

  await test.step('a failed publication keeps version A', async () => {
    await withApp(
      browser,
      candidateOf(archiveB, { publishFails: true }),
      async (page) => {
        await signIn(page, accountA);
        await openVersions(page, accountA);
        await confirmAction(page, publishName(labelB));
        await expect(
          page.getByText(publishFailedLine(labelA), { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText(activeLine(labelA), { exact: true }),
        ).toBeVisible();
        await expectPublicSite(page, accountA.slug, archiveA, archiveB);
      },
    );
  });

  await test.step('a failed rollback keeps version B', async () => {
    await withApp(
      browser,
      publishedOf(archiveB, { rollbackFails: true }),
      async (page) => {
        await signIn(page, accountA);
        await openVersions(page, accountA);
        await confirmAction(page, rollbackName(labelA));
        await expect(
          page.getByText(rollbackFailedLine(labelB), { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText(activeLine(labelB), { exact: true }),
        ).toBeVisible();
        await expectPublicSite(page, accountA.slug, archiveB);
      },
    );
  });
});
