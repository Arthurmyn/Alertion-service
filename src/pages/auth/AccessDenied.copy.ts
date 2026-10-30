export const deniedTitle = 'Нет доступа';

export function deniedLead(ownerName: string): string {
  return `Вы вошли как ${ownerName}`;
}

export const deniedBody =
  'Этот сайт принадлежит другому аккаунту. Симуляция: данные управления здесь не показываются.';

export function ownSiteLink(businessName: string): string {
  return `К своему сайту «${businessName}»`;
}
