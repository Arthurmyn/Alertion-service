import { expect, test } from '@playwright/test';
import { mainText, openDomainScenario } from './support/b5-support.ts';

// Screen column: the record is not seen yet, so the owner waits and checks again.
function expectPendingExplanation(text: string): void {
  expect(text).toMatch(/Ожидание/);
  expect(text).toMatch(
    /запис[\p{L}]*[\s\S]{0,80}(ещё не|пока не)|(ещё не|пока не)[\s\S]{0,80}запис/iu,
  );
  expect(text).toMatch(/вид|обнаруж|найден|отсутств/iu);
  expect(text).toMatch(/подожд/iu);
  expect(text).toMatch(/провер/iu);
  expect(text).not.toMatch(/не совпада/iu);
}

// Screen column: the TXT value does not match, so the owner fixes it.
function expectFailedExplanation(text: string): void {
  expect(text).toMatch(/Ошибка/);
  expect(text).toMatch(/TXT/);
  expect(text).toMatch(/не совпада/iu);
  expect(text).toMatch(/исправ/iu);
  expect(text).not.toMatch(/подожд/iu);
  expect(text).not.toMatch(/ещё не вид|пока не вид/iu);
}

test('B5-AC2 pending and failed states have different explanations', async ({
  page,
}) => {
  await openDomainScenario(page, 'domain-pending');
  const pending = await mainText(page);
  expectPendingExplanation(pending);

  await openDomainScenario(page, 'domain-failed');
  const failed = await mainText(page);
  expectFailedExplanation(failed);

  expect(pending).not.toBe(failed);
});
