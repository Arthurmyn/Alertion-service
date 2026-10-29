import { describe, expect, it } from 'vitest';
import {
  EMPTY_SLOT_LABEL,
  evidenceFileName,
  evidenceSlots,
} from './sprintEvidence.ts';

describe('sprint evidence slots', () => {
  it('names every slot by sprint, backlog id and check', () => {
    expect(EMPTY_SLOT_LABEL).toBe('записи нет');
    expect(new Set(evidenceSlots.map((item) => item.sprint))).toEqual(
      new Set([1, 2, 3]),
    );
    for (const sprint of [1, 2, 3] as const) {
      expect(evidenceSlots.some((item) => item.sprint === sprint)).toBe(true);
    }
    for (const item of evidenceSlots) {
      expect(evidenceFileName(item)).toBe(
        `s${item.sprint}-${item.backlogId}-${item.check}`,
      );
      expect(evidenceFileName(item)).toMatch(/^s[123]-B[1-8]-[a-z0-9-]+$/);
      expect(item.title.length).toBeGreaterThan(0);
      expect('passed' in item).toBe(false);
    }
  });
});
