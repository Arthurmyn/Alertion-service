import type { ArchiveFixture } from '../data/archives.ts';
import type { ArchiveCheck, Site } from './types.ts';

type PlanLimits = {
  archiveMb: number;
  unpackedMb: number;
  storageMb: number;
};

function mb(value: number): string {
  return `${value} МБ`;
}

function activeLabel(site: Site): string {
  const active = site.versions.find(
    (version) => version.id === site.activeVersionId,
  );
  return active?.label ?? site.activeVersionId;
}

/** The new upload replaces an unpublished candidate, so that size is not kept. */
function retainedUnpackedMb(site: Site): number {
  return site.versions.reduce((total, version) => {
    if (version.id === site.candidateVersionId) return total;
    return total + version.unpackedMb;
  }, 0);
}

function isUnsafePath(file: string): boolean {
  if (file.startsWith('/') || file.startsWith('\\')) return true;
  return file.split(/[/\\]/).includes('..');
}

function sizeRejection(
  reason: 'archiveSize' | 'unpackedSize' | 'storage',
  subject: string,
  actualMb: number,
  limitMb: number,
  action: string,
  unchanged: string,
): ArchiveCheck {
  return {
    ok: false,
    reason,
    limitMb,
    actualMb,
    nextStep: `${subject} ${mb(actualMb)}. Лимит пилотного плана: ${mb(limitMb)}. ${action} ${unchanged}`,
  };
}

function faultRejection(
  reason: 'noIndex' | 'unsafePath',
  fault: string,
  action: string,
  unchanged: string,
  path?: string,
): ArchiveCheck {
  return {
    ok: false,
    reason,
    ...(path === undefined ? {} : { path }),
    nextStep: `${fault} ${action} ${unchanged}`,
  };
}

/** Order: compressed size, root index.html, unsafe path, unpacked size, storage. */
export function validateArchive(
  archive: ArchiveFixture,
  site: Site,
  limits: PlanLimits,
): ArchiveCheck {
  const unchanged = `Активная версия не изменилась: ${activeLabel(site)}.`;

  if (archive.archiveMb !== null && archive.archiveMb > limits.archiveMb) {
    return sizeRejection(
      'archiveSize',
      'Архив',
      archive.archiveMb,
      limits.archiveMb,
      'Сожмите изображения или уберите видео и загрузите архив снова.',
      unchanged,
    );
  }

  if (!archive.files.includes('index.html')) {
    return faultRejection(
      'noIndex',
      'В архиве нет index.html в корне.',
      'Переименуйте стартовую страницу в index.html и загрузите архив снова.',
      unchanged,
    );
  }

  const path = archive.files.find(isUnsafePath);
  if (path !== undefined) {
    return faultRejection(
      'unsafePath',
      `В архиве небезопасный путь «${path}».`,
      `Уберите «${path}» и загрузите архив снова.`,
      unchanged,
      path,
    );
  }

  if (archive.unpackedMb !== null && archive.unpackedMb > limits.unpackedMb) {
    return sizeRejection(
      'unpackedSize',
      'Распакованная версия',
      archive.unpackedMb,
      limits.unpackedMb,
      'Уберите лишние файлы и загрузите архив снова.',
      unchanged,
    );
  }

  if (archive.unpackedMb !== null) {
    const retainedMb = retainedUnpackedMb(site);
    const actualMb = retainedMb + archive.unpackedMb;
    if (actualMb > limits.storageMb) {
      const freeMb = Math.max(limits.storageMb - retainedMb, 0);
      return sizeRejection(
        'storage',
        'Хранилище',
        actualMb,
        limits.storageMb,
        `Загрузите архив с распакованным размером до ${mb(freeMb)}.`,
        unchanged,
      );
    }
  }

  return { ok: true };
}
