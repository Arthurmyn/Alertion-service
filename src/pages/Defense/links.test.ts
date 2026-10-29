import { describe, expect, it } from 'vitest';
import { defenseHref, screenLabel, stepHref, userPath } from './links.ts';

describe('defense links', () => {
  it('lists the five steps of the publication path', () => {
    expect(userPath.map((step) => step.label)).toEqual([
      'Подготовить файлы',
      'Загрузить и проверить',
      'Предпросмотр',
      'Опубликовать',
      'Вернуть версию',
    ]);
  });

  it('sends a signed-out visitor to login', () => {
    expect(stepHref(null, '/upload')).toBe('/login');
    expect(stepHref('nan', '/preview')).toBe('/manage/nan/preview');
    expect(stepHref('temir', '/versions')).toBe('/manage/temir/versions');
    expect(defenseHref('/manage/nan/upload', false)).toBe('/login');
    expect(defenseHref('/manage/nan/upload', true)).toBe('/manage/nan/upload');
    expect(defenseHref('/login', false)).toBe('/login');
    expect(defenseHref('/defense', true)).toBe('/defense');
  });

  it('names the login screen without the nav label', () => {
    expect(screenLabel('/login')).toBe('Экран входа');
    expect(screenLabel('/manage/nan')).toBe('Управление сайтом');
  });
});
