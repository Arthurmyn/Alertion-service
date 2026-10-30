import { baselineUpdatedAt } from './accounts.ts';
import { verificationFor, type VerificationStatus } from './verification.ts';
import type { AppState, Site, Version } from '../state/types.ts';

/** First path segments under /manage that are workspace pages, not site slugs. */
export const workspaceSegments = [
  'projects',
  'deployments',
  'compute',
  'attestations',
  'builds',
  'reports',
  'networking',
  'secrets',
  'observability',
  'team',
  'billing',
  'settings',
  'storage',
  'security',
  'connections',
] as const;

export function isWorkspaceSegment(value: string): boolean {
  return (workspaceSegments as readonly string[]).includes(value);
}

export function sessionSites(state: AppState): Site[] {
  if (state.sessionAccountId === null) return [];
  return Object.values(state.sites).filter(
    (site) => site.ownerId === state.sessionAccountId,
  );
}

/** Role of a version inside its site. */
export type VersionRole = 'active' | 'candidate' | 'previous';

export interface DeploymentRow {
  key: string;
  site: Site;
  version: Version;
  role: VersionRole;
  verification: VerificationStatus;
}

export function versionRole(site: Site, version: Version): VersionRole {
  if (version.id === site.activeVersionId) return 'active';
  if (version.id === site.candidateVersionId) return 'candidate';
  return 'previous';
}

export function deploymentRows(sites: readonly Site[]): DeploymentRow[] {
  const rows = sites.flatMap((site) =>
    site.versions.map((version) => ({
      key: `${site.slug}/${version.id}`,
      site,
      version,
      role: versionRole(site, version),
      verification: verificationFor(site, version),
    })),
  );
  return rows.sort((a, b) => {
    const byDate = b.version.uploadedAt.localeCompare(a.version.uploadedAt);
    return byDate !== 0
      ? byDate
      : b.version.label.localeCompare(a.version.label);
  });
}

export function activeVersion(site: Site): Version | undefined {
  return site.versions.find((version) => version.id === site.activeVersionId);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'н/д';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase());
  return letters.join('') || '?';
}

export { baselineUpdatedAt };
