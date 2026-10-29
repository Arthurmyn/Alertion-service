import { accounts } from './accounts.ts';
import type { SprintNumber } from './backlogItems.ts';
import { sprintNumbers } from './metrics.ts';

export const SIMULATION_LABEL = 'симуляция';
export const CUSTOMER_REVIEW_LABEL = 'Гипотетический отзыв заказчика';

export const productOwner = {
  name: 'Birlik Koshan',
  role: 'Product Owner',
} as const;

export const scrumMaster = {
  name: 'Alikhan Nurzhan',
  role: 'Scrum Master',
} as const;

export const developers = [
  { name: 'Arthur Jaxygaliyev', role: 'Developer' },
  { name: 'Arlan Tulegenov', role: 'Developer' },
  { name: 'Berdibek Amir', role: 'Developer' },
] as const;

export const roleSprints = sprintNumbers;

export const memberShort = [
  'Birlik',
  'Alikhan',
  'Arthur',
  'Arlan',
  'Berdibek',
] as const;

export type MemberShort = (typeof memberShort)[number];
export type WorkPart = 'author' | 'reviewer';

export interface WorkRow {
  sprint: SprintNumber;
  item: 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8';
  work: string;
  activity: string;
  member: MemberShort;
  hours: number;
  part: WorkPart;
}

function row(
  sprint: SprintNumber,
  item: WorkRow['item'],
  task: string,
  activity: string,
  member: MemberShort,
  hours: number,
  part: WorkPart,
): WorkRow {
  return { sprint, item, work: task, activity, member, hours, part };
}

export const workRows: readonly WorkRow[] = [
  row(1, 'B1', 'Правила владения', 'Черновик', 'Birlik', 2, 'author'),
  row(1, 'B1', 'Экраны', 'Сборка', 'Arthur', 5, 'author'),
  row(1, 'B1', 'Проверка доступа', 'Ревью', 'Alikhan', 2, 'reviewer'),
  row(1, 'B1', 'Проверка доступа', 'Ревью', 'Berdibek', 1, 'reviewer'),
  row(1, 'B2', 'Случаи загрузки', 'Подготовка', 'Birlik', 3, 'author'),
  row(1, 'B2', 'Случаи загрузки', 'Описание', 'Arthur', 1, 'author'),
  row(1, 'B2', 'Поток загрузки', 'Сборка', 'Arlan', 6, 'author'),
  row(1, 'B2', 'Поток загрузки', 'Оставшаяся часть', 'Berdibek', 2, 'author'),
  row(1, 'B2', 'Поток загрузки', 'Ревью', 'Alikhan', 3, 'reviewer'),
  row(1, 'B2', 'Поток загрузки', 'Ревью', 'Berdibek', 3, 'reviewer'),
  row(1, 'B3', 'Правила перехода', 'Черновик', 'Birlik', 1, 'author'),
  row(1, 'B3', 'Правила перехода', 'Дополнение', 'Alikhan', 1, 'author'),
  row(2, 'B3', 'Переходы', 'Завершение', 'Arthur', 1, 'author'),
  row(2, 'B3', 'Экраны', 'Сборка', 'Birlik', 6, 'author'),
  row(2, 'B3', 'Экраны', 'Ревью', 'Arlan', 3, 'reviewer'),
  row(2, 'B4', 'Случаи истории', 'Описание', 'Arthur', 2, 'author'),
  row(2, 'B4', 'Экраны', 'Сборка', 'Alikhan', 5, 'author'),
  row(2, 'B4', 'Экраны', 'Ревью', 'Berdibek', 3, 'reviewer'),
  row(2, 'B5', 'Инструкции', 'Черновик', 'Arthur', 3, 'author'),
  row(2, 'B5', 'Состояния', 'Описание', 'Alikhan', 1, 'author'),
  row(2, 'B5', 'Состояния', 'Остальные состояния', 'Berdibek', 3, 'author'),
  row(2, 'B5', 'Состояния', 'Ревью', 'Arlan', 3, 'reviewer'),
  row(3, 'B6', 'Данные', 'Описание', 'Berdibek', 2, 'author'),
  row(3, 'B6', 'Панель', 'Сборка', 'Arthur', 4, 'author'),
  row(3, 'B6', 'Панель', 'Ревью', 'Alikhan', 2, 'reviewer'),
  row(3, 'B7', 'Текст', 'Написание', 'Berdibek', 2, 'author'),
  row(3, 'B7', 'Ссылки', 'Сборка', 'Arthur', 1, 'author'),
  row(3, 'B7', 'Ссылки', 'Сборка', 'Alikhan', 1, 'author'),
  row(3, 'B7', 'Ссылки', 'Ревью чужой части', 'Berdibek', 1, 'reviewer'),
  row(3, 'B7', 'Ссылки', 'Ревью чужой части', 'Arlan', 1, 'reviewer'),
  row(3, 'B8', 'Записи', 'Сверка', 'Birlik', 4, 'author'),
  row(3, 'B8', 'Записи', 'Сводка', 'Birlik', 1, 'author'),
  row(3, 'B8', 'Записи', 'Сводка', 'Alikhan', 2, 'author'),
  row(3, 'B8', 'Записи', 'Сводка', 'Arlan', 4, 'author'),
  row(3, 'B8', 'Обход', 'Участие', 'Birlik', 1, 'reviewer'),
  row(3, 'B8', 'Обход', 'Участие', 'Alikhan', 1, 'reviewer'),
  row(3, 'B8', 'Обход', 'Участие', 'Arthur', 1, 'reviewer'),
  row(3, 'B8', 'Обход', 'Участие', 'Arlan', 1, 'reviewer'),
  row(3, 'B8', 'Обход', 'Участие', 'Berdibek', 1, 'reviewer'),
];

