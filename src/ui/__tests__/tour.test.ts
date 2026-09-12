import { describe, expect, it } from 'vitest';
import { isKnownScreen } from '../nav';
import { TOUR_STEPS } from '../Tour';

describe('the guided walkthrough', () => {
  it('visits every numbered surface plus the header chrome', () => {
    expect(TOUR_STEPS.map((s) => s.target)).toEqual([
      'tour-nav',
      'tour-header',
      'tour-metrics',
      'tour-templates',
      'tour-import',
      'tour-source',
      'tour-single',
      'tour-results',
      'tour-accretion',
      'tour-compare',
      'tour-exceptions',
      'tour-variance',
      'tour-assumptions',
      'tour-audit',
      'tour-raw',
    ]);
  });

  it('only names screens that exist, and does not reuse a target', () => {
    const targets = TOUR_STEPS.map((s) => s.target);
    expect(new Set(targets).size).toBe(targets.length);
    for (const stop of TOUR_STEPS) {
      expect(isKnownScreen(stop.screen)).toBe(true);
      expect(stop.title.trim().length).toBeGreaterThan(0);
      expect(stop.body.trim().length).toBeGreaterThan(40);
    }
  });
});
