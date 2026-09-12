/**
 * Single-obligation calculator — one page for assumptions, inputs, results,
 * external-source variance, and the calculation that produced the figures.
 *
 * The arithmetic is the same chain as Calculation results. The scratch row
 * lives on `reg.worksheet`, not in the extract population.
 */

import React, { useState } from 'react';
import { useRegister } from '../state';
import {
  applyInflation,
  curveInForce,
  emptyWorksheet,
  worksheetOf,
} from '../../core/recalc';
import { formulasFor } from '../../core/recalcFormulas';
import { money, parseNumber } from '../../core/format';
import { DAY_COUNTS, coerceDayCount, excelYearFraction, isThirty360 } from '../../engine/dates';
import {
  Materiality,
  RecalcAssumptions,
  RecalcRow,
  recalculate,
  recalcBridge,
  sourceFigures,
  varianceFlag,
} from '../../engine/recalc';
import { SEED_ROWS } from '../../core/seed';
import { Block, Field, Stats, Tag } from '../components';
import { FormulaPanel } from './recalc';

const signed = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return `${r > 0 ? '+' : r < 0 ? '-' : ''}${money(Math.abs(r))}`;
};
const ratePct = (n: number) => `${(n * 100).toFixed(5)}%`;
const isoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const q = (s: string) => `"${s}"`;

const GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
  gap: 16,
};

