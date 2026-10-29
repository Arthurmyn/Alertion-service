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
