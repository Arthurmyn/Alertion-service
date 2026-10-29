import { test } from '@playwright/test';
import {
  activeMenu,
  candidateOnly,
  expectCandidatePreview,
  expectNoCandidatePreview,
  expectPublicMenu,
  openScenario,
  signInAsOwner,
} from './b3-helpers.ts';

test('B3-AC1 previewing B leaves A active', async ({ page }) => {
  await signInAsOwner(page);
  await expectNoCandidatePreview(page);
  await expectPublicMenu(page, activeMenu, candidateOnly);

  await openScenario(page, 'preview-b');
  await expectCandidatePreview(page);
  await expectPublicMenu(page, activeMenu, candidateOnly);
});
