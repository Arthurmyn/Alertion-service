import type { Site } from './types.ts';

export function exampleUrl(site: Site): string {
  return `/site/${site.slug}`;
}

export function storageUsedMb(site: Site): number {
  return site.versions.reduce(
    (total, version) => total + version.unpackedMb,
    0,
  );
}