export function RecalcSingle() {
  const { reg, set } = useRegister();
  const stored = worksheetOf(reg);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const dv = (k: string, v: string) => draft[k] ?? v;
  const commit = (k: string) => setDraft((d) => {
    const n = { ...d };
    delete n[k];
    return n;
  });

  const inflation = livePct(draft, 'infl', reg.inflation);
  const fyEnd = draft.fyEnd ?? reg.fyEnd;
  const a: RecalcAssumptions = {
    fyEnd,
    inflation,
    dayCount: coerceDayCount(reg.dayCount),
  };
  const materiality = {
    usd: liveAbs(draft, 'mu', reg.materiality.usd),
    pct: liveAbs(draft, 'mp', reg.materiality.pct),
  };
  const row = liveRow(stored, draft);
  const curve = curveInForce(reg);
  const k = recalculate(row, a, curve);
  const s = sourceFigures(row);
  const fvVar = s.has ? s.fv - k.fv : null;
  const pvVar = s.has ? s.pv - k.pv : null;
  const flag = s.has ? varianceFlag(s.pv - k.pv, s.pv, materiality) : null;
  const bridge = s.has ? recalcBridge(row, a, curve) : null;
  const ready = row.cost > 0 && isoDate(row.costEstimateDate) && isoDate(row.settlementDate) && isoDate(a.fyEnd);
  const formulas = formulasFor(row, a, curve, materiality);
  const dayCount = coerceDayCount(a.dayCount);

  const saveRow = (next: RecalcRow, action: string) => set(action, { worksheet: next }, next.id || undefined);

  const patchRow = (partial: Partial<RecalcRow>, action: string) => {
    saveRow({ ...stored, ...partial }, action);
  };

  return (
    <div data-tour="tour-single">
      <Block
        kicker="Single obligation"
        title="Assumptions, inputs, PV and FV"
        note="The same chain the extract workflow uses — escalate the cost estimate to the year end, escalate again to settlement, discount back — on one page. The register's inflation, year end, day count and materiality are the ones used here, so a change on this page applies everywhere."
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => { setDraft({}); saveRow({ ...SEED_ROWS[0] }, 'Load example obligation'); }}>
              Load example
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDraft({}); saveRow(emptyWorksheet(), 'Clear single obligation'); }}>
              Clear
            </button>
            {reg.rows.length > 0 && (
              <select
                className="input"
                value=""
                onChange={(e) => {
                  const found = reg.rows.find((r) => r.id === e.target.value);
                  if (!found) return;
                  setDraft({});
                  saveRow({ ...found }, 'Copy obligation into calculator');
                }}
                style={{ width: 'auto', minHeight: 32, fontSize: 12, padding: '2px 8px' }}
                aria-label="Copy an obligation from the register"
              >
                <option value="">Copy from register…</option>
                {reg.rows.map((r) => (
                  <option key={r.id} value={r.id}>{r.id || '(no id)'}</option>
                ))}
              </select>
            )}
          </>
        }
      >
        <div className="kicker" style={{ marginBottom: 8 }}>Assumptions</div>
        <div style={{ ...GRID, marginBottom: 22 }}>
          <Field label="FY year end (valuation date)" help="The reporting unit's financial year end. Every term is measured from or to this date.">
            <input
              className="input"
              type="date"
              autoComplete="off"
              value={dv('fyEnd', reg.fyEnd)}
              onChange={(e) => setDraft((d) => ({ ...d, fyEnd: e.target.value }))}
              onBlur={(e) => {
                commit('fyEnd');
                if (e.target.value && e.target.value !== reg.fyEnd) set('Set FY year end', { fyEnd: e.target.value });
              }}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
          <Field
            label="Inflation / escalation (%)"
            help="One rate, applied to every obligation. Editing it here also updates the named option currently in use in the assumptions library."
          >
            <input
              className="input num"
              inputMode="decimal"
              autoComplete="off"
              value={dv('infl', (reg.inflation * 100).toFixed(2))}
              onChange={(e) => setDraft((d) => ({ ...d, infl: e.target.value }))}
              onBlur={(e) => {
                commit('infl');
                const rate = parseNumber(e.target.value) / 100;
                if (!Number.isFinite(rate) || Math.abs(rate - reg.inflation) < 1e-12) return;
                set('Set inflation rate', applyInflation(reg.inflationPolicies, reg.inflation, rate));
              }}
            />
          </Field>
          <Field label="Day count" help="Year-fraction convention for every term: cost estimate date to year end, modified date to settlement, and year end to settlement for discounting.">
            <select
              className="input"
              value={dayCount}
              onChange={(e) => set('Set day count', { dayCount: coerceDayCount(e.target.value) })}
              style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}
            >
              {DAY_COUNTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Discount rate (%)"
            help="Leave blank to look the rate up on the interest rate curve at the rounded-up term from the FY year end to settlement. Enter a percent to override."
            hint={
              row.rateOverride == null
                ? `Curve: ${ratePct(k.rate)} at term ${k.curveTerm}${k.beyond ? ' (capped at the last published point)' : ''}`
                : 'Manual override. Clear the field to use the curve.'
            }
          >
            <input
              className="input num"
              inputMode="decimal"
              autoComplete="off"
              placeholder={(k.rate * 100).toFixed(5)}
              value={dv('rate', row.rateOverride == null ? '' : String(roundPct(row.rateOverride)))}
              onChange={(e) => setDraft((d) => ({ ...d, rate: e.target.value }))}
              onBlur={(e) => {
                commit('rate');
                const raw = e.target.value.trim();
                const next = raw === '' ? null : parseNumber(raw) / 100;
                const cur = stored.rateOverride ?? null;
                if (raw !== '' && !Number.isFinite(next as number)) return;
                if (sameOpt(cur, next)) return;
                patchRow({ rateOverride: next }, 'Set discount rate override');
              }}
            />
          </Field>
          <Field label="Materiality — absolute" help="A PV difference larger than this is flagged, whatever it is a proportion of. 0 flags any difference at all.">
            <input
              className="input num"
              inputMode="decimal"
              autoComplete="off"
              value={dv('mu', String(reg.materiality.usd))}
              onChange={(e) => setDraft((d) => ({ ...d, mu: e.target.value }))}
              onBlur={(e) => {
                commit('mu');
                const usd = Math.abs(parseNumber(e.target.value));
                if (!Number.isFinite(usd) || usd === reg.materiality.usd) return;
                set('Set absolute materiality', { materiality: { ...reg.materiality, usd } });
              }}
            />
          </Field>
          <Field label="Materiality — relative %" help="A PV difference larger than this share of the reported balance is flagged. Either threshold breaching is enough.">
            <input
              className="input num"
              inputMode="decimal"
              autoComplete="off"
              value={dv('mp', String(reg.materiality.pct))}
              onChange={(e) => setDraft((d) => ({ ...d, mp: e.target.value }))}
              onBlur={(e) => {
                commit('mp');
                const pct = Math.abs(parseNumber(e.target.value));
                if (!Number.isFinite(pct) || pct === reg.materiality.pct) return;
                set('Set relative materiality', { materiality: { ...reg.materiality, pct } });
              }}
            />
          </Field>
        </div>

        <div className="kicker" style={{ marginBottom: 8 }}>Obligation</div>
        <div style={{ ...GRID, marginBottom: 22 }}>
          <Field label="Obligation number" hint="Optional — for your working papers only.">
            <input
              className="input"
              autoComplete="off"
              value={dv('id', stored.id)}
              onChange={(e) => setDraft((d) => ({ ...d, id: e.target.value }))}
              onBlur={(e) => {
                commit('id');
                if (e.target.value !== stored.id) patchRow({ id: e.target.value }, 'Set obligation number');
              }}
            />
          </Field>
          <Field label="Cost estimate" help="Undiscounted cost in today's (estimate-date) money, before inflation.">
            <input
              className="input num"
              inputMode="decimal"
              autoComplete="off"
              value={dv('cost', stored.cost ? String(stored.cost) : '')}
              onChange={(e) => setDraft((d) => ({ ...d, cost: e.target.value }))}
              onBlur={(e) => {
                commit('cost');
                const cost = parseNumber(e.target.value);
                const next = Number.isFinite(cost) ? cost : 0;
                if (next !== stored.cost) patchRow({ cost: next }, 'Set cost estimate');
              }}
            />
          </Field>
          <Field label="Cost estimate date">
            <input
              className="input"
              type="date"
              autoComplete="off"
              value={dv('pk', stored.costEstimateDate)}
              onChange={(e) => setDraft((d) => ({ ...d, pk: e.target.value }))}
              onBlur={(e) => {
                commit('pk');
                if (e.target.value !== stored.costEstimateDate) patchRow({ costEstimateDate: e.target.value }, 'Set cost estimate date');
              }}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
          <Field label="Settlement date" help="The date the obligation is expected to settle — the current end date.">
            <input
              className="input"
              type="date"
              autoComplete="off"
              value={dv('st', stored.settlementDate)}
              onChange={(e) => setDraft((d) => ({ ...d, st: e.target.value }))}
              onBlur={(e) => {
                commit('st');
                if (e.target.value !== stored.settlementDate) patchRow({ settlementDate: e.target.value }, 'Set settlement date');
              }}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
        </div>

        <div className="kicker" style={{ marginBottom: 8 }}>External source — comparable figures</div>
        <div style={{ ...GRID, marginBottom: 8 }}>
          <Field
            label="FV as reported"
            help="The future value an external source published for this obligation. Both FV and PV are needed before a variance is struck."
          >
            <input
              className="input num"
              inputMode="decimal"
              autoComplete="off"
              placeholder="not entered"
              value={dv('sfv', stored.sourceFv == null ? '' : String(stored.sourceFv))}
              onChange={(e) => setDraft((d) => ({ ...d, sfv: e.target.value }))}
              onBlur={(e) => {
                commit('sfv');
                const raw = e.target.value.trim();
                const next = raw === '' ? null : parseNumber(raw);
                if (raw !== '' && !Number.isFinite(next as number)) return;
                if (sameOpt(stored.sourceFv ?? null, next)) return;
                patchRow({ sourceFv: next }, 'Set source FV');
              }}
            />
          </Field>
          <Field
            label="PV as reported"
            help="The present value an external source published. Compared to the recalculated PV against the materiality thresholds above."
          >
            <input
              className="input num"
              inputMode="decimal"
              autoComplete="off"
              placeholder="not entered"
              value={dv('spv', stored.sourcePv == null ? '' : String(stored.sourcePv))}
              onChange={(e) => setDraft((d) => ({ ...d, spv: e.target.value }))}
              onBlur={(e) => {
                commit('spv');
                const raw = e.target.value.trim();
                const next = raw === '' ? null : parseNumber(raw);
                if (raw !== '' && !Number.isFinite(next as number)) return;
                if (sameOpt(stored.sourcePv ?? null, next)) return;
                patchRow({ sourcePv: next }, 'Set source PV');
              }}
            />
          </Field>
        </div>
        {!s.has && (
          <p className="muted" style={{ fontSize: 12.5, margin: '0 0 8px' }}>
            Enter both a reported FV and a reported PV (each greater than zero) to calculate the variance.
          </p>
        )}
      </Block>

      <Block
        kicker="Results"
        title={ready ? (row.id ? `Obligation ${row.id}` : 'Recalculated values') : 'Waiting on inputs'}
        note={ready
          ? undefined
          : 'Enter a cost estimate, a cost estimate date, a settlement date and a FY year end. Figures below update as soon as those are in.'}
        actions={flag ? <Tag kind={flag === 'VARIANCE' ? 'bad' : 'neutral'}>{flag}</Tag> : undefined}
      >
        <Stats items={[
          { label: 'Cost estimate at FY end', value: money(k.cce) },
          { label: 'FV at settlement', value: money(k.fv) },
          { label: 'PV at FY year end', value: money(k.pv) },
          { label: 'FV variance (source − recalc)', value: fvVar == null ? '—' : signed(fvVar), tone: fvVar != null && Math.abs(Math.round(fvVar * 100) / 100) > 0.005 ? 'warn' : undefined },
          { label: 'PV variance (source − recalc)', value: pvVar == null ? '—' : signed(pvVar), tone: flag === 'VARIANCE' ? 'bad' : flag === 'PASS' ? 'ok' : undefined },
          { label: 'PV variance % of source', value: s.has && s.pv ? `${(((s.pv - k.pv) / s.pv) * 100).toFixed(4)}%` : '—' },
        ]} />
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>
          t1 {k.t1.toFixed(4)} yr · t2 {k.t2.toFixed(4)} yr · tD {k.tD.toFixed(4)} yr · discount {ratePct(k.rate)}
          {k.overridden ? ' (override)' : ` · curve term ${k.curveTerm}`}
          {k.leap ? ` · leap-year shift, modified date ${k.mcd}` : ''}
        </div>
      </Block>

      {bridge && (
        <Block
          kicker="Variance"
          title="Why the two PVs differ"
          note="The source publishes three figures and none of its assumptions, so its rates are back-solved over the recalculated terms. An implied rate absorbs everything in that leg — which is why the FV variance is shown separately from the discounting."
        >
          <Stats items={[
            { label: 'Implied inflation', value: `${(bridge.implied.inflation * 100).toFixed(4)}%` },
            { label: 'Implied discount rate', value: ratePct(bridge.implied.rate) },
            { label: 'Inflation / escalation step', value: signed(bridge.steps[0].amount) },
            { label: 'Discount-rate step', value: signed(bridge.steps[1].amount) },
          ]} />
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr>
                  <th>Input</th>
                  <th className="num">This recalculation</th>
                  <th className="num">Implied by the source</th>
                  <th>Agrees</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['Inflation rate', `${(a.inflation * 100).toFixed(4)}%`, `${(bridge.implied.inflation * 100).toFixed(4)}%`, near(a.inflation, bridge.implied.inflation)],
                    ['Discount rate', ratePct(k.rate), ratePct(bridge.implied.rate), near(k.rate, bridge.implied.rate)],
                    ['FV at settlement', money(k.fv), money(s.fv), Math.abs(k.fv - s.fv) < 0.005],
                    ['PV at FY year end', money(k.pv), money(s.pv), Math.abs(k.pv - s.pv) < 0.005],
                  ] as [string, string, string, boolean][]
                ).map(([label, ours, theirs, agrees]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td className="num">{ours}</td>
                    <td className="num">{theirs}</td>
                    <td>{agrees ? <Tag kind="neutral">agrees</Tag> : <Tag kind="bad">differs</Tag>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      )}

      <Block
        kicker="How it is calculated"
        title="The chain, with this page's numbers"
        note="Each step uses the figure above it. The Excel column underneath is the same chain restated so you can paste it into a blank sheet and reproduce every total unaided."
      >
        <div className="scroll-x" style={{ marginBottom: 18 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Step</th>
                <th>What it computes</th>
                <th>Expression</th>
                <th className="num">Value</th>
              </tr>
            </thead>
            <tbody>
              {walkthrough(row, a, k, s, flag, materiality, formulas).map((step) => (
                <tr key={step.label}>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, whiteSpace: 'nowrap' }}>{step.label}</td>
                  <td style={{ maxWidth: 280, whiteSpace: 'normal' }}>{step.what}</td>
                  <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, whiteSpace: 'normal', wordBreak: 'break-word' }}>{step.expr}</td>
                  <td className="num derived">{step.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isThirty360(dayCount) && (
          <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>
            {k.leap
              ? `On 30/360, a cost estimate dated in a leap year moves the second escalation boundary to the day after the FY year end — here that date is ${k.mcd}. Discounting still runs from the year end itself.`
              : 'On 30/360, a cost estimate dated in a leap year moves the second escalation boundary to the day after the FY year end. This cost estimate date is not in a leap year, so the boundary stays the year end. Discounting still runs from the year end itself.'}
          </p>
        )}
        <FormulaPanel row={row} reg={{ ...reg, fyEnd: a.fyEnd, inflation: a.inflation, materiality, dayCount }} />
      </Block>
    </div>
  );
}

function near(x: number, y: number) {
  return Math.abs(x - y) < 0.000005;
}

function sameOpt(a: number | null, b: number | null) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 1e-12;
}

