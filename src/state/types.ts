export type AccountId = 'a' | 'b';

export type DomainStatus =
  'notStarted' | 'pending' | 'active' | 'failed' | 'deferred';

export type DeploymentState =
  'published' | 'publishFailed' | 'rolledBack' | 'rollbackFailed';

export type StorageDataStatus = 'current' | 'stale';

export type DomainCheck = 'pass' | 'fail';

export interface Version {
  id: string;
  label: string;
  archiveName: string;
  archiveMb: number;
  unpackedMb: number;
  uploadedAt: string;
}

export interface DomainState {
  name: string | null;
  status: DomainStatus;
  controlVerified: boolean;
}

export interface Site {
  slug: string;
  ownerId: AccountId;
  businessName: string;
  versions: Version[];
  activeVersionId: string;
  candidateVersionId: string | null;
  previousActiveId: string | null;
  deployment: DeploymentState;
  domain: DomainState;
  storageDataStatus: StorageDataStatus;
  lastUpdatedAt: string;
}

/** Check order: archive size, root index.html, unsafe path, unpacked size, retained storage. */
export type ArchiveRejection =
  'archiveSize' | 'noIndex' | 'unsafePath' | 'unpackedSize' | 'storage';

export type ArchiveCheck =
  | { ok: true }
  | {
      ok: false;
      reason: ArchiveRejection;
      limitMb?: number;
      actualMb?: number;
      path?: string;
      nextStep: string;
    };

export type UploadResult = {
  kind: 'upload';
  archiveName: string;
} & ArchiveCheck;

export type AddSiteResult = {
  kind: 'addSite';
  ok: false;
};

export interface SimulateFlags {
  publishFails: boolean;
  rollbackFails: boolean;
  domainCheck: DomainCheck;
}

export interface DemoState {
  step: number;
}

export interface AppState {
  sessionAccountId: AccountId | null;
  planSelected: Record<AccountId, boolean>;
  sites: Record<string, Site>;
  lastResult: UploadResult | AddSiteResult | null;
  simulate: SimulateFlags;
  scenarioId: string | null;
  demo: DemoState | null;
}

export const actionNames = [
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
] as const;

export type ActionName = (typeof actionNames)[number];
