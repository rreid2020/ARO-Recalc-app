import { describe, expect, it } from 'vitest';
import { FIRST_STEP, HELP_SCREEN, resolveScreen, stepById, stepNumber } from '../nav';

describe('resolveScreen', () => {
  it('keeps a numbered workflow step', () => {
    expect(resolveScreen('recalc-import')).toBe('recalc-import');
    expect(stepById('recalc-import')).toBeDefined();
    expect(stepNumber('recalc-import')).toBe('01');
  });

  it('keeps the help surface without numbering it as a step', () => {
    expect(resolveScreen(HELP_SCREEN)).toBe(HELP_SCREEN);
    expect(stepById(HELP_SCREEN)).toBeUndefined();
    expect(stepNumber(HELP_SCREEN)).toBe('');
  });

  it('lands an unknown id on the first step', () => {
    expect(resolveScreen('legacy-engagement')).toBe(FIRST_STEP);
  });

  it('numbers Single obligation as the first Measure step without shifting Prepare', () => {
    expect(stepById('recalc-single')?.phase).toBe('Measure');
    expect(stepNumber('recalc-import')).toBe('01');
    expect(stepNumber('recalc-source')).toBe('02');
    expect(stepNumber('recalc-single')).toBe('03');
    expect(stepNumber('recalculation')).toBe('04');
    expect(resolveScreen('recalc-single')).toBe('recalc-single');
  });
});
