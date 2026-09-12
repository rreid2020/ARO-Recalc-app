/**
 * In-app walkthrough — the "Show me instead" path on How to use it.
 *
 * One stop on every numbered surface plus the header chrome. Each step names a
 * `data-tour` target; the overlay spots it and the tooltip sits beside it.
 */

import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useStore, type UiState } from './state';
import { HELP_SCREEN } from './nav';

export interface TourStop {
  target: string;
  screen: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStop[] = [
  {
    target: 'tour-nav',
    screen: 'recalc-import',
    title: 'Eleven steps, three phases',
    body: 'Prepare loads extracts. Measure recalculates — including a one-page calculator when you are not importing a population. Assure holds exceptions, the variance bridge, assumptions and exports. Jump to any step; this is not a wizard you cannot leave.',
  },
  {
    target: 'tour-header',
    screen: 'recalc-import',
    title: 'Year end, inflation, materiality',
    body: 'FY year end and inflation are read-only here — click either to edit them in the Assumptions library. Materiality is the absolute dollar and relative percent test; either threshold flags a variance. Flagged counts compared obligations above that test.',
  },
  {
    target: 'tour-metrics',
    screen: 'recalc-import',
    title: 'The portfolio, live',
    body: 'Cost at FY end, FV at settlement, recalculated closing PV, reported PV, and net PV variance. These recompute as extracts land. Recalculated PV is independent; source PV is what was reported.',
  },
  {
    target: 'tour-templates',
    screen: 'recalc-import',
    title: 'Templates, not report names',
    body: 'Three workbooks: cost estimates, reported values, interest rate curve. Fill them, or use any .xlsx whose columns cover the same fields. The filename and the source system do not matter.',
  },
  {
    target: 'tour-import',
    screen: 'recalc-import',
    title: 'Import, then map',
    body: 'Choose a workbook for each slot. The sheet, header row and every column are guesses until you look. Confirm the mapping — only then does anything enter the register. You can merge another file of the same kind later.',
  },
  {
    target: 'tour-source',
    screen: 'recalc-source',
    title: 'Tie every figure back',
    body: 'Imported data is the extract as it was read, with mapped columns marked. It is held in this browser session only so a reviewer can see the source of a number. It clears on reload; the register itself is what persists.',
  },
  {
    target: 'tour-single',
    screen: 'recalc-single',
    title: 'One obligation, no extracts',
    body: 'Set assumptions, enter the cost and dates, optionally FV and PV from an external source, and read CCE, FV, PV, the variance and the calculation underneath. Load example or copy a register row. Inflation and year end edited here apply everywhere.',
  },
  {
    target: 'tour-results',
    screen: 'recalculation',
    title: 'Obligation by obligation',
    body: 'Each row escalates the cost estimate to the year end, then to settlement, then discounts back on the curve. Edit dates and amounts in place, filter by flag, open Calc for Excel formulas, or export a workbook that reproduces every figure.',
  },
  {
    target: 'tour-accretion',
    screen: 'recalc-accretion',
    title: 'The discount unwinding',
    body: 'Period by period from recalculated PV to FV at settlement. Nothing is posted from this — it is here so the two figures can be seen to be the same measurement at different dates.',
  },
  {
    target: 'tour-compare',
    screen: 'recalc-compare',
    title: 'Compare, then prove completeness',
    body: 'Enter the trial-balance ARO PV — an independent control total, never derived. Then the recalculation against reported FV and PV, obligation by obligation, flagged on materiality. FV variance points at cost, inflation or dates; PV variance includes discounting.',
  },
  {
    target: 'tour-exceptions',
    screen: 'recalc-exceptions',
    title: 'Nothing ticked away',
    body: 'A blocker bars sign-off. A review needs an explanation on file. Info is context. Each row reads live state and Resolve jumps to the step that clears it. The exception goes when the data that caused it changes.',
  },
  {
    target: 'tour-variance',
    screen: 'recalc-variance',
    title: 'Why the two PVs differ',
    body: 'The source publishes three figures and none of its rates, so inflation and discount are back-solved over the recalculated terms. Those two steps sum to the PV variance exactly. Sign-off records who concluded — only once blockers are gone, and only after a name is entered.',
  },
  {
    target: 'tour-assumptions',
    screen: 'recalc-assumptions',
    title: 'Rates that apply to every row',
    body: 'FY year end and day count are set once. Named inflation options are edited here; Set applies one to the whole register. The discount rate is looked up on the curve at each obligation’s rounded-up term — import a client table, or the built-in FY26 curve is used and the exception list says so.',
  },
  {
    target: 'tour-audit',
    screen: 'recalc-audit',
    title: 'Every write, newest first',
    body: 'Imports, edits, inflation changes and sign-off are prepended here with a timestamp. An auditor can see what changed, then reproduce the calculation as it stood.',
  },
  {
    target: 'tour-raw',
    screen: 'recalc-raw',
    title: 'The register as stored',
    body: 'Export Excel with live formulas, CSV of the stored fields, or JSON of assumptions and rows. Inflation, year end and the curve live in the assumptions library, not on each obligation. Reset to seed restores the three demo rows.',
  },
];

export function startTour(setUi: (next: Partial<UiState>) => void): void {
  const first = TOUR_STEPS[0];
  setUi({ screen: first.screen, tourStep: 0 });
}

export function Tour() {
  const { ui, setUi } = useStore();
  const index = ui.tourStep;
  const [box, setBox] = useState<DOMRect | null>(null);

  const stop = index == null ? null : TOUR_STEPS[index] ?? null;

  useEffect(() => {
    if (!stop) return;
    if (ui.screen !== stop.screen) setUi({ screen: stop.screen });
  }, [stop, ui.screen, setUi]);

  useLayoutEffect(() => {
    if (!stop) {
      setBox(null);
      return;
    }
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${stop.target}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      setBox(el ? el.getBoundingClientRect() : null);
    };
    measure();
    const id = window.setTimeout(measure, 40);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [stop, ui.screen]);

  if (index == null || !stop) return null;

  const last = index >= TOUR_STEPS.length - 1;
  const go = (next: number | null) => {
    if (next == null || next < 0 || next >= TOUR_STEPS.length) {
      setUi({ tourStep: null });
      return;
    }
    const s = TOUR_STEPS[next];
    setUi({ screen: s.screen, tourStep: next });
  };

  const tip = tipPosition(box);

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour-catch" onClick={() => go(null)} />
      {box && (
        <div
          className="tour-spot"
          style={{
            top: box.top - 6,
            left: box.left - 6,
            width: box.width + 12,
            height: box.height + 12,
          }}
        />
      )}
      <div className="tour-tip" style={{ top: tip.top, left: tip.left }}>
        <div className="kicker" style={{ color: 'var(--color-accent)' }}>
          Step {index + 1} of {TOUR_STEPS.length}
        </div>
        <div id="tour-title" className="block-title" style={{ marginTop: 4 }}>{stop.title}</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: '8px 0 0' }}>{stop.body}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 4, marginRight: 'auto' }}>
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 7, height: 7,
                  background: i === index ? 'var(--color-accent)' : 'var(--color-neutral-400)',
                }}
              />
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setUi({ tourStep: null, screen: HELP_SCREEN })}>
            Skip
          </button>
          {index > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => go(index - 1)}>Back</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => (last ? go(null) : go(index + 1))}>
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function tipPosition(box: DOMRect | null): { top: number; left: number } {
  const width = 380;
  const height = 280;
  const margin = 16;
  if (!box) {
    return {
      top: Math.max(margin, (window.innerHeight - height) / 2),
      left: Math.max(margin, (window.innerWidth - width) / 2),
    };
  }
  let top = box.bottom + 12;
  if (top + height > window.innerHeight - margin) top = box.top - height - 12;
  if (top < margin) top = margin;
  let left = box.left;
  if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
  if (left < margin) left = margin;
  return { top, left };
}
