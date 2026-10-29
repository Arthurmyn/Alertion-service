/* global console, document, process, URL */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { scenarios } from '../src/data/scenarios.ts';

const baseURL = process.env.EVIDENCE_BASE_URL ?? 'http://127.0.0.1:5173';
const viewport = { width: 1280, height: 900 };
const folder = resolve('public/evidence');
await mkdir(folder, { recursive: true });
const browser = await chromium.launch();
const entries = {};

async function capture(id, title, route, prepare, selector = 'main') {
  const context = await browser.newContext({
    viewport,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto(new URL(route, baseURL).href);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page).not.toHaveURL(/scenario=/);
    await page.evaluate(() => document.fonts.ready);
    if (prepare) await prepare(page);
    const target = page.locator(selector);
    const png = await target.screenshot({ path: resolve(folder, `${id}.png`) });
    entries[id] = {
      src: `/evidence/${id}.png`,
      alt: title,
      width: png.readUInt32BE(16),
      height: png.readUInt32BE(20),
      route,
      capturedRoute: new URL(page.url()).pathname + new URL(page.url()).hash,
      viewport,
      capturedAt: new Date().toISOString(),
    };
  } finally {
    await context.close();
  }
}

try {
  for (const scenario of scenarios) {
    await capture(
      scenario.id,
      scenario.title,
      `${scenario.route}?scenario=${scenario.id}`,
    );
  }
  await capture(
    'public-nan',
    'Публичная страница Пекарни Нан',
    '/site/nan?scenario=a-home',
    async (page) => {
      // The scenario loads its management route first; keep its saved state.
      await page.goto(new URL('/site/nan', baseURL).href);
      await expect(
        page.frameLocator('iframe').getByRole('heading', {
          name: 'Пекарня Нан',
          exact: true,
        }),
      ).toBeVisible();
    },
  );
  await capture(
    'publish-confirm',
    'Подтверждение публикации версии B',
    '/manage/nan/preview?scenario=preview-b',
    async (page) => {
      await page.goto(new URL('/manage/nan/versions', baseURL).href);
      await page
        .getByRole('button', {
          name: 'Опубликовать версию B',
          exact: true,
        })
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
    },
    '[role="dialog"]',
  );
  await capture(
    'goals',
    'Цели G1–G5 и пояснение объёма B5',
    '/defense#goals',
    undefined,
    '#goals',
  );
  const manifest = { capturedAt: new Date().toISOString(), entries };
  await writeFile(
    resolve(folder, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const images = Object.fromEntries(
    Object.entries(entries).map(([id, entry]) => [
      id,
      {
        src: entry.src,
        alt: entry.alt,
        width: entry.width,
        height: entry.height,
      },
    ]),
  );
  await writeFile(
    resolve('src/data/evidence.ts'),
    `// Captured from the local prototype with scripts/capture-evidence.mjs.\n` +
      `export const evidence = ${JSON.stringify(images, null, 2)} as const;\n`,
  );
  console.log(`Captured ${Object.keys(entries).length} screenshots.`);
} finally {
  await browser.close();
}
