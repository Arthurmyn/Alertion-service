import type { AppState, Site, Version } from '../state/types.ts';
import { archives } from './archives.ts';

export const accounts = [
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
] as const;

export type Account = (typeof accounts)[number];

export const domainExamples = {
  txtName: '_alertion-verify.nan.example',
  txtValue: 'alertion-verify=example-4f2a',
  cnameName: 'nan.example',
  cnameTarget: 'sites.alertion.example',
  certificate: 'example-cert-01',
} as const;

export const baselineUpdatedAt = '2026-10-28T09:00:00.000Z';

function retainedVersion(name: string): Version {
  const archive = archives[name];
  if (
    archive.archiveMb === null ||
    archive.unpackedMb === null ||
    archive.label === null
  ) {
    throw new Error(`${name} cannot be a retained version`);
  }

  return {
    id: archive.name.replace(/\.zip$/, ''),
    label: archive.label,
    archiveName: archive.name,
    archiveMb: archive.archiveMb,
    unpackedMb: archive.unpackedMb,
    uploadedAt: baselineUpdatedAt,
  };
}

function site(account: Account, version: Version): Site {
  return {
    slug: account.slug,
    ownerId: account.id,
    businessName: account.businessName,
    versions: [version],
    activeVersionId: version.id,
    candidateVersionId: null,
    previousActiveId: null,
    deployment: 'published',
    domain: {
      name: null,
      status: 'notStarted',
      controlVerified: false,
    },
    storageDataStatus: 'current',
    lastUpdatedAt: baselineUpdatedAt,
  };
}

const accountA = accounts[0];
const accountB = accounts[1];

export const baseline: AppState = {
  sessionAccountId: null,
  planSelected: {
    a: true,
    b: true,
  },
  sites: {
    [accountA.slug]: site(accountA, retainedVersion('nan-v1.zip')),
    [accountB.slug]: site(accountB, retainedVersion('temir-v1.zip')),
  },
  lastResult: null,
  simulate: {
    publishFails: false,
    rollbackFails: false,
    domainCheck: 'pass',
  },
  scenarioId: null,
  demo: null,
};
