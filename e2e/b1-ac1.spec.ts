import { expect, test } from '@playwright/test';
import {
  expectTextAbsent,
  inkHeader,
  ownerOnlyLine,
  publicHeader,
  readPath,
  signIn,
} from './b1-helpers.ts';

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

  await page.goto('/');
  await expect(page).toHaveURL(/\/manage\/nan$/);
  expect(readPath(page)).toBe('/manage/nan');
  await expect(page.getByRole('banner')).toHaveCSS(
    'background-color',
    inkHeader,
  );
  await expect(page.getByText(ownerOnlyLine)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Версии' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Домен' })).toBeVisible();
  await expect(page.getByText('Заточка ножа, 2 000 ₸')).toHaveCount(0);
  await expect(page.getByText('Мастерская Темир')).toHaveCount(0);

  await page.goto('/site/nan');
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
