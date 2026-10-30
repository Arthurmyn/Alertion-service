import { describe, expect, it } from 'vitest';
import { LIMITS } from '../data/limits.ts';
import { developers, productOwner, scrumMaster } from '../data/team.ts';
import {
  appDefense,
  appHome,
  appLogin,
  appSecurity,
  features,
  navLinks,
  path,
  planFacts,
  steps,
  team,
} from './content.ts';

describe('landing content', () => {
  it('sends every service link under /app', () => {
    for (const href of [appHome, appLogin, appDefense, appSecurity]) {
      expect(href === '/app' || href.startsWith('/app/'), href).toBe(true);
    }
  });

  it('anchors the navigation to sections that exist', () => {
    expect(navLinks.map((link) => link.href)).toEqual([
      '#how',
      '#features',
      '#verify',
      '#team',
    ]);
  });

  it('states the pilot plan from the same limits the service enforces', () => {
    expect(planFacts.join(' ')).toContain(`${LIMITS.archiveMb} МБ`);
    expect(planFacts.join(' ')).toContain(`${LIMITS.unpackedMb} МБ`);
    expect(planFacts.join(' ')).toContain(`${LIMITS.storageMb} МБ`);
    expect(features[0]?.points.join(' ')).toContain(`${LIMITS.archiveMb} МБ`);
  });

  it('walks the five steps of the service path', () => {
    expect(steps.map((step) => step.title)).toEqual([
      'Загрузить архив',
      'Проверить',
      'Посмотреть предпросмотр',
      'Опубликовать',
      'Откатить',
    ]);
  });

  it('never presents verification as done', () => {
    const ready = path.filter((item) => item.level === 'full');
    expect(ready.map((item) => item.step)).toEqual(['Развернуть']);
    expect(path.find((item) => item.step === 'Проверить')?.state).toBe(
      'Недоступно',
    );
    expect(path.find((item) => item.step === 'Аттестовать')?.state).toBe(
      'Недоступно',
    );
  });

  it('names the team from the project data', () => {
    const names = team.flatMap((row) => row.names);
    expect(names).toContain(productOwner.name);
    expect(names).toContain(scrumMaster.name);
    for (const developer of developers) expect(names).toContain(developer.name);
  });

  it('points every screenshot at a file under /landing', () => {
    for (const feature of features) {
      expect(feature.image.startsWith('/landing/shots/')).toBe(true);
      expect(feature.alt.length).toBeGreaterThan(20);
    }
  });
});
