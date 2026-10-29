import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseline } from '../../data/accounts.ts';
import { LIMITS } from '../../data/limits.ts';
import { EMPTY_SLOT_LABEL, evidenceSlots } from '../../data/sprintEvidence.ts';
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
    expect(html).not.toContain('Запустить демо');
    expect(html).not.toContain('href="/manage/');
    expect(html).toContain('>Подготовить файлы</a>');
    expect(html).toContain('>Вернуть версию</a>');
    expect(html).toContain('Preview and explicit publish');
    expect(html).toContain('12 ч, из них 2 ч в спринте 1, 10 ч в спринте 2');
    expect(html).toContain('Демо-материал');
    expect(html).not.toContain('>3. Демо');
    expect(html).not.toContain('>5. Результаты');
    expect(html).not.toContain('>6. Цели');
    expect(html).not.toContain('>7. Невыполненные');
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
    expect(html.split(EMPTY_SLOT_LABEL).length - 1).toBe(evidenceSlots.length);
    expect(html).toContain('s1-B1-public-private');
    expect(html).toContain('s3-B8-sprint-record');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('пройдено');
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