function roundPct(decimal: number) {
  const p = decimal * 100;
  return Number.isInteger(p) ? p : parseFloat(p.toFixed(5));
}

function livePct(draft: Record<string, string>, key: string, committed: number): number {
  if (draft[key] == null) return committed;
  const n = parseNumber(draft[key]) / 100;
  return Number.isFinite(n) ? n : committed;
}

function liveAbs(draft: Record<string, string>, key: string, committed: number): number {
  if (draft[key] == null) return committed;
  const n = Math.abs(parseNumber(draft[key]));
  return Number.isFinite(n) ? n : committed;
}

function liveOpt(draft: Record<string, string>, key: string, committed: number | null, asPercent = false): number | null {
  if (draft[key] == null) return committed;
  const raw = draft[key].trim();
  if (!raw) return null;
  const n = parseNumber(raw);
  if (!Number.isFinite(n)) return committed;
  return asPercent ? n / 100 : n;
}

function liveRow(stored: RecalcRow, draft: Record<string, string>): RecalcRow {
  const costDraft = draft.cost;
  const cost = costDraft == null ? stored.cost : (Number.isFinite(parseNumber(costDraft)) ? parseNumber(costDraft) : stored.cost);
  return {
    id: draft.id ?? stored.id,
    cost: Number.isFinite(cost) ? cost : 0,
    costEstimateDate: draft.pk ?? stored.costEstimateDate,
    settlementDate: draft.st ?? stored.settlementDate,
    rateOverride: liveOpt(draft, 'rate', stored.rateOverride ?? null, true),
    sourceFv: liveOpt(draft, 'sfv', stored.sourceFv ?? null),
    sourcePv: liveOpt(draft, 'spv', stored.sourcePv ?? null),
  };
}

