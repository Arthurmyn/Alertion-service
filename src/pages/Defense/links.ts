export const sectionTitle = {
  goal: '1. Цель проекта',
  path: '2. Путь пользователя',
  status: '4. Статус B1–B8',
  plan: '8. План и симуляция',
  burndown: '9. Сгорание и скорость',
  feedback: '10. Обратная связь',
  retro: '11. Ретроспектива и выводы',
  roles: '12. Роли',
  'evidence-log': '13. Журнал доказательств',
  boundaries: '14. Границы прототипа',
} as const;

export const defenseOutline = [
  'goal',
  'path',
  'status',
  'plan',
  'burndown',
  'feedback',
  'retro',
  'roles',
  'evidence-log',
  'boundaries',
] as const satisfies readonly (keyof typeof sectionTitle)[];

export const userPath = [
  { label: 'Подготовить файлы', suffix: '/upload' },
  { label: 'Загрузить и проверить', suffix: '/upload' },
  { label: 'Предпросмотр', suffix: '/preview' },
  { label: 'Опубликовать', suffix: '/versions' },
  { label: 'Вернуть версию', suffix: '/versions' },
] as const;

const screenLabels: Record<string, string> = {
  '/login': 'Экран входа',
  '/defense': 'Защита проекта',
  '/manage/nan': 'Управление сайтом',
  '/manage/nan/upload': 'Загрузка',
  '/manage/nan/preview': 'Предпросмотр',
  '/manage/nan/versions': 'Версии',
  '/manage/nan/domain': 'Домен',
  '/manage/nan/plan': 'Пилотный план',
};

export function screenLabel(link: string): string {
  return screenLabels[link] ?? link;
}

export function stepHref(slug: string | null, suffix: string): string {
  if (!slug) return '/login';
  return `/manage/${slug}${suffix}`;
}

export function defenseHref(link: string, signedIn: boolean): string {
  if (!signedIn && link.startsWith('/manage/')) return '/login';
  return link;
}
