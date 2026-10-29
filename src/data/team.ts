import { accounts } from './accounts.ts';
import type { SprintNumber } from './backlogItems.ts';

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

export const roleSprints = [1, 2, 3] as const satisfies readonly SprintNumber[];

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

export const workRows: readonly WorkRow[] = [
  {
    sprint: 1,
    item: 'B1',
    work: 'Правила владения',
    activity: 'Черновик',
    member: 'Birlik',
    hours: 2,
    part: 'author',
  },
  {
    sprint: 1,
    item: 'B1',
    work: 'Экраны',
    activity: 'Сборка',
    member: 'Arthur',
    hours: 5,
    part: 'author',
  },
  {
    sprint: 1,
    item: 'B1',
    work: 'Проверка доступа',
    activity: 'Ревью',
    member: 'Alikhan',
    hours: 2,
    part: 'reviewer',
  },
  {
    sprint: 1,
    item: 'B1',
    work: 'Проверка доступа',
    activity: 'Ревью',
    member: 'Berdibek',
    hours: 1,
    part: 'reviewer',
  },
  {
    sprint: 1,
    item: 'B2',
    work: 'Случаи загрузки',
    activity: 'Подготовка',
    member: 'Birlik',
    hours: 3,
    part: 'author',
  },
  {
    sprint: 1,
    item: 'B2',
    work: 'Случаи загрузки',
    activity: 'Описание',
    member: 'Arthur',
    hours: 1,
    part: 'author',
  },
  {
    sprint: 1,
    item: 'B2',
    work: 'Поток загрузки',
    activity: 'Сборка',
    member: 'Arlan',
    hours: 6,
    part: 'author',
  },
  {
    sprint: 1,
    item: 'B2',
    work: 'Поток загрузки',
    activity: 'Оставшаяся часть',
    member: 'Berdibek',
    hours: 2,
    part: 'author',
  },
  {
    sprint: 1,
    item: 'B2',
    work: 'Поток загрузки',
    activity: 'Ревью',
    member: 'Alikhan',
    hours: 3,
    part: 'reviewer',
  },
  {
    sprint: 1,
    item: 'B2',
    work: 'Поток загрузки',
    activity: 'Ревью',
    member: 'Berdibek',
    hours: 3,
    part: 'reviewer',
  },
  {
    sprint: 1,
    item: 'B3',
    work: 'Правила перехода',
    activity: 'Черновик',
    member: 'Birlik',
    hours: 1,
    part: 'author',
  },
  {
    sprint: 1,
    item: 'B3',
    work: 'Правила перехода',
    activity: 'Дополнение',
    member: 'Alikhan',
    hours: 1,
    part: 'author',
  },
  {
    sprint: 2,
    item: 'B3',
    work: 'Переходы',
    activity: 'Завершение',
    member: 'Arthur',
    hours: 1,
    part: 'author',
  },
  {
    sprint: 2,
    item: 'B3',
    work: 'Экраны',
    activity: 'Сборка',
    member: 'Birlik',
    hours: 6,
    part: 'author',
  },
  {
    sprint: 2,
    item: 'B3',
    work: 'Экраны',
    activity: 'Ревью',
    member: 'Arlan',
    hours: 3,
    part: 'reviewer',
  },
  {
    sprint: 2,
    item: 'B4',
    work: 'Случаи истории',
    activity: 'Описание',
    member: 'Arthur',
    hours: 2,
    part: 'author',
  },
  {
    sprint: 2,
    item: 'B4',
    work: 'Экраны',
    activity: 'Сборка',
    member: 'Alikhan',
    hours: 5,
    part: 'author',
  },
  {
    sprint: 2,
    item: 'B4',
    work: 'Экраны',
    activity: 'Ревью',
    member: 'Berdibek',
    hours: 3,
    part: 'reviewer',
  },
  {
    sprint: 2,
    item: 'B5',
    work: 'Инструкции',
    activity: 'Черновик',
    member: 'Arthur',
    hours: 3,
    part: 'author',
  },
  {
    sprint: 2,
    item: 'B5',
    work: 'Состояния',
    activity: 'Описание',
    member: 'Alikhan',
    hours: 1,
    part: 'author',
  },
  {
    sprint: 2,
    item: 'B5',
    work: 'Состояния',
    activity: 'Остальные состояния',
    member: 'Berdibek',
    hours: 3,
    part: 'author',
  },
  {
    sprint: 2,
    item: 'B5',
    work: 'Состояния',
    activity: 'Ревью',
    member: 'Arlan',
    hours: 3,
    part: 'reviewer',
  },
  {
    sprint: 3,
    item: 'B6',
    work: 'Данные',
    activity: 'Описание',
    member: 'Berdibek',
    hours: 2,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B6',
    work: 'Панель',
    activity: 'Сборка',
    member: 'Arthur',
    hours: 4,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B6',
    work: 'Панель',
    activity: 'Ревью',
    member: 'Alikhan',
    hours: 2,
    part: 'reviewer',
  },
  {
    sprint: 3,
    item: 'B7',
    work: 'Текст',
    activity: 'Написание',
    member: 'Berdibek',
    hours: 2,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B7',
    work: 'Ссылки',
    activity: 'Сборка',
    member: 'Arthur',
    hours: 1,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B7',
    work: 'Ссылки',
    activity: 'Сборка',
    member: 'Alikhan',
    hours: 1,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B7',
    work: 'Ссылки',
    activity: 'Ревью чужой части',
    member: 'Berdibek',
    hours: 1,
    part: 'reviewer',
  },
  {
    sprint: 3,
    item: 'B7',
    work: 'Ссылки',
    activity: 'Ревью чужой части',
    member: 'Arlan',
    hours: 1,
    part: 'reviewer',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Записи',
    activity: 'Сверка',
    member: 'Birlik',
    hours: 4,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Записи',
    activity: 'Сводка',
    member: 'Birlik',
    hours: 1,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Записи',
    activity: 'Сводка',
    member: 'Alikhan',
    hours: 2,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Записи',
    activity: 'Сводка',
    member: 'Arlan',
    hours: 4,
    part: 'author',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Обход',
    activity: 'Участие',
    member: 'Birlik',
    hours: 1,
    part: 'reviewer',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Обход',
    activity: 'Участие',
    member: 'Alikhan',
    hours: 1,
    part: 'reviewer',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Обход',
    activity: 'Участие',
    member: 'Arthur',
    hours: 1,
    part: 'reviewer',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Обход',
    activity: 'Участие',
    member: 'Arlan',
    hours: 1,
    part: 'reviewer',
  },
  {
    sprint: 3,
    item: 'B8',
    work: 'Обход',
    activity: 'Участие',
    member: 'Berdibek',
    hours: 1,
    part: 'reviewer',
  },
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
