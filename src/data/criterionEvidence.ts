import { evidence } from './evidence.ts';

const criterionScreenshots: Record<string, keyof typeof evidence> = {
  'B1-AC1': 'public-nan',
  'B1-AC2': 'b-opens-a',
  'B2-AC1': 'publish-ok',
  'B2-AC2': 'reject-no-index',
  'B2-AC3': 'reject-unsafe-path',
  'B2-AC4': 'reject-archive-size',
  'B2-AC5': 'reject-no-index',
  'B3-AC1': 'preview-b',
  'B3-AC2': 'publish-confirm',
  'B3-AC3': 'publish-fail',
  'B3-AC4': 'preview-b',
  'B4-AC1': 'rollback-ok',
  'B4-AC2': 'rollback-none',
  'B4-AC3': 'rollback-fail',
  'B5-AC1': 'domain-active',
  'B5-AC2': 'domain-failed',
  'B5-AC3': 'domain-pending',
  'B5-AC4': 'goals',
  'B6-AC1': 'a-home',
  'B6-AC2': 'b-home',
  'B6-AC3': 'publish-ok',
  'B6-AC4': 'domain-active',
  'B6-AC5': 'a-home',
  'B6-AC6': 'domain-deferred',
  'B7-AC1': 'second-site',
  'B7-AC2': 'reject-storage',
};

export type EvidenceScreenshot = (typeof evidence)[keyof typeof evidence];

export function criterionEvidence(id: string): EvidenceScreenshot {
  const key = criterionScreenshots[id];
  if (!key) throw new Error(`Missing screenshot for ${id}`);
  return evidence[key];
}
