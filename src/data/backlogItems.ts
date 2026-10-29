export type SprintNumber = 1 | 2 | 3;

export type BacklogStatus =
  'Реализовано' | 'Показано сценарием' | 'Демо-материал';

export interface BacklogItem {
  id: 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8';
  title: string;
  /** Sprint in which the item finishes. */
  sprint: SprintNumber;
  hoursBySprint: Partial<Record<SprintNumber, number>>;
  status: BacklogStatus;
  link: string;
}

export const backlogItems: readonly BacklogItem[] = [
  {
    id: 'B1',
    title: 'Account boundary scenarios',
    sprint: 1,
    hoursBySprint: { 1: 10 },
    status: 'Реализовано',
    link: '/login',
  },
  {
    id: 'B2',
    title: 'Upload and publish walkthrough',
    sprint: 1,
    hoursBySprint: { 1: 18 },
    status: 'Реализовано',
    link: '/manage/nan/upload',
  },
  {
    id: 'B3',
    title: 'Preview and explicit publish',
    sprint: 2,
    hoursBySprint: { 1: 2, 2: 10 },
    status: 'Реализовано',
    link: '/manage/nan/preview',
  },
  {
    id: 'B4',
    title: 'Previous-version rollback',
    sprint: 2,
    hoursBySprint: { 2: 10 },
    status: 'Реализовано',
    link: '/manage/nan/versions',
  },
  {
    id: 'B5',
    title: 'Domain and HTTPS mock states',
    sprint: 2,
    hoursBySprint: { 2: 10 },
    status: 'Реализовано',
    link: '/manage/nan/domain',
  },
  {
    id: 'B6',
    title: 'Status and storage dashboard',
    sprint: 3,
    hoursBySprint: { 3: 8 },
    status: 'Реализовано',
    link: '/manage/nan',
  },
  {
    id: 'B7',
    title: 'Plan selection and limits',
    sprint: 3,
    hoursBySprint: { 3: 6 },
    status: 'Реализовано',
    link: '/manage/nan/plan',
  },
  {
    id: 'B8',
    title: 'Integrated simulation evidence',
    sprint: 3,
    hoursBySprint: { 3: 16 },
    status: 'Демо-материал',
    link: '/defense',
  },
];

export function workHours(item: BacklogItem): number {
  return Object.values(item.hoursBySprint).reduce<number>(
    (sum, hours) => sum + (hours ?? 0),
    0,
  );
}

export function sprintWorkHours(sprint: SprintNumber): number {
  return backlogItems.reduce(
    (sum, item) => sum + (item.hoursBySprint[sprint] ?? 0),
    0,
  );
}

export function totalWorkHours(): number {
  return backlogItems.reduce((sum, item) => sum + workHours(item), 0);
}
