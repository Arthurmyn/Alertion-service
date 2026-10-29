import { describe, expect, it } from 'vitest';
import { scenarios } from './scenarios.ts';
import { scenarioQueryRoute } from '../state/store.tsx';
import {
  goals,
  results,
  scenarioHref,
  scopeNote,
  unmetRows,
} from './results.ts';

const quotes: Record<string, string> = {
  'B1-AC1':
    'Public website content and private management data are clearly distinguished.',
  'B1-AC2': "Account B is denied access to account A's management screens.",
  'B2-AC1': 'A valid upload reaches the example URL.',
  'B2-AC2':
    'A missing entry page, unsafe path or oversized upload produces a clear rejection message.',
  'B2-AC5': 'A failed upload keeps the active version unchanged.',
  'B3-AC1': 'Previewing B leaves A active.',
  'B3-AC2':
    'Confirmation makes B active, while a failed publication keeps A active.',
  'B3-AC4': 'The preview screen explains who can view it.',
  'B4-AC1': 'Rolling back after publishing B restores A.',
  'B4-AC2':
    'With no history available, rollback is disabled and the screen explains why.',
  'B4-AC3': 'A failed rollback preserves the current version label.',
  'B5-AC1': 'Domain-control verification comes before activation.',
  'B5-AC2':
    'Pending and failed states have different explanations, and domain/certificate values are clearly marked as examples.',
  'B5-AC4':
    'Section 3.2 describes the smaller version if scope needs to change.',
  'B6-AC1':
    'The active version, example URL, deployment state, domain state and storage match the scenario.',
  'B6-AC6': 'If domain work is deferred, the dashboard labels it unavailable.',
  'B7-AC1': 'Plan, upload and dashboard values agree.',
  'B7-AC2':
    'The rejection message explains which limit was exceeded and what the owner can do next.',
};

const ids = (prefix: string) =>
  scenarios.map((item) => item.id).filter((id) => id.startsWith(prefix));

