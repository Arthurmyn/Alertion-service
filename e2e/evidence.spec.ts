import { expect, test } from '@playwright/test';
import { results } from '../src/data/results.ts';

test('each result loads its labelled screenshot at the recorded dimensions', async ({
  page,
}) => {
  await page.goto('/app/defense#results');
  const section = page.locator('#results');
  await expect(section.getByRole('img')).toHaveCount(results.length);
  for (const item of results) {
    const image = section.getByRole('img', {
      name: `${item.id}: ${item.screenshot.alt}`,
      exact: true,
    });
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => ({
          width: element.naturalWidth,
          height: element.naturalHeight,
        })),
      )
      .toEqual({
        width: item.screenshot.width,
        height: item.screenshot.height,
      });
    await expect(image.locator('..')).toHaveAttribute(
      'href',
      item.screenshot.src,
    );
  }
});
