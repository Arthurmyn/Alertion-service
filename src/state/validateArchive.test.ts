import { describe, expect, it } from 'vitest';
import { baseline, baselineUpdatedAt } from '../data/accounts.ts';
import { archives, type ArchiveFixture } from '../data/archives.ts';
import { LIMITS } from '../data/limits.ts';
import type { ArchiveCheck, Site, Version } from './types.ts';
import { validateArchive } from './validateArchive.ts';

function nanSite(): Site {
  const site = baseline.sites.nan;
  if (!site) throw new Error('baseline has no nan');
  return site;
}

function archive(name: string): ArchiveFixture {
  const fixture = archives[name];
  if (!fixture) throw new Error(`missing ${name}`);
  return fixture;
}

function version(name: string): Version {
  const fixture = archive(name);
  if (
    fixture.archiveMb === null ||
    fixture.unpackedMb === null ||
    fixture.label === null
  ) {
    throw new Error(`${name} cannot be retained`);
  }
  return {
    id: name.replace(/\.zip$/, ''),
    label: fixture.label,
    archiveName: fixture.name,
    archiveMb: fixture.archiveMb,
    unpackedMb: fixture.unpackedMb,
    uploadedAt: baselineUpdatedAt,
  };
}

function withVersions(
  versions: Version[],
  candidateVersionId: string | null = null,
): Site {
  const first = versions[0];
  if (!first) throw new Error('site needs a version');
  return {
    ...nanSite(),
    versions,
    activeVersionId: first.id,
    candidateVersionId,
  };
}

function rejection(
  fixture: ArchiveFixture,
  site: Site,
): ArchiveCheck & { ok: false } {
  const result = validateArchive(fixture, site, LIMITS);
  if (result.ok) throw new Error(`${fixture.name} should be rejected`);
  return result;
}

function unchanged(site: Site): string {
  const active = site.versions.find((item) => item.id === site.activeVersionId);
  if (!active) throw new Error('active version missing');
  return `Активная версия не изменилась: ${active.label}.`;
}

describe('validateArchive', () => {
  it('B2-AC2 rejects a missing root index.html', () => {
    const site = nanSite();
    const fixture = archive('nan-no-index.zip');
    const action =
      'Переименуйте стартовую страницу в index.html и загрузите архив снова.';
    const result = rejection(fixture, site);

    expect(result).toEqual({
      ok: false,
      reason: 'noIndex',
      nextStep: `В архиве нет index.html в корне. ${action} ${unchanged(site)}`,
    });
    expect(result.nextStep).not.toContain('Лимит');
    expect(fixture.files).not.toContain('index.html');
  });

  it('B2-AC3 rejects an unsafe path', () => {
    const site = nanSite();
    const fixture = archive('nan-unsafe.zip');
    const path = fixture.files.find((file) => file.includes('..'));
    if (!path) throw new Error('nan-unsafe.zip needs an unsafe path');
    const action = `Уберите «${path}» и загрузите архив снова.`;
    const result = rejection(fixture, site);

    expect(result).toEqual({
      ok: false,
      reason: 'unsafePath',
      path,
      nextStep: `В архиве небезопасный путь «${path}». ${action} ${unchanged(site)}`,
    });
    expect(result.nextStep).toContain(path);
    expect(result.nextStep).not.toContain('Лимит');
  });

  it('B2-AC4 B7-AC2 rejects an archive over the compressed limit', () => {
    const site = nanSite();
    const fixture = archive('nan-28mb.zip');
    if (fixture.archiveMb === null)
      throw new Error('nan-28mb.zip needs a size');
    const action =
      'Сожмите изображения или уберите видео и загрузите архив снова.';
    const result = rejection(fixture, site);

    expect(result).toEqual({
      ok: false,
      reason: 'archiveSize',
      limitMb: LIMITS.archiveMb,
      actualMb: fixture.archiveMb,
      nextStep: `Архив ${fixture.archiveMb} МБ. Лимит пилотного плана: ${LIMITS.archiveMb} МБ. ${action} ${unchanged(site)}`,
    });
  });

  it('B2-AC4 B7-AC2 rejects an archive over the unpacked limit', () => {
    const site = nanSite();
    const fixture = archive('nan-unpack-60.zip');
    if (fixture.unpackedMb === null) {
      throw new Error('nan-unpack-60.zip needs an unpacked size');
    }
    const action = 'Уберите лишние файлы и загрузите архив снова.';
    const result = rejection(fixture, site);

    expect(result).toEqual({
      ok: false,
      reason: 'unpackedSize',
      limitMb: LIMITS.unpackedMb,
      actualMb: fixture.unpackedMb,
      nextStep: `Распакованная версия ${fixture.unpackedMb} МБ. Лимит пилотного плана: ${LIMITS.unpackedMb} МБ. ${action} ${unchanged(site)}`,
    });
  });

  it('B2-AC4 B7-AC2 rejects an archive over retained storage', () => {
    const versions = [
      version('nan-v1.zip'),
      version('nan-v2.zip'),
      version('nan-v3.zip'),
      version('nan-v4.zip'),
    ];
    const site = withVersions(versions);
    const fixture = archive('nan-storage.zip');
    if (fixture.unpackedMb === null) {
      throw new Error('nan-storage.zip needs an unpacked size');
    }
    const retainedMb = versions.reduce(
      (total, item) => total + item.unpackedMb,
      0,
    );
    const actualMb = retainedMb + fixture.unpackedMb;
    const freeMb = LIMITS.storageMb - retainedMb;
    const action = `Загрузите архив с распакованным размером до ${freeMb} МБ.`;
    const result = rejection(fixture, site);

    expect(result).toEqual({
      ok: false,
      reason: 'storage',
      limitMb: LIMITS.storageMb,
      actualMb,
      nextStep: `Хранилище ${actualMb} МБ. Лимит пилотного плана: ${LIMITS.storageMb} МБ. ${action} ${unchanged(site)}`,
    });

    const replaced = withVersions(versions, 'nan-v2');
    expect(validateArchive(fixture, replaced, LIMITS)).toEqual({ ok: true });
  });

  it('rejects in plan order', () => {
    const versions = [
      version('nan-v1.zip'),
      version('nan-v2.zip'),
      version('nan-v3.zip'),
      version('nan-v4.zip'),
    ];
    const site = withVersions(versions);
    const hostile: ArchiveFixture = {
      name: 'hostile.zip',
      label: null,
      archiveMb: archive('nan-28mb.zip').archiveMb,
      unpackedMb: archive('nan-unpack-60.zip').unpackedMb,
      files: ['home.html', '../secret.txt'],
    };

    expect(rejection(hostile, site).reason).toBe('archiveSize');
    expect(
      rejection(
        { ...hostile, archiveMb: archive('nan-v2.zip').archiveMb },
        site,
      ).reason,
    ).toBe('noIndex');
    expect(
      rejection(
        {
          ...hostile,
          archiveMb: archive('nan-v2.zip').archiveMb,
          files: ['index.html', '../secret.txt'],
        },
        site,
      ).reason,
    ).toBe('unsafePath');
    expect(
      rejection(
        {
          ...hostile,
          archiveMb: archive('nan-v2.zip').archiveMb,
          files: ['index.html'],
        },
        site,
      ).reason,
    ).toBe('unpackedSize');
    expect(
      rejection(
        {
          ...hostile,
          archiveMb: archive('nan-v2.zip').archiveMb,
          unpackedMb: archive('nan-storage.zip').unpackedMb,
          files: ['index.html'],
        },
        site,
      ).reason,
    ).toBe('storage');
  });
});