describe('result registry', () => {
  it('quotes the backlog criteria and points at real scenarios', () => {
    expect(results.map((item) => item.id)).toEqual([
      'B1-AC1',
      'B1-AC2',
      'B2-AC1',
      'B2-AC2',
      'B2-AC3',
      'B2-AC4',
      'B2-AC5',
      'B3-AC1',
      'B3-AC2',
      'B3-AC3',
      'B3-AC4',
      'B4-AC1',
      'B4-AC2',
      'B4-AC3',
      'B5-AC1',
      'B5-AC2',
      'B5-AC3',
      'B5-AC4',
      'B6-AC1',
      'B6-AC2',
      'B6-AC3',
      'B6-AC4',
      'B6-AC5',
      'B6-AC6',
      'B7-AC1',
      'B7-AC2',
    ]);

    for (const item of results) {
      expect(item.screenshot.alt.length).toBeGreaterThan(0);
      expect(item.screenshot.src).toMatch(/^\/evidence\/[a-z0-9-]+\.png$/);
      expect(item.screenshot.width).toBeGreaterThan(0);
      expect(item.screenshot.height).toBeGreaterThan(0);
      expect(item.shown.length).toBeGreaterThan(0);
      if (quotes[item.id]) expect(item.quote).toBe(quotes[item.id]);
      for (const id of item.scenarioIds) {
        const scenario = scenarios.find((entry) => entry.id === id);
        expect(scenario, id).toBeDefined();
        const href = scenarioHref(id);
        expect(href).toBe(`${scenario?.route}?scenario=${id}`);
        const query = href.slice(href.indexOf('?'));
        expect(scenarioQueryRoute(query, '/defense')).toBe(scenario?.route);
      }
    }

    const byId = (id: string) => results.find((item) => item.id === id);
    expect(byId('B2-AC3')?.quote).toBe(byId('B2-AC2')?.quote);
    expect(byId('B2-AC4')?.quote).toBe(byId('B2-AC2')?.quote);
    expect(byId('B2-AC4')?.scenarioIds).toEqual([
      'reject-archive-size',
      'reject-unpacked-size',
      'reject-storage',
    ]);
    expect(byId('B2-AC5')?.scenarioIds).toEqual(ids('reject-'));
    expect(byId('B4-AC2')?.scenarioIds).toEqual(['rollback-none', 'b-home']);
    expect(byId('B5-AC1')?.scenarioIds).toEqual([
      'domain-pending',
      'domain-active',
    ]);
    expect(byId('B5-AC3')?.scenarioIds).toEqual(ids('domain-'));
    expect(byId('B5-AC4')?.scenarioIds).toEqual([]);
    expect(byId('B5-AC4')?.href).toBe('/defense#goals');
    expect(byId('B6-AC1')?.scenarioIds).toEqual(
      scenarios.map((item) => item.id),
    );
    expect(byId('B6-AC3')?.scenarioIds).toEqual([
      ...ids('publish-'),
      ...ids('rollback-'),
    ]);
    expect(byId('B6-AC5')?.shown).toContain('Пекарня Нан');
    expect(byId('B6-AC5')?.shown).toContain('Мастерская Темир');
    expect(byId('B6-AC5')?.shown).toContain('Публикация прошла');
    expect(byId('B2-AC4')?.shown).toContain('МБ');
    expect(byId('B2-AC4')?.shown).toContain('Распакованная версия');
    expect(byId('B2-AC4')?.shown).not.toContain('больше лимита');
    expect(byId('B2-AC5')?.shown).toContain(
      'Активная версия не изменилась: A.',
    );
    expect(byId('B2-AC5')?.shown).toContain(
      'Активная версия не изменилась: D.',
    );
    expect(byId('B4-AC2')?.shown).toContain(
      'Откат недоступен: предыдущей версии нет.',
    );
    expect(byId('B4-AC3')?.shown).toContain(
      'Откат не прошёл. Активная версия: B.',
    );
    expect(byId('B3-AC3')?.shown).toContain(
      'Публикация не прошла. Активная версия: A.',
    );
    expect(byId('B5-AC2')?.shown).toContain('Запись TXT ещё не видна.');
    expect(byId('B5-AC2')?.shown).toContain('Значение TXT не совпадает.');
    expect(byId('B5-AC3')?.shown).toContain('пример');
    expect(byId('B5-AC3')?.shown).not.toContain('зоне');
    expect(byId('B6-AC6')?.shown).toContain(
      'Домен: недоступно в этой версии прототипа',
    );
  });

  it('marks G2–G4 in the prototype and leaves G1 and G5 deferred', () => {
    expect(goals.map((goal) => [goal.id, goal.mark, goal.scenarioId])).toEqual([
      ['G1', 'отложено', null],
      ['G2', 'выполнено', 'rollback-ok'],
      ['G3', 'выполнено', 'reject-unsafe-path'],
      ['G4', 'выполнено', 'domain-active'],
      ['G5', 'отложено', null],
    ]);
    expect(scopeNote).toBe(
      'B5 не сокращали; сокращённый вариант из §3.2 не понадобился',
    );
    for (const goal of goals) {
      if (goal.mark === 'выполнено') {
        expect(goal.reason).toBe('проверено в прототипе');
        expect(goal.scenarioId).toBeTruthy();
        expect(goal.spec).toBeTruthy();
      } else {
        expect(goal.spec).toBeNull();
      }
      expect(goal.quote.length).toBeGreaterThan(0);
      expect(goal.decision.length).toBeGreaterThan(0);
    }
    expect(goals.find((goal) => goal.id === 'G2')?.spec).toBe(
      'e2e/b3-g2.spec.ts и e2e/b4-g2.spec.ts',
    );
    expect(goals.find((goal) => goal.id === 'G3')?.spec).toBe(
      'e2e/b1-g3-access.spec.ts и e2e/b2-g3.spec.ts',
    );
    expect(goals.find((goal) => goal.id === 'G4')?.spec).toBe(
      'e2e/b5-g4.spec.ts',
    );
    expect(goals[0]?.quote.startsWith('at least four of five')).toBe(true);
    expect(goals[3]?.quote).toContain('If we reduce the scope');
  });

  it('records role rotation as unmet because section 4.2 fixes the roles', () => {
    const rotation = unmetRows.find((item) => item.title === 'Ротация ролей');
    expect(rotation?.mark).toBe('не выполнено');
    expect(rotation?.detail).toContain('4.2');
    expect(unmetRows.map((item) => item.title)).toContain('B8-AC3');
  });
});
