/**
 * The app shell — SCREENS.md, "Layout pattern".
 *
 * "Fixed left sidebar (dark, ~230px) ... the step list grouped by phase ...
 * Main column: a header strip with the step name, its one-line purpose and its
 * actions, then content in full-width bordered blocks separated by 2px rules."
 *
 * The Suite's sidebar opens with a tenant picker and a reporting-unit picker
 * and closes with a role switcher. None of the three has anything to pick here:
 * one register, one user, no tenancy. What replaces them is the only context
 * this tool has that the register does not already show — whose engagement it
 * is, and whether the work is actually being saved.
 */

import React, { useState } from 'react';
import { useStore } from './state';
import { PHASES, STEPS, resolveScreen, stepById, stepNumber } from './nav';
import { exceptions } from '../core/recalc';
import { AroWordmark } from './Logo';
import { Screen } from './screens';

const RULE = '1px solid color-mix(in srgb,var(--color-bg) 20%,transparent)';

export function Shell() {
  const { state, ui, setUi, setEngagement, reset, storageBlocked } = useStore();
  const screen = resolveScreen(ui.screen);
  const step = stepById(screen)!;
  const report = exceptions(state.reg);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      {/* ── sidebar ──────────────────────────────────────────────────── */}
      <nav
        style={{
          width: 244, flex: 'none',
          background: 'var(--color-accent-900)', color: 'var(--color-bg)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}
      >
        <div style={{ padding: '16px 18px', borderBottom: RULE }}>
          <AroWordmark />
        </div>

        <div style={{ padding: '14px 18px', borderBottom: RULE, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="engagement" style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65 }}>
            Engagement
          </label>
          <input
            id="engagement"
            className="input"
            value={state.engagement}
            placeholder="Entity being tested"
            title="The entity whose figures are being recalculated. It names the export and appears on the completeness statement."
            onChange={(e) => setEngagement(e.target.value)}
            style={{
              minHeight: 30, fontSize: 12, padding: '2px 6px',
              background: 'transparent', color: 'var(--color-bg)',
              borderColor: 'color-mix(in srgb,var(--color-bg) 40%,transparent)',
            }}
          />
          <div style={{ fontSize: 10.5, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>
            FY end {state.reg.fyEnd} · {state.reg.rows.length.toLocaleString('en-US')} obligation
            {state.reg.rows.length === 1 ? '' : 's'}
          </div>
        </div>

        <div style={{ padding: '12px 10px 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PHASES.map((phase) => (
            <React.Fragment key={phase}>
              <div style={{ fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.45, padding: '10px 10px 4px' }}>
                {phase}
              </div>
              {STEPS.filter((s) => s.phase === phase).map((s) => (
                <SideButton
                  key={s.id}
                  active={screen === s.id}
                  label={s.label}
                  title={s.purpose}
                  num={stepNumber(s.id)}
                  // The blocker count rides on the step that clears them, so the
                  // sidebar says how much is outstanding without being opened.
                  // It is not a badge for its own sake: it is the reason the
                  // conclusion is still being held.
                  badge={s.id === 'recalc-exceptions' && report.blockers ? String(report.blockers) : ''}
                  onClick={() => setUi({ screen: s.id })}
                />
              ))}
            </React.Fragment>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '14px 18px', borderTop: RULE, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65 }}>
            {storageBlocked ? 'Not being saved' : 'Saved on this machine'}
          </div>
          <div style={{ fontSize: 10.5, lineHeight: 1.45, opacity: 0.72, textWrap: 'pretty' }}>
            {storageBlocked
              ? 'Browser storage is full or unavailable, so this register will not survive a reload. Export the workbook before closing the tab.'
              : 'Nothing leaves this browser. The extracts, the register and the conclusion are held in local storage only.'}
          </div>
          <ResetButton onReset={reset} />
        </div>
      </nav>

      {/* ── main column ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            padding: '14px 26px', borderBottom: '2px solid var(--color-divider)',
          }}
        >
          <div style={{ marginRight: 'auto', minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }} className="muted">
              {state.engagement.trim() || 'Unnamed engagement'} · {step.phase}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {step.label}
            </div>
            <div style={{ fontSize: 12, marginTop: 2, textWrap: 'pretty', maxWidth: '78ch' }} className="muted">
              {step.purpose}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
            <span className={`tag tag-${report.clear ? 'accent' : 'bad'}`}>
              {report.clear ? 'CLEAR' : `${report.blockers} BLOCKER${report.blockers === 1 ? '' : 'S'}`}
            </span>
          </div>
        </header>

        <main style={{ flex: 1, minWidth: 0, padding: '22px 26px 60px' }}>
          <Screen screen={screen} />
        </main>
      </div>
    </div>
  );
}

/**
 * Reset asks first, in place.
 *
 * A browser `confirm()` would do the job, but it puts the question in the
 * chrome rather than in the tool, and what is being destroyed is an append-only
 * log. So the button becomes the question, and stays that way until it is
 * answered.
 */
function ResetButton({ onReset }: { onReset: () => void }) {
  const [arming, setArming] = useState(false);
  const outline: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid color-mix(in srgb,var(--color-bg) 40%,transparent)',
    color: 'var(--color-bg)', padding: '5px 8px', fontSize: 11,
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  };

  if (!arming) {
    return <button style={outline} onClick={() => setArming(true)}>Start a new recalculation</button>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10.5, lineHeight: 1.45, opacity: 0.85, textWrap: 'pretty' }}>
        This discards the register, the imported extracts, the conclusion and the action log. There is no undo and
        nothing is kept elsewhere.
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...outline, borderColor: 'var(--bad)', color: 'var(--bad)' }} onClick={() => { setArming(false); onReset(); }}>
          Discard everything
        </button>
        <button style={outline} onClick={() => setArming(false)}>Keep it</button>
      </div>
    </div>
  );
}

function SideButton({
  active, label, title, num, badge, onClick,
}: {
  active: boolean; label: string; title: string; num: string; badge?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
        background: active ? 'color-mix(in srgb,var(--color-bg) 16%,transparent)' : 'transparent',
        color: 'var(--color-bg)', border: 0, padding: '7px 10px',
        cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12,
      }}
    >
      <span style={{ width: 16, flex: 'none', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 9.5, fontVariantNumeric: 'tabular-nums', opacity: 0.6 }}>
        {num}
      </span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {badge && (
        <span style={{
          flex: 'none', background: 'var(--bad)', color: 'var(--color-bg)',
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 9.5,
          padding: '1px 5px', fontVariantNumeric: 'tabular-nums',
        }}>{badge}</span>
      )}
    </button>
  );
}
