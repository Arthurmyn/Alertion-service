import type { Site } from '../../state/types.ts';

export function deploymentTone(site: Site): 'success' | 'error' {
  return site.deployment === 'publishFailed' ||
    site.deployment === 'rollbackFailed'
    ? 'error'
    : 'success';
}
