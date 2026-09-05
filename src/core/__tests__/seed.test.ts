import { describe, expect, it } from 'vitest';
import { portfolioTotals } from '../recalc';
import { SEED_ROWS, seededRecalcRegister } from '../seed';

describe('seeded demo register', () => {
  it('opens on the three Master Sheet obligations', () => {
    const reg = seededRecalcRegister('2026-03-31');
    expect(reg.seeded).toBe(true);
    expect(reg.rows.map((r) => r.id)).toEqual(['1104279', '1104240', '1103206']);
    expect(SEED_ROWS).toHaveLength(3);
  });

  it('prices the seed so the demo has figures to show', () => {
    const t = portfolioTotals(seededRecalcRegister('2026-03-31'));
    expect(t.count).toBe(3);
    expect(t.covered).toBe(3);
    expect(t.pv).toBeGreaterThan(70_000_000);
    expect(t.pv).toBeLessThan(80_000_000);
    expect(Math.abs(t.variance)).toBeLessThan(1);
  });
});
