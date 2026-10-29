import { expect, test } from '@playwright/test';
import {
  domainScenarios,
  expectActivationLocked,
  expectDomainExamples,
  openDomainScenario,
} from './b5-support.ts';

test('B5-AC3 domain and certificate values are marked as examples', async ({
  page,
}) => {
  for (const scenarioId of domainScenarios) {
    await test.step(scenarioId, async () => {
      await openDomainScenario(page, scenarioId);
      await expectDomainExamples(page);
      if (scenarioId === 'domain-deferred') {
        await expect(
          page.getByText('Недоступно в этой версии прототипа').first(),
        ).toBeVisible();
        await expectActivationLocked(page);
      }
    });
  }
});
