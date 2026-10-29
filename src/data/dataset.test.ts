import { describe, expect, it } from 'vitest';
import { actionNames } from '../state/types.ts';
import { accounts, baseline, domainExamples } from './accounts.ts';
import { archives } from './archives.ts';
import {
  backlogItems,
  sprintWorkHours,
  totalWorkHours,
  workHours,
} from './backlogItems.ts';
import { LIMITS } from './limits.ts';
import { sampleSites } from './sampleSites.ts';

describe('LIMITS', () => {
  it('is the only copy of the pilot figures', () => {
    expect(LIMITS).toEqual({
      sites: 1,
      archiveMb: 20,
      unpackedMb: 50,
      storageMb: 150,
    });
  });
});

describe('backlog items', () => {
  it('quotes the summary titles and sums to 90 hours', () => {
    expect(
      backlogItems.map((item) => [
        item.id,
        item.title,
        workHours(item),
        item.sprint,
      ]),
    ).toEqual([
      ['B1', 'Account boundary scenarios', 10, 1],
      ['B2', 'Upload and publish walkthrough', 18, 1],
      ['B3', 'Preview and explicit publish', 12, 2],
      ['B4', 'Previous-version rollback', 10, 2],
      ['B5', 'Domain and HTTPS mock states', 10, 2],
      ['B6', 'Status and storage dashboard', 8, 3],
      ['B7', 'Plan selection and limits', 6, 3],
      ['B8', 'Integrated simulation evidence', 16, 3],
    ]);
    expect(
      backlogItems.find((item) => item.id === 'B3')?.hoursBySprint,
    ).toEqual({
      1: 2,
      2: 10,
    });
    expect(sprintWorkHours(1)).toBe(30);
    expect(sprintWorkHours(2)).toBe(30);
    expect(sprintWorkHours(3)).toBe(30);
    expect(totalWorkHours()).toBe(90);
  });
});

describe('accounts and archives', () => {
  it('matches the fictional baseline', () => {
    expect(accounts).toEqual([
      {
        id: 'a',
        slug: 'nan',
        businessName: 'Пекарня Нан',
        ownerName: 'Айгуль С.',
        domainName: 'nan.example',
      },
      {
        id: 'b',
        slug: 'temir',
        businessName: 'Мастерская Темир',
        ownerName: 'Ерлан Б.',
        domainName: 'temir.example',
      },
    ]);

    expect(domainExamples).toEqual({
      txtName: '_alertion-verify.nan.example',
      txtValue: 'alertion-verify=example-4f2a',
      cnameName: 'nan.example',
      cnameTarget: 'sites.alertion.example',
      certificate: 'example-cert-01',
    });

    expect(archives['nan-v1.zip']).toMatchObject({
      archiveMb: 4.2,
      unpackedMb: 12,
      label: 'A',
    });
    expect(archives['temir-v1.zip']).toMatchObject({
      archiveMb: 3,
      unpackedMb: 9,
      label: 'A',
    });
    expect(archives['nan-v2.zip']).toMatchObject({
      archiveMb: 5.1,
      unpackedMb: 18,
      label: 'B',
    });
    expect(archives['nan-v3.zip']).toMatchObject({
      archiveMb: 15,
      unpackedMb: 45,
      label: 'C',
    });
    expect(archives['nan-v4.zip']).toMatchObject({
      archiveMb: 15,
      unpackedMb: 45,
      label: 'D',
    });
    expect(archives['nan-28mb.zip']).toMatchObject({
      archiveMb: 28,
      unpackedMb: null,
    });
    expect(archives['nan-unpack-60.zip']).toMatchObject({
      archiveMb: 8,
      unpackedMb: 60,
    });
    expect(archives['nan-storage.zip']).toMatchObject({
      archiveMb: 12,
      unpackedMb: 40,
    });
    expect(archives['nan-no-index.zip']?.files).toEqual(['home.html']);
    expect(archives['nan-no-index.zip']?.files).not.toContain('index.html');
    expect(archives['nan-unsafe.zip']?.files).toEqual([
      'index.html',
      '../secret.txt',
    ]);

    const nan = baseline.sites.nan;
    const temir = baseline.sites.temir;
    expect(nan?.ownerId).toBe('a');
    expect(nan?.businessName).toBe('Пекарня Нан');
    expect(nan?.activeVersionId).toBe('nan-v1');
    expect(nan?.candidateVersionId).toBeNull();
    expect(nan?.previousActiveId).toBeNull();
    expect(nan?.deployment).toBe('published');
    expect(nan?.domain).toEqual({
      name: null,
      status: 'notStarted',
      controlVerified: false,
    });
    expect(nan?.versions.map((version) => version.unpackedMb)).toEqual([12]);
    expect(nan?.versions[0]).toMatchObject({
      label: 'A',
      archiveName: 'nan-v1.zip',
      archiveMb: 4.2,
      unpackedMb: 12,
    });

    expect(temir?.ownerId).toBe('b');
    expect(temir?.previousActiveId).toBeNull();
    expect(temir?.versions[0]).toMatchObject({
      label: 'A',
      archiveName: 'temir-v1.zip',
      archiveMb: 3,
      unpackedMb: 9,
    });
    expect(baseline.planSelected).toEqual({ a: true, b: true });
    expect(baseline.sessionAccountId).toBeNull();
    expect(baseline.lastResult).toBeNull();
  });
});

describe('sample sites', () => {
  it('uses the menu lines and has no script', () => {
    expect(sampleSites['nan-v1.zip']).toContain('Баурсак, 500 ₸');
    expect(sampleSites['nan-v1.zip']).not.toContain('Круассан');
    expect(sampleSites['nan-v2.zip']).toContain('Баурсак, 500 ₸');
    expect(sampleSites['nan-v2.zip']).toContain('Круассан, 900 ₸');
    expect(sampleSites['temir-v1.zip']).toContain('Заточка ножа, 2 000 ₸');

    for (const archive of Object.values(archives)) {
      if (archive.label !== null) {
        expect(sampleSites[archive.name]?.toLowerCase()).not.toContain(
          '<script',
        );
        expect(sampleSites[archive.name]).toContain('<html');
      }
    }
  });
});

describe('actions', () => {
  it('lists each reducer action once', () => {
    expect(actionNames).toEqual([
      'signIn',
      'signOut',
      'selectPlan',
      'upload',
      'publish',
      'rollback',
      'addSite',
      'setDomain',
      'verifyDomain',
      'activateDomain',
      'refreshStorage',
      'setDemo',
      'load',
    ]);
  });
});
