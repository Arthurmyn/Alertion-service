import { expect, test } from '@playwright/test';
import {
  accountA,
  accountB,
  plantSession,
  readSession,
  scenarioSelect,
} from './support/b8-support.ts';

test('?scenario= replaces the saved session and drops the query', async ({
  page,
}) => {
  await plantSession(page, 'b');
  await page.goto('/defense?scenario=a-home');
  await expect(page).not.toHaveURL(/scenario=/);
  await expect(page).toHaveURL(new RegExp(`/manage/${accountA.slug}$`));
  await expect(page.getByRole('link', { name: 'Вход' })).toHaveCount(0);
  const session = await readSession(page);
  expect(session.sessionAccountId).toBe(accountA.id);
  expect(session.scenarioId).toBe('a-home');
});

test('?scenario=signed-out clears the saved account', async ({ page }) => {
  await plantSession(page, 'a');
  await page.goto('/?scenario=signed-out');
  await expect(page).not.toHaveURL(/scenario=/);
  await expect(page).toHaveURL(/\/login$/);
  const session = await readSession(page);
  expect(session.sessionAccountId).toBeNull();
  expect(session.scenarioId).toBe('signed-out');
});

test('?scenario=b-opens-a opens account A as account B', async ({ page }) => {
  await page.goto('/?scenario=b-opens-a');
  await expect(page).not.toHaveURL(/scenario=/);
  await expect(page).toHaveURL(new RegExp(`/manage/${accountA.slug}$`));
  const session = await readSession(page);
  expect(session.sessionAccountId).toBe(accountB.id);
  expect(session.scenarioId).toBe('b-opens-a');
});

test('an unknown scenario id is ignored and removed', async ({ page }) => {
  await plantSession(page, 'b');
  await page.goto('/?scenario=not-a-real-scenario');
  await expect(page).not.toHaveURL(/scenario=/);
  await expect(page).toHaveURL(new RegExp(`/manage/${accountB.slug}$`));
  const session = await readSession(page);
  expect(session.sessionAccountId).toBe(accountB.id);
  expect(session.scenarioId).toBeNull();
});

test('the shell offers a scenario select and reset', async ({ page }) => {
  await page.goto('/defense');
  await expect(scenarioSelect(page)).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Сбросить' })).toBeEnabled();
});
