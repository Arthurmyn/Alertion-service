import { archives, type ArchiveFixture } from '../data/archives.ts';
import { LIMITS } from '../data/limits.ts';
import type { AppState, Site, UploadResult } from '../state/types.ts';

export const planGateText = 'Сначала выберите пилотный план';
export const checkingText = 'Проверяем архив…';
export const emptyText = 'Архив ещё не проверен.';
export const chooseArchiveText = 'Выберите архив, чтобы проверить его.';
export const noArchivesText = 'Для этого сайта нет пробных архивов.';
export const simulationText = 'Пробные архивы: симуляция.';

/** The checking line is motion, so reduced motion skips the wait. */
export const CHECK_DELAY_MS = 700;

export function checkDelay(reducedMotion: boolean): number {
  return reducedMotion ? 0 : CHECK_DELAY_MS;
}

export function activeVersionLabel(site: Site): string {
  const active = site.versions.find(
    (version) => version.id === site.activeVersionId,
  );
  return active?.label ?? site.activeVersionId;
}

export function activeLine(site: Site): string {
  return `Активная версия: ${activeVersionLabel(site)}.`;
}

export function limitsSummary(): string {
  return `Лимиты пилотного плана: ${LIMITS.sites} сайт, архив ${LIMITS.archiveMb} МБ, распакованная версия ${LIMITS.unpackedMb} МБ, хранилище ${LIMITS.storageMb} МБ.`;
}

export function successMessage(site: Site): string | null {
  if (site.candidateVersionId === null) return null;
  const candidate = site.versions.find(
    (version) => version.id === site.candidateVersionId,
  );
  if (!candidate) return null;
  return `Проверка прошла. Версия ${candidate.label} стала кандидатом. Адрес сайта показывает активную версию ${activeVersionLabel(site)}.`;
}

export function archiveSizeNote(archive: ArchiveFixture): string | null {
  const parts: string[] = [];
  if (archive.archiveMb !== null) parts.push(`сжатый ${archive.archiveMb} МБ`);
  if (archive.unpackedMb !== null) {
    parts.push(`распакованный ${archive.unpackedMb} МБ`);
  }
  if (parts.length === 0) return null;
  return parts.join(', ');
}

/** Sample archives for this site, except the one already active. */
export function uploadChoices(site: Site): ArchiveFixture[] {
  const active = site.versions.find(
    (version) => version.id === site.activeVersionId,
  );
  return Object.values(archives).filter((archive) => {
    if (archive.name === active?.archiveName) return false;
    return archive.name.startsWith(`${site.slug}-`);
  });
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
  if (lastResult === null || lastResult.kind !== 'upload') return null;
  if (!lastResult.archiveName.startsWith(`${site.slug}-`)) return null;
  if (!lastResult.ok) return lastResult;

  const candidate = site.versions.find(
    (version) => version.id === site.candidateVersionId,
  );
  if (candidate?.archiveName !== lastResult.archiveName) return null;
  return lastResult;
}
