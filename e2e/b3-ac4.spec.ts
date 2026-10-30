import { expect, test } from '@playwright/test';
import {
  expectCandidatePreview,
  openScenario,
  previewAudience,
} from './support/b3-helpers.ts';

test('B3-AC4 the preview screen explains who can view it', async ({ page }) => {
  await openScenario(page, 'preview-b');
  await expectCandidatePreview(page);
  await expect(page.getByRole('main')).toContainText(previewAudience);
});
