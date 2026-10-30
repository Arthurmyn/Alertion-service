import { describe, expect, it } from 'vitest';
import { LIMITS } from '../data/limits.ts';
import { developers, productOwner, scrumMaster } from '../data/team.ts';
import {
  anchors,
  appDefense,
  appHome,
  appLogin,
  appSecurity,
  copy,
  locales,
} from './content.ts';

describe('landing content', () => {
  it('sends every service link under /app', () => {
    for (const href of [appHome, appLogin, appDefense, appSecurity]) {
      expect(href === '/app' || href.startsWith('/app/'), href).toBe(true);
    }
  });

  it('anchors the navigation to sections that exist', () => {
    expect(anchors).toEqual(['#how', '#features', '#verify', '#team']);
    for (const locale of locales) {
      expect(copy[locale].nav).toHaveLength(anchors.length);
    }
  });

  it('offers Russian and English with the same structure', () => {
    expect(locales).toEqual(['ru', 'en']);
    const shape = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(shape)
        : value && typeof value === 'object'
          ? Object.fromEntries(
              Object.entries(value).map(([key, item]) => [key, shape(item)]),
            )
          : typeof value;
    expect(shape(copy.en)).toEqual(shape(copy.ru));
  });

  it('keeps em dashes out of the copy in both languages', () => {
    for (const locale of locales) {
      expect(JSON.stringify(copy[locale])).not.toContain(
        String.fromCharCode(0x2014),
      );
    }
  });

  it('states the pilot plan from the same limits the service enforces', () => {
    for (const [locale, unit] of [
      ['ru', 'МБ'],
      ['en', 'MB'],
    ] as const) {
      const facts = copy[locale].planFacts.join(' ');
      expect(facts).toContain(`${LIMITS.archiveMb} ${unit}`);
      expect(facts).toContain(`${LIMITS.unpackedMb} ${unit}`);
      expect(facts).toContain(`${LIMITS.storageMb} ${unit}`);
      expect(copy[locale].features.items[0]?.points.join(' ')).toContain(
        `${LIMITS.archiveMb} ${unit}`,
      );
    }
  });

  it('walks the five steps of the service path', () => {
    expect(copy.ru.how.steps.map((step) => step.title)).toEqual([
      'Загрузить архив',
      'Проверить',
      'Посмотреть предпросмотр',
      'Опубликовать',
      'Откатить',
    ]);
    expect(copy.en.how.steps).toHaveLength(5);
  });

  it('never presents verification as done', () => {
    for (const locale of locales) {
      const path = copy[locale].verify.path;
      const ready = path.filter((item) => item.level === 'full');
      expect(ready).toHaveLength(1);
      expect(path.filter((item) => item.level === 'none')).toHaveLength(3);
    }
    expect(copy.ru.verify.path[4]?.state).toBe('Недоступно');
    expect(copy.en.verify.path[4]?.state).toBe('Unavailable');
  });

  it('shows an archive check that stops at its first failure', () => {
    for (const locale of locales) {
      const states = copy[locale].checks.rows.map((row) => row.state);
      expect(states).toEqual(['pass', 'fail', 'skipped', 'skipped', 'skipped']);
    }
  });

  it('names the team from the project data', () => {
    for (const locale of locales) {
      const names = copy[locale].team.rows.flatMap((row) => row.names);
      expect(names).toContain(productOwner.name);
      expect(names).toContain(scrumMaster.name);
      for (const developer of developers) {
        expect(names).toContain(developer.name);
      }
    }
  });
});
