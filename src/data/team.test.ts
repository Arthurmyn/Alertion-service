import { describe, expect, it } from 'vitest';
import {
  customerNotes,
  CUSTOMER_REVIEW_LABEL,
  developers,
  hoursFor,
  memberShort,
  productOwner,
  retroNotes,
  reviewNotes,
  roleSprints,
  scrumMaster,
  SIMULATION_LABEL,
  sprintPackageHours,
  workRows,
} from './team.ts';

describe('team roles', () => {
  it('keeps the part 1 cover names and fixed scrum roles', () => {
    expect(productOwner).toEqual({
      name: 'Birlik Koshan',
      role: 'Product Owner',
    });
    expect(scrumMaster).toEqual({
      name: 'Alikhan Nurzhan',
      role: 'Scrum Master',
    });
    expect(developers.map((person) => person.name)).toEqual([
      'Arthur Jaxygaliyev',
      'Arlan Tulegenov',
      'Berdibek Amir',
    ]);
    expect(developers.every((person) => person.role === 'Developer')).toBe(
      true,
    );
    expect(roleSprints).toEqual([1, 2, 3]);
  });

  it('gives each member 6 hours in every sprint', () => {
    for (const sprint of roleSprints) {
      expect(sprintPackageHours(sprint)).toBe(30);
      for (const member of memberShort) {
        expect(hoursFor(member, sprint)).toBe(6);
      }
    }
  });

  it('matches the sprint 1 and sprint 2 author split for B3', () => {
    expect(
      workRows
        .filter((row) => row.item === 'B3' && row.sprint === 1)
        .map((row) => [row.member, row.hours, row.part]),
    ).toEqual([
      ['Birlik', 1, 'author'],
      ['Alikhan', 1, 'author'],
    ]);
    expect(
      workRows.find(
        (row) =>
          row.item === 'B3' && row.sprint === 2 && row.member === 'Arthur',
      )?.hours,
    ).toBe(1);
    expect(reviewNotes[0]).toContain('Berdibek проверяет вклад Arlan');
    expect(reviewNotes[0]).toContain('Alikhan проверяет вклад Berdibek');
  });
});

describe('simulated team notes', () => {
  it('labels feedback and names the retrospective owner', () => {
    expect(CUSTOMER_REVIEW_LABEL).toBe('Гипотетический отзыв заказчика');
    expect(SIMULATION_LABEL).toBe('симуляция');
    expect(customerNotes.map((note) => note.role)).toEqual([
      'Айгуль С., Пекарня Нан',
      'Ерлан Б., Мастерская Темир',
    ]);
    expect(customerNotes.every((note) => !('avatar' in note))).toBe(true);
    expect(customerNotes.every((note) => !('rating' in note))).toBe(true);
    expect(retroNotes.map((note) => note.heading)).toEqual([
      'Что вышло',
      'Что не вышло',
      'Дальше',
    ]);
    expect(retroNotes[2]?.text).toContain('Alikhan Nurzhan');
  });
});
