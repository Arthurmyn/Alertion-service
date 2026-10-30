import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LIMITS } from '../../data/limits.ts';
import { StorageMeter } from './StorageMeter.tsx';

function markup(usedMb: number, limitMb: number): string {
  return renderToStaticMarkup(createElement(StorageMeter, { usedMb, limitMb }));
}

describe('StorageMeter', () => {
  it('labels used storage against the limit', () => {
    expect(markup(12, LIMITS.storageMb)).toContain(
      `12 МБ из ${LIMITS.storageMb} МБ`,
    );
    expect(markup(9, LIMITS.storageMb)).toContain(
      `9 МБ из ${LIMITS.storageMb} МБ`,
    );
    expect(markup(30, LIMITS.storageMb)).toContain(
      `30 МБ из ${LIMITS.storageMb} МБ`,
    );
    expect(markup(4.2, LIMITS.storageMb)).toContain(
      `4.2 МБ из ${LIMITS.storageMb} МБ`,
    );
  });

  it('draws the used share of the limit', () => {
    const home = markup(12, LIMITS.storageMb);
    expect(home).toContain('role="meter"');
    expect(home).toContain('aria-label="Хранилище"');
    expect(home).toContain(`aria-valuetext="12 МБ из ${LIMITS.storageMb} МБ"`);
    expect(home).toContain('aria-valuemin="0"');
    expect(home).toContain(`aria-valuemax="${LIMITS.storageMb}"`);
    expect(home).toContain('aria-valuenow="12"');
    expect(home).toContain('width="8" height="10"');
    expect(home).toContain('<svg');

    expect(markup(9, LIMITS.storageMb)).toContain('width="6" height="10"');
    expect(markup(30, LIMITS.storageMb)).toContain('width="20" height="10"');
    expect(markup(0, LIMITS.storageMb)).toContain('width="0" height="10"');
  });

  it('keeps the announced value inside the meter range', () => {
    const over = LIMITS.storageMb + 10;
    const html = markup(over, LIMITS.storageMb);
    expect(html).toContain(`aria-valuenow="${LIMITS.storageMb}"`);
    expect(html).toContain(`${over} МБ из ${LIMITS.storageMb} МБ`);
    expect(html).toContain('width="100" height="10"');
  });
});
