import { archives, type ArchiveFixture } from '../data/archives.ts';
import { LIMITS } from '../data/limits.ts';
import type { AppState, Site, UploadResult, Version } from '../state/types.ts';

export const planGateText = 'Сначала выберите пилотный план';
export const openPlanText = 'Открыть пилотный план';
export const checkingText = 'Проверяем архив…';
export const emptyText = 'Архив ещё не проверен.';
export const chooseArchiveText = 'Выберите пробный архив, чтобы проверить его.';
export const noArchivesText = 'Для этого сайта нет пробных архивов.';
export const simulationText =
  'Это симуляция выбора архива. Выберите пробный архив и нажмите «Проверить архив». Файл с компьютера не открывается.';
export const archiveLegend = 'Пробный архив';
export const openSiteLead = 'Откройте сайт';

/** The checking line is motion, so reduced motion skips the wait. */
export const CHECK_DELAY_MS = 700;

export function checkDelay(reducedMotion: boolean): number {
  return reducedMotion ? 0 : CHECK_DELAY_MS;
}

function versionById(site: Site, id: string | null): Version | undefined {
  if (id === null) return undefined;
  return site.versions.find((version) => version.id === id);
}

function belongsToSite(site: Site, archiveName: string): boolean {
  return archiveName.startsWith(`${site.slug}-`);
}

export function activeVersionLabel(site: Site): string {
  return versionById(site, site.activeVersionId)?.label ?? site.activeVersionId;
}

export function activeLine(site: Site): string {
  return `Активная версия: ${activeVersionLabel(site)}.`;
}

export function limitsSummary(): string {
  return `Лимиты пилотного плана: ${LIMITS.sites} сайт, архив ${LIMITS.archiveMb} МБ, распакованная версия ${LIMITS.unpackedMb} МБ, хранилище ${LIMITS.storageMb} МБ.`;
}

export function successMessage(site: Site): string | null {
  const candidate = versionById(site, site.candidateVersionId);
  if (!candidate) return null;
  return `Проверка прошла. Версия ${candidate.label} стала кандидатом. Адрес сайта показывает активную версию ${activeVersionLabel(site)}.`;
}

export function archiveSizeNote(archive: ArchiveFixture): string | null {
  const parts: string[] = [];
  if (archive.archiveMb !== null) parts.push(`архив ${archive.archiveMb} МБ`);
  if (archive.unpackedMb !== null) {
    parts.push(`распакованная версия ${archive.unpackedMb} МБ`);
  }
  return parts.length === 0 ? null : parts.join(', ');
}

export function choiceHeading(archive: ArchiveFixture): string {
  if (archive.label) return `Версия ${archive.label}`;
  if (!archive.files.includes('index.html')) return 'Нет index.html в корне';
  if (archive.files.some((file) => file.includes('..'))) {
    return 'Небезопасный путь';
  }
  const size = archiveSizeNote(archive);
  if (size === null) return 'Пробный архив';
  return size.charAt(0).toUpperCase() + size.slice(1);
}

/** Sample archives for this site, except the one already active. */
export function uploadChoices(site: Site): ArchiveFixture[] {
  const activeName = versionById(site, site.activeVersionId)?.archiveName;
  return Object.values(archives).filter(
    (archive) =>
      archive.name !== activeName && belongsToSite(site, archive.name),
  );
}

export function blockReason(
  choiceCount: number,
  selected: string | null,
): string | null {
  if (choiceCount === 0) return noArchivesText;
  if (selected === null) return chooseArchiveText;
  return null;
}

export function visibleUploadResult(
  site: Site,
  lastResult: AppState['lastResult'],
): UploadResult | null {
  if (
    lastResult?.kind !== 'upload' ||
    !belongsToSite(site, lastResult.archiveName)
  ) {
    return null;
  }
  if (!lastResult.ok) return lastResult;

  const candidate = versionById(site, site.candidateVersionId);
  if (candidate?.archiveName !== lastResult.archiveName) return null;
  return lastResult;
}
