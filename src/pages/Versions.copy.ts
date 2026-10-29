import type { Action } from '../state/reducer.ts';
import type { Site, Version } from '../state/types.ts';

export function activeVersionLine(label: string): string {
  return `Активна версия ${label}`;
}

export function publishFailedLine(label: string): string {
  return `Публикация не прошла. Активная версия: ${label}.`;
}

export function publishButtonLabel(label: string): string {
  return `Опубликовать версию ${label}`;
}

export function publishConfirmTitle(label: string): string {
  return `${publishButtonLabel(label)}?`;
}

export function confirmChangeText(
  activeLabel: string,
  nextLabel: string,
): string {
  return `Сейчас активна версия ${activeLabel}. После подтверждения активной станет версия ${nextLabel}.`;
}

export const rollbackAction = 'Вернуть версию';

export function rollbackButtonLabel(label: string): string {
  return `${rollbackAction} ${label}`;
}

export function rollbackConfirmTitle(label: string): string {
  return `${rollbackButtonLabel(label)}?`;
}

export function rollbackFailedLine(label: string): string {
  return `Откат не прошёл. Активная версия: ${label}.`;
}

export const rollbackUnavailable = 'Откат недоступен: предыдущей версии нет.';

export function rollbackVersion(slug: string): Action {
  return { type: 'rollback', slug };
}

const megabytes = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
});

export function formatMb(value: number): string {
  return `${megabytes.format(value)} МБ`;
}

export function versionSizeLine(version: Version): string {
  return `Архив ${formatMb(version.archiveMb)}, распакованный ${formatMb(version.unpackedMb)}`;
}

export function versionById(
  site: Site,
  id: string | null,
): Version | undefined {
  if (id === null) return undefined;
  return site.versions.find((version) => version.id === id);
}
