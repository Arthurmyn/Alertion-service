/* global console, document, process, window, URL */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';

// Product screenshots for the landing page, taken from the running service.
// Start the dev server first. Set LANDING_BASE_URL if it is not on 5173.
// Every shot keeps a 1.6 aspect ratio so the page can reserve its space.
const baseURL = process.env.LANDING_BASE_URL ?? 'http://127.0.0.1:5173';
const folder = resolve('public/landing/shots');
await mkdir(folder, { recursive: true });

const browser = await chromium.launch();

async function shot(name, route, clip, prepare) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto(new URL(route, baseURL).href);
    await page.evaluate(() => document.fonts.ready);
    if (prepare) await prepare(page);
    await page.waitForTimeout(500);
    // `clip` is relative to the viewport. A function lets a shot centre on an element.
    const area = typeof clip === 'function' ? await clip(page) : clip;
    await page.screenshot({ path: resolve(folder, `${name}.png`), clip: area });
    console.log(`captured ${name}`);
  } finally {
    await context.close();
  }
}

const sidebar = (page) =>
  page.getByRole('navigation', { name: 'Разделы', exact: true });

/** The content column and top bar, without the sidebar. */
const content = { x: 248, y: 0, width: 1192, height: 745 };

await shot('overview', '/app/manage?scenario=a-home', content, async (page) => {
  await sidebar(page)
    .getByRole('link', { name: 'Проекты', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Использование' }),
  ).toBeVisible();
});

await shot(
  'upload',
  '/app/manage?scenario=reject-no-index',
  // The bottom of the page: the last choices, the button and the refusal.
  { ...content, y: 155 },
  async (page) => {
    await expect(
      page.getByText('В архиве нет index.html в корне.'),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  },
);

await shot(
  'publish',
  '/app/manage?scenario=preview-b',
  async (page) => {
    const box = await page.getByRole('dialog').boundingBox();
    if (!box) throw new Error('the publish dialog has no box');
    const width = 610;
    const height = 381;
    return {
      x: Math.round(box.x + box.width / 2 - width / 2),
      y: Math.round(box.y + box.height / 2 - height / 2),
      width,
      height,
    };
  },
  async (page) => {
    await page
      .getByRole('navigation', { name: 'Разделы проекта', exact: true })
      .getByRole('link', { name: 'Развёртывания', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Опубликовать версию B', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Only the dialog on its scrim: the page behind it would be cut mid-word.
    await page.addStyleTag({ content: 'main, header { visibility: hidden; }' });
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog?.parentElement)
        dialog.parentElement.style.visibility = 'visible';
    });
  },
);

await shot('security', '/app/manage?scenario=a-home', content, async (page) => {
  await sidebar(page)
    .getByRole('link', { name: 'Безопасность', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Панель безопасности' }),
  ).toBeVisible();
});

await browser.close();
