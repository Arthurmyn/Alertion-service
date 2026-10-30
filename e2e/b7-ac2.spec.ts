import { test } from '@playwright/test';
import {
  rejectArchiveSize,
  rejectSecondSite,
  rejectStorage,
  rejectUnpackedSize,
  signIn,
} from './support/b7-support.ts';

test.use({ actionTimeout: 5_000 });

test('B7-AC2 rejection message explains the limit and the next step', async ({
  page,
}) => {
  const account = await signIn(page);

  await test.step('reject-archive-size', async () => {
    await rejectArchiveSize(page);
  });

  await test.step('reject-unpacked-size', async () => {
    await rejectUnpackedSize(page);
  });

  await test.step('reject-storage', async () => {
    await rejectStorage(page);
  });

  await test.step('second-site', async () => {
    await rejectSecondSite(page, account);
  });
});
