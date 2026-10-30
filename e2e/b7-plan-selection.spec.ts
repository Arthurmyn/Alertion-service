import { expect, test } from '@playwright/test';
import {
  accountById,
  choosePilotPlan,
  main,
  openScenario,
  openSection,
  planGate,
  rejectArchiveSize,
  rejectSecondSite,
  rejectStorage,
  rejectUnpackedSize,
} from './support/b7-support.ts';

test.use({ actionTimeout: 5_000 });

test('B7 task plan selection and over-limit states', async ({ page }) => {
  const account = accountById('a');

  await test.step('plan-not-selected', async () => {
    const slug = await openScenario(page, 'plan-not-selected');
    expect(slug).toBe(account.slug);

    await openSection(page, 'Загрузка');
    await expect(main(page)).toContainText(planGate);
    const planLink = main(page).getByRole('link', { name: /пилотный план/i });
    await expect(planLink).toHaveAttribute(
      'href',
      new RegExp(`/manage/${account.slug}/plan/?$`),
    );
    await planLink.click();
    await expect(page).toHaveURL(new RegExp(`/manage/${account.slug}/plan/?$`));

    await choosePilotPlan(page);
    await openSection(page, 'Загрузка');
    await expect(main(page)).not.toContainText(planGate);
    await expect(
      page.getByRole('button', { name: 'Проверить архив', exact: true }),
    ).toBeVisible();
  });

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
