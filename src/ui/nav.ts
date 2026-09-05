/**
 * The six steps of a recalculation — SCREENS.md, "Layout pattern".
 *
 * The ARO Suite runs 26 steps in five phases because a module of record has to
 * carry an obligation from scoping to disclosure. Mode 1 does not own anything:
 * it reads somebody else's extracts, prices them again, and says by how much
 * the two answers differ. That is six steps in three phases, and they are the
 * Suite's own — same ids, same labels, same purposes — so a firm running both
 * reads one vocabulary.
 *
 * The ids are load-bearing beyond the sidebar: `exceptions()` in
 * `core/recalc.ts` names the step that resolves each exception, and the
 * "Resolve" button on Exceptions & clearance navigates by that id.
 */

export type Phase = 'Prepare' | 'Measure' | 'Assure';

export const PHASES: Phase[] = ['Prepare', 'Measure', 'Assure'];

export interface StepDef {
  id: string;
  label: string;
  phase: Phase;
  /** The one-line purpose shown under the step name in the header strip. */
  purpose: string;
}

export const STEPS: StepDef[] = [
  /* ── Prepare ──────────────────────────────────────────────────────────── */
  {
    id: 'recalc-import',
    label: 'Source extracts',
    phase: 'Prepare',
    purpose:
      'Load the cost estimate extract (REP04), the settlement date and reported value extract (REP06) and the interest rate curve. Each file is staged, its columns mapped and its content shown before anything is merged, so nothing enters the register unseen.',
  },
  {
    id: 'recalc-source',
    label: 'Imported data',
    phase: 'Prepare',
    purpose:
      'The extracts as they were read, with the mapped columns marked, so a reader can tie every figure in the recalculation back to a row in the original workbook.',
  },

  /* ── Measure ──────────────────────────────────────────────────────────── */
  {
    id: 'recalculation',
    label: 'Recalculation',
    phase: 'Measure',
    purpose:
      'The independent recalculation, obligation by obligation: the cost estimate escalated to the year end, escalated again to settlement, then discounted back at the rate the curve gives for the rounded term. Open a row for the same calculation written as Excel — paste the column into a blank sheet and every figure here reproduces, unaided.',
  },
  {
    id: 'recalc-compare',
    label: 'Source comparison',
    phase: 'Measure',
    purpose:
      'The recalculation against the figures the source system reported, obligation by obligation and in total, tested against tiered materiality. The trial-balance control total sits here too: agreeing the extract to an independently sourced total is what proves the population complete — without it a perfect recalculation of half the balance still reads clean.',
  },

  /* ── Assure ───────────────────────────────────────────────────────────── */
  {
    id: 'recalc-exceptions',
    label: 'Exceptions & clearance',
    phase: 'Assure',
    purpose:
      'Everything standing between the register and a finalised recalculation. Nothing here is a checkbox: each item reads live state and computes its own pass/fail, so it clears when the data that caused it changes and not before. A blocker means the recalculation cannot be concluded; a review means it needs an explanation on file first.',
  },
  {
    id: 'recalc-variance',
    label: 'Variance & sign-off',
    phase: 'Assure',
    purpose:
      'Why one obligation differs from what the source system reported, in two steps that sum to the variance exactly. The source publishes three figures and none of its assumptions, so its rates are back-solved over the recalculated terms — an implied rate absorbs everything in its leg, which is why the FV variance is reported separately.',
  },
];

/** The step a fresh register opens on. */
export const FIRST_STEP = STEPS[0].id;

export function stepById(id: string): StepDef | undefined {
  return STEPS.find((s) => s.id === id);
}

/**
 * A stored or supplied screen id, resolved to one that exists.
 *
 * An unknown id lands on the first step rather than a blank frame — a stale
 * `localStorage` blob from an earlier build should cost a click, not the
 * register.
 */
export function resolveScreen(id: string): string {
  return stepById(id) ? id : FIRST_STEP;
}

/** "03" — the step's position, for the sidebar. */
export function stepNumber(id: string): string {
  const i = STEPS.findIndex((s) => s.id === id);
  return i < 0 ? '' : String(i + 1).padStart(2, '0');
}