export function partLabel(part: WorkPart): string {
  return part === 'author' ? 'автор' : 'проверяющий';
}

export function hoursFor(member: MemberShort, sprint: SprintNumber): number {
  return workRows
    .filter((row) => row.member === member && row.sprint === sprint)
    .reduce((sum, row) => sum + row.hours, 0);
}

export function sprintPackageHours(sprint: SprintNumber): number {
  return workRows
    .filter((row) => row.sprint === sprint)
    .reduce((sum, row) => sum + row.hours, 0);
}

function ownerRole(id: 'a' | 'b'): string {
  const account = accounts.find((item) => item.id === id);
  if (!account) throw new Error(`missing account ${id}`);
  return `${account.ownerName}, ${account.businessName}`;
}

export const customerNotes = [
  {
    role: ownerRole('a'),
    text: 'Залила новое меню и сначала решила, что публикация уже прошла: на сайте оставался только баурсак. Круассан появился после отдельного подтверждения. Так я хотя бы не отправлю гостям неготовое меню.',
  },
  {
    role: ownerRole('b'),
    text: 'Откат был выключен. На экране написано, что предыдущей версии нет. Мне не пришлось тыкать в кнопку и гадать.',
  },
] as const;

export const retroNotes = [
  {
    heading: 'Что вышло',
    text: 'Правило активной версии стоит раньше экранов загрузки. 2 часа B3 в спринте 1: Birlik Koshan и Alikhan Nurzhan, по 1 часу.',
  },
  {
    heading: 'Что не вышло',
    text: 'Сводка показывает B3 в спринте 2 и молчит про 2 часа в спринте 1. Это легко пропустить.',
  },
  {
    heading: 'Дальше',
    text: 'Alikhan Nurzhan на планировании спринта 2 проговаривает остаток B3: 10 часов. Экраны у Birlik Koshan, проверка у Arlan Tulegenov.',
  },
] as const;

export const reviewNotes = [
  'Спринт 1. Berdibek проверяет вклад Arlan в B2, Alikhan проверяет вклад Berdibek в B2. Arthur заканчивает переходы B3 в спринте 2.',
  'Спринт 3. Berdibek и Arlan проверяют части B7, которые делали другие. Час обхода B8 у каждого входит в сверку.',
] as const;
