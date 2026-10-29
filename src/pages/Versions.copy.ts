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

export function publishConfirmText(
  activeLabel: string,
  nextLabel: string,
): string {
  return `Сейчас активна версия ${activeLabel}. После подтверждения активной станет версия ${nextLabel}.`;
}

const megabytes = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
});

export function formatMb(value: number): string {
  return `${megabytes.format(value)} МБ`;
}

export function versionSizeLine(version: Version): string {
  return `Сжатый архив ${formatMb(version.archiveMb)}. Распакованный размер ${formatMb(version.unpackedMb)}.`;
}

export function versionById(
  site: Site,
  id: string | null,
): Version | undefined {
  if (id === null) return undefined;
  return site.versions.find((version) => version.id === id);
}
