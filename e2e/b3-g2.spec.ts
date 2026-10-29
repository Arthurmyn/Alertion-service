import { test } from '@playwright/test';
import {
  activeMenu,
  candidateLabel,
  candidateMenu,
  candidateOnly,
  confirmPublish,
  expectCandidatePreview,
  expectDashboardActive,
  expectFailedPublication,
  expectPublicMenu,
  openScenario,
} from './b3-helpers.ts';

test('G2 preview with A still active, confirmed publication of B, failed publication keeps the label', async ({
  page,
}) => {
  await openScenario(page, 'preview-b');
  await expectCandidatePreview(page);
  await expectPublicMenu(page, activeMenu, candidateOnly);

  await confirmPublish(page);
  await expectDashboardActive(page, candidateLabel);
  await expectPublicMenu(page, candidateMenu, []);

  await openScenario(page, 'publish-fail');
  await expectFailedPublication(page);
  await expectPublicMenu(page, activeMenu, candidateOnly);
});
