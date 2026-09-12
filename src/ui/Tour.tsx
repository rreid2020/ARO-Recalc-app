/**
 * In-app walkthrough — the "Show me instead" path on How to use it.
 *
 * Six short stops over the live tool, not a video. Each step names a
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
    title: 'The numbered steps',
    body: 'Prepare, Measure, Assure — extracts in, independent recalculation, then exceptions and sign-off. Single obligation is the one-page calculator when you are not importing a population. You can jump to any step; nothing here is a wizard you cannot leave.',
  },
  {
    target: 'tour-templates',
    screen: 'recalc-import',
    title: 'Templates, not report names',
    body: 'Download the three workbooks and fill them, or use any .xlsx whose columns cover the same fields. The filename and the source system do not matter.',
  },
  {
    target: 'tour-import',
    screen: 'recalc-import',
    title: 'Import, then map',
    body: 'Choose a workbook. The sheet, the header row and every column are guesses until you look — confirm the mapping and only then does anything enter the register.',
  },
  {
    target: 'tour-metrics',
    screen: 'recalc-import',
    title: 'The portfolio, live',
    body: 'These totals recompute as extracts land. Re-calculated closing PV is the independent figure; source PV is what was reported. The difference is the variance the rest of the tool explains.',
  },
  {
    target: 'tour-results',
    screen: 'recalculation',
    title: 'Obligation by obligation',
    body: 'Each row escalates the cost estimate to the year end, then to settlement, then discounts back on the curve. Open a row for the same calculation written as Excel.',
  },
  {
    target: 'tour-exceptions',
    screen: 'recalc-exceptions',
    title: 'Nothing ticked away',
    body: 'A blocker means the recalculation cannot be concluded; a review needs an explanation on file. Each item reads live state — it clears when the data that caused it changes.',
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
  const width = 340;
  const height = 220;
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
