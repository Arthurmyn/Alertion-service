import { expect, test } from '@playwright/test';
import {
  expectTextAbsent,
  inkHeader,
  ownerOnlyLine,
  publicHeader,
  readPath,
  signIn,
} from './support/b1-helpers.ts';
import { openOwnProject, projectTabs } from './support/nav.ts';

const managementOnPublic = [
  'nan-v1.zip',
  '12 МБ из 150 МБ',
  'nan.example',
  'Подключить домен',
  'Заточка ножа, 2 000 ₸',
  'Мастерская Темир',
  'Ерлан Б.',
] as const;

test('B1-AC1 public website content and private management data are distinguished', async ({
  page,
}) => {
  await signIn(page, 'a');

  await page.goto('/app');
  await expect(page).toHaveURL(/\/manage$/);
  await expect(page.getByRole('banner')).toHaveCSS(
    'background-color',
    inkHeader,
  );
  await openOwnProject(page, 'Пекарня Нан');
  expect(readPath(page)).toBe('/manage/nan');
  await expect(page.getByText(ownerOnlyLine)).toBeVisible();
  await expect(
    projectTabs(page).getByRole('link', { name: 'Развёртывания', exact: true }),
  ).toBeVisible();
  await expect(
    projectTabs(page).getByRole('link', { name: 'Настройки', exact: true }),
  ).toBeVisible();
  await expectTextAbsent(page, 'Заточка ножа, 2 000 ₸');
  await expectTextAbsent(page, 'Мастерская Темир');

  await page.goto('/app/site/nan');
  await expect(page).toHaveURL(/\/site\/nan$/);
  await expect(page.getByRole('banner')).toHaveCSS(
    'background-color',
    publicHeader,
  );
  await expect(page.getByRole('link', { name: 'Загрузка' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Версии' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Домен' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Пилотный план' })).toHaveCount(
    0,
  );
  await expect(page.getByText(ownerOnlyLine)).toHaveCount(0);

  const site = page.frameLocator('iframe[title="Страница сайта"]');
  await expect(
    site.getByRole('heading', { name: 'Пекарня Нан' }),
  ).toBeVisible();
  await expect(site.getByText('Баурсак, 500 ₸')).toBeVisible();

  for (const text of managementOnPublic) {
    await expectTextAbsent(page, text);
  }
});