function walkthrough(
  row: RecalcRow,
  a: RecalcAssumptions,
  k: ReturnType<typeof recalculate>,
  s: ReturnType<typeof sourceFigures>,
  flag: ReturnType<typeof varianceFlag> | null,
  materiality: Materiality,
  formulas: ReturnType<typeof formulasFor>,
) {
  const dayCount = coerceDayCount(a.dayCount);
  const t1Expr = excelYearFraction(q(row.costEstimateDate || a.fyEnd), q(a.fyEnd), dayCount);
  const t2Expr = excelYearFraction('modified cost-estimate date', q(row.settlementDate || a.fyEnd), dayCount);
  const tDExpr = excelYearFraction(q(a.fyEnd), q(row.settlementDate || a.fyEnd), dayCount);

  const rows: { label: string; what: string; expr: string; value: string }[] = [
    {
      label: 'i',
      what: 'Inflation rate (decimal)',
      expr: `${(a.inflation * 100).toFixed(2)}% ÷ 100`,
      value: a.inflation.toFixed(4),
    },
    {
      label: 't1',
      what: `Escalation term, cost estimate date → FY year end (${dayCount})`,
      expr: t1Expr,
      value: k.t1.toFixed(4),
    },
    {
      label: 'CCE',
      what: 'Cost estimate escalated to the FY year end',
      expr: `${money(row.cost)} × (1 + i)^t1`,
      value: money(k.cce),
    },
    {
      label: 'MCD',
      what: isThirty360(dayCount)
        ? 'Modified cost estimate date — day after FY end when the cost estimate date is in a leap year'
        : 'Modified cost estimate date — the FY year end (leap-year shift is 30/360 only)',
      expr: k.leap ? `${a.fyEnd} + 1 day` : a.fyEnd,
      value: k.mcd || '—',
    },
    {
      label: 't2',
      what: `Escalation term, modified date → settlement (${dayCount})`,
      expr: t2Expr,
      value: k.t2.toFixed(4),
    },
    {
      label: 'FV',
      what: 'Future value at settlement',
      expr: `CCE × (1 + i)^t2`,
      value: money(k.fv),
    },
    {
      label: 'tD',
      what: `Discount term, FY year end → settlement (${dayCount})`,
      expr: tDExpr,
      value: k.tD.toFixed(4),
    },
    {
      label: 'r',
      what: k.overridden
        ? 'Discount rate — manual override'
        : `Discount rate — curve term ${k.curveTerm} (ROUNDUP of tD, floored at 1${k.beyond ? ', capped' : ''})`,
      expr: k.overridden ? `${ratePct(k.rate)} entered` : `curve[${k.curveTerm}] = ${ratePct(k.rate)}`,
      value: k.rate.toFixed(7),
    },
    {
      label: 'PV',
      what: 'Present value at the FY year end',
      expr: `FV ÷ (1 + r)^tD`,
      value: money(k.pv),
    },
  ];

  if (s.has) {
    rows.push(
      {
        label: 'ΔFV',
        what: 'FV variance (reported less recalculated)',
        expr: `${money(s.fv)} − ${money(k.fv)}`,
        value: signed(s.fv - k.fv),
      },
      {
        label: 'ΔPV',
        what: 'PV variance (reported less recalculated)',
        expr: `${money(s.pv)} − ${money(k.pv)}`,
        value: signed(s.pv - k.pv),
      },
      {
        label: 'Test',
        what: `Materiality — flagged above ${money(materiality.usd)} or ${materiality.pct}% of reported PV`,
        expr: formulas.find((f) => f.ref === 'A15')?.formula ?? '',
        value: flag ?? '—',
      },
    );
  }

  return rows;
}
