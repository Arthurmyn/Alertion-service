import { LIMITS } from '../data/limits.ts';
import type { AccountId, AppState, Site } from '../state/types.ts';

function countWord(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function ruCount(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  return `${n} ${countWord(n, one, few, many)}`;
}

function sitesPhrase(n: number): string {
  return ruCount(n, 'сайт', 'сайта', 'сайтов');
}

export function planStatus(selected: boolean): string {
  return selected
    ? 'Пилотный план выбран. Дальше загрузите архив.'
    : 'Пилотный план не выбран. Выберите его, чтобы открыть загрузку.';
}

export function siteLimitLine(): string {
  return `Пилотный план рассчитан на ${sitesPhrase(LIMITS.sites)}. Сверх этого сайт не создаётся.`;
}

export function archiveLimitLine(): string {
  return `Файл архива в сжатом виде не больше ${LIMITS.archiveMb} МБ. Более крупный файл не принимается. Сожмите изображения или уберите видео и загрузите архив снова.`;
}

export function unpackedLimitLine(): string {
  return `Файлы одной версии после раскрытия архива не больше ${LIMITS.unpackedMb} МБ. Маленький архив всё равно может не пройти: внутри картинки бывают крупнее лимита. Уберите лишние файлы и загрузите архив снова.`;
}

export function storageLimitLine(): string {
  return `Все сохранённые версии вместе не больше ${LIMITS.storageMb} МБ. Если новая версия не влезает в остаток, она не загружается. Загрузите архив меньшего размера.`;
}

export function ownedSites(state: AppState, ownerId: AccountId): Site[] {
  return Object.values(state.sites).filter((site) => site.ownerId === ownerId);
}

export function accountLimitLine(sites: Site[]): string {
  const count = sitesPhrase(sites.length);
  const names = sites.map((site) => `«${site.businessName}»`).join(', ');
  const limit = sitesPhrase(LIMITS.sites);
  const listed = names === '' ? count : `${count}: ${names}`;
  return `На аккаунте ${listed}. Лимит пилотного плана: ${limit}. Новый сайт не создаётся.`;
}

export function addSiteNotice(
  result: AppState['lastResult'],
  businessName?: string,
): string | null {
  if (result?.kind !== 'addSite') return null;
  if (!businessName) return result.nextStep;
  return `${result.nextStep} Это «${businessName}».`;
}
