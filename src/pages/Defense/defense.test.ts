import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseline } from '../../data/accounts.ts';
import { LIMITS } from '../../data/limits.ts';
import {
  goals,
  results,
  scenarioHref,
  scopeNote,
  scopeVolumeNote,
  SCREENSHOT_EMPTY,
  unmetRows,
} from '../../data/results.ts';
import { EMPTY_SLOT_LABEL, evidenceSlots } from '../../data/sprintEvidence.ts';
import { memberShort } from '../../data/team.ts';
import { reducer } from '../../state/reducer.ts';
import { StoreProvider, writeSession } from '../../state/store.tsx';
import { Defense } from './Defense.tsx';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

function renderDefense(account?: 'a' | 'b'): string {
  const storage = memoryStorage();
  if (account) {
    writeSession(
      storage,
      reducer(baseline, { type: 'signIn', accountId: account }),
    );
  }
  vi.stubGlobal('sessionStorage', storage);
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/defense'] },
      createElement(StoreProvider, null, createElement(Defense)),
    ),
  );
}

describe('defense page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the goal, the path, item status and the prototype boundary', () => {
    const html = renderDefense();
    expect(html).toContain('<h1>Защита проекта</h1>');
    expect(html).toContain('1. Цель проекта');
    expect(html).toContain('2. Путь пользователя');
    expect(html).toContain('4. Статус B1–B8');
    expect(html).toContain('14. Границы прототипа');
    expect(html).toContain('Birlik Koshan');
    expect(html).toContain('Alikhan Nurzhan');
    expect(html).toContain('Arthur Jaxygaliyev');
    expect(html).toContain('Arlan Tulegenov');
    expect(html).toContain('Berdibek Amir');
    expect(html).toContain('Zhansaya Shinbergenova');
    expect(html).toContain('28.10.2026');
    expect(html).toContain('17.11.2026');
    expect(html).toContain(`>${LIMITS.sites}<`);
    expect(html).toContain(`>${LIMITS.archiveMb}<`);
    expect(html).toContain(`>${LIMITS.unpackedMb}<`);
    expect(html).toContain(`>${LIMITS.storageMb}<`);
    expect(html).toContain(
      'Публикация, адрес сайта, DNS, HTTPS, вход и проверка архивов имитируются в браузере.',
    );
    expect(html).toContain(
      'Отказ в доступе чужому аккаунту тоже имитация: настоящая изоляция аккаунтов, хостинг и сервер в прототип не входят.',
    );
    expect(html).toContain('id="demo"');
    expect(html).toContain('>3. Демо');
    expect(html).toContain('Запустить демо');
    expect(html).toContain('scenario=b-opens-a');
    expect(html).toContain('scenario=publish-fail');
    expect(html).toContain('scenario=domain-pending');
    expect(html).toContain('scenario=reject-archive-size');
    expect(html).toContain('scenario=rollback-fail');
    expect(html).toContain('>Открыть</a>');
    const manageHrefs = [...html.matchAll(/href="(\/manage\/[^"]*)"/g)].map(
      (match) => match[1] ?? '',
    );
    expect(manageHrefs.length).toBeGreaterThan(0);
    expect(manageHrefs.every((href) => href.includes('?scenario='))).toBe(true);
    expect(html).toContain('>Подготовить файлы</a>');
    expect(html).toContain('>Вернуть версию</a>');
    expect(html).toContain('Preview and explicit publish');
    expect(html).toContain('12 ч, из них 2 ч в спринте 1, 10 ч в спринте 2');
    expect(html).toContain(
      'План: 12 ч, из них 2 ч в спринте 1, 10 ч в спринте 2',
    );
    expect(html).toContain('aria-label="Содержание"');
    expect(html.indexOf('Гипотетический отзыв заказчика')).toBeLessThan(
      html.indexOf('Залила новое меню'),
    );
    expect(html).toContain('План, рабочие часы');
    expect(html).toContain('План, часы по людям');
    expect(html).not.toContain('Фактические часы');
    expect(html).toContain('Демо-материал');
    expect(html).toContain('>3. Демо');
    expect(html).toContain('5. Результаты сценариев');
    expect(html).toContain('6. Цели G1–G5');
    expect(html).toContain('7. Невыполненные и непроверяемые критерии');
  });

  it('shows plan, team and empty evidence slots', () => {
    const html = renderDefense();
    expect(html).toContain('8. План и симуляция');
    expect(html).toContain('9. Сгорание и скорость');
    expect(html).toContain('10. Обратная связь');
    expect(html).toContain('11. Ретроспектива и выводы');
    expect(html).toContain('12. Роли');
    expect(html).toContain('13. Журнал доказательств');
    expect(html).toContain('id="evidence-log"');
    expect(html).toContain('Гипотетический отзыв заказчика');
    expect(html).toContain('>симуляция<');
    expect(html).toContain('>план<');
    expect(html).toContain('26 story points');
    expect(html).toContain('рабочих часах');
    expect(html.match(/<svg\b/g)).toHaveLength(3);
    const evidenceHtml = html.slice(
      html.indexOf('id="evidence-log"'),
      html.indexOf('id="boundaries"'),
    );
    expect(evidenceHtml.split(EMPTY_SLOT_LABEL).length - 1).toBe(
      evidenceSlots.length,
    );
    expect(html).toContain('s1-B1-public-private');
    expect(html).toContain('s3-B8-sprint-record');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('пройдено');
  });

  it('links every result to a scenario and marks the goals', () => {
    const html = renderDefense();
    const goalsHtml = html.slice(
      html.indexOf('id="goals"'),
      html.indexOf('id="unmet"'),
    );
    const unmetHtml = html.slice(
      html.indexOf('id="unmet"'),
      html.indexOf('id="plan"'),
    );

    expect(html.indexOf('id="results"')).toBeGreaterThan(
      html.indexOf('id="status"'),
    );
    expect(html.indexOf('id="goals"')).toBeGreaterThan(
      html.indexOf('id="results"'),
    );
    expect(html.indexOf('id="unmet"')).toBeGreaterThan(
      html.indexOf('id="goals"'),
    );
    expect(html.indexOf('id="plan"')).toBeGreaterThan(
      html.indexOf('id="unmet"'),
    );

    for (const item of results) {
      expect(html).toContain(item.id);
      expect(html).toContain(item.quote.replaceAll("'", '&#x27;'));
      for (const id of item.scenarioIds) {
        expect(html).toContain(`href="${scenarioHref(id)}"`);
      }
      if (item.href) expect(html).toContain(`href="${item.href}"`);
      expect(item.screenshot).toBeNull();
    }
    expect(html.split(SCREENSHOT_EMPTY).length - 1).toBe(results.length);
    expect(html).not.toContain('<img');

    expect(goalsHtml).toContain(scopeNote);
    expect(goalsHtml).toContain(scopeVolumeNote);
    expect(goalsHtml).toContain('Лист наблюдений');
    expect(goalsHtml).toContain('проверено в прототипе');
    expect(goalsHtml).toContain('e2e/b3-g2.spec.ts');
    expect(goalsHtml).toContain('e2e/b4-g2.spec.ts');
    expect(goalsHtml).toContain('e2e/b1-g3-access.spec.ts');
    expect(goalsHtml).toContain('e2e/b2-g3.spec.ts');
    expect(goalsHtml).toContain('e2e/b5-g4.spec.ts');
    expect(html).toContain('сдвиньте её вбок');
    for (const goal of goals) {
      expect(goalsHtml).toContain(goal.id);
      expect(goalsHtml).toContain(goal.quote);
      expect(goalsHtml).toContain(goal.mark);
      if (goal.scenarioId) {
        expect(goalsHtml).toContain(`href="${scenarioHref(goal.scenarioId)}"`);
      }
    }
    for (const name of memberShort) {
      expect(goalsHtml).toContain(`>${name}<`);
    }
    expect(goalsHtml).toContain(EMPTY_SLOT_LABEL);

    expect(unmetHtml).toContain('B8-AC3');
    expect(unmetHtml).toContain('не выполнено');
    expect(unmetHtml).toContain('4.2');
    expect(unmetHtml).toMatch(/ревью/);
    expect(unmetHtml).toMatch(/час/);
    expect(unmetHtml).toMatch(/рол/);
    expect(unmetHtml).toMatch(/IEEE|оформлен/);
    expect(unmetHtml).toMatch(/реч|выступлен/);
    expect(unmetRows.map((item) => item.title)).toContain('Ротация ролей');
  });

  it('opens the signed-in path on that account’s screens', () => {
    const html = renderDefense('b');
    expect(html).toContain('href="/manage/temir/upload"');
    expect(html).toContain('href="/manage/temir/preview"');
    expect(html).toContain('href="/manage/temir/versions"');
    expect(html).toContain('href="/manage/nan/upload"');
    expect(html).not.toContain('>Вход</a>');
  });
});
