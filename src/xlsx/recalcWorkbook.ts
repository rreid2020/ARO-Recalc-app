/**
 * The recalculation as a live Excel workbook.
 *
 * Every derived figure is a **formula**, never a value: each row references its
 * own inputs, the assumptions sheet and a VLOOKUP into the curve. The auditor
 * can change the inflation rate on the Assumptions sheet and watch the whole
 * register move, or delete the tool entirely and still hold working papers that
 * stand on their own.
 *
 * ENGINE-SPEC §9: "Variance formulas in exports stay self-contained and
 * paste-ready." Nothing here references an external workbook, and the writer
 * sets recalculate-on-open so Excel evaluates the lot on load.
 *
 * Pure: it returns sheets. `download` in `write.ts` does the I/O.
 */

import { RecalcRegister, assumptionsOf, curveInForce } from '../core/recalc';
import { sortedCurve, sourceFigures } from '../engine/recalc';
import { coerceDayCount, excelYearFraction, isThirty360 } from '../engine/dates';
import { Cell, S, Sheet, colName } from './write';

const head = (t: string): Cell => ({ v: t, s: S.head });

const RESULT_HEADERS = [
  'ARO obligation no.',
  'Cost estimate',
  'Cost estimate date',
  'Settlement date',
  'Modified cost estimate date (leap-year adj.)',
  'Discount rate override %',
  'Term to settlement',
  'Curve term (rounded up)',
  'Discount rate %',
  'Inflation %',
  'Escalation term to FY end',
  'Escalation term to settlement',
  'Cost estimate at FY end',
  'FV at settlement',
  'PV at FY year end',
  'FV as reported',
  'PV as reported',
  'FV variance',
  'PV variance',
  'PV variance % of reported',
  'Materiality test',
];

/** Columns totalled on the footer row: cost through reported PV. */
const TOTALLED = 'MNOPQRS';

export function recalcWorkbook(reg: RecalcRegister, exportedAt: string): Sheet[] {
  const a = assumptionsOf(reg);
  const curve = curveInForce(reg);
  const points = sortedCurve(curve);
  const dayCount = coerceDayCount(a.dayCount);
  const leapF = (costCell: string, fyRef: string) =>
    isThirty360(dayCount)
      ? `IF(OR(MOD(YEAR(${costCell}),400)=0,AND(MOD(YEAR(${costCell}),4)=0,MOD(YEAR(${costCell}),100)<>0)),${fyRef}+1,${fyRef})`
      : fyRef;

  /* ── Results ──────────────────────────────────────────────────────── */

  const results: Cell[][] = [
    [{ v: 'ARO re-calculation — results', s: S.title }],
    [
      {
        v: 'Every shaded column is a formula. Inputs are white; assumptions live on the Assumptions sheet and the discount rate is a VLOOKUP into the Curve sheet.',
      },
    ],
    RESULT_HEADERS.map(head),
  ];

  reg.rows.forEach((row, i) => {
    const r = 4 + i;
    const s = sourceFigures(row);
    results.push([
      { v: String(row.id) },
      { v: row.cost, s: S.money },
      { v: row.costEstimateDate, t: 'd' },
      { v: row.settlementDate, t: 'd' },
      {
        f: leapF(`C${r}`, 'Assumptions!$B$3'),
        s: S.date,
      },
      // Percent in the sheet, decimal in the engine — the workbook is read by
      // people, and a rate column of 0.0337 is a support call.
      row.rateOverride != null ? { v: row.rateOverride * 100, s: S.rate } : null,
      { f: excelYearFraction('Assumptions!$B$3', `D${r}`, dayCount), s: S.term },
      { f: `MIN(MAX(ROUNDUP(G${r},0),1),Curve!$E$1)` },
      { f: `IF(F${r}<>"",F${r},VLOOKUP(H${r},Curve!$A$2:$B$1000,2,FALSE))`, s: S.rate },
      { f: 'Assumptions!$B$4', s: S.rate },
      { f: excelYearFraction(`C${r}`, 'Assumptions!$B$3', dayCount), s: S.term },
      { f: excelYearFraction(`E${r}`, `D${r}`, dayCount), s: S.term },
      { f: `B${r}*(1+J${r}/100)^K${r}`, s: S.money },
      { f: `M${r}*(1+J${r}/100)^L${r}`, s: S.money },
      { f: `N${r}/(1+I${r}/100)^G${r}`, s: S.money },
      s.has ? { v: s.fv, s: S.money } : null,
      s.has ? { v: s.pv, s: S.money } : null,
      { f: `IF(P${r}="","",P${r}-N${r})`, s: S.money },
      { f: `IF(Q${r}="","",Q${r}-O${r})`, s: S.money },
      { f: `IF(Q${r}="","",(Q${r}-O${r})/Q${r}*100)`, s: S.term },
      {
        f: `IF(Q${r}="","NO SOURCE DATA",IF(OR(ABS(ROUND(Q${r}-O${r},2))>Assumptions!$B$5,ABS(ROUND(Q${r}-O${r},2)/Q${r}*100)>Assumptions!$B$6),"VARIANCE","PASS"))`,
      },
    ]);
  });

  const last = 3 + reg.rows.length;
  const total: Cell[] = [{ v: 'Portfolio total', s: S.bold }];
  for (let c = 1; c < 20; c++) {
    const L = colName(c);
    total.push(TOTALLED.indexOf(L) >= 0 ? { f: `SUM(${L}4:${L}${last})`, s: S.money } : null);
  }
  total.push({ f: `COUNTIF(U4:U${last},"VARIANCE")&" flagged of "&COUNTA(U4:U${last})`, s: S.bold });
  results.push([]);
  results.push(total);

  /* ── Assumptions ──────────────────────────────────────────────────── */

  const assumptions: Cell[][] = [
    [{ v: 'Assumptions', s: S.title }],
    [],
    [{ v: 'FY year end (valuation date)', s: S.bold }, { v: reg.fyEnd, t: 'd' }],
    [{ v: 'Inflation rate % — all obligations', s: S.bold }, { v: a.inflation * 100, s: S.rate }],
    [{ v: 'Materiality — absolute', s: S.bold }, { v: reg.materiality.usd, s: S.money }],
    [{ v: 'Materiality — relative (%)', s: S.bold }, { v: reg.materiality.pct, s: S.term }],
    [],
    [{ v: 'Curve vintage', s: S.bold }, { v: curve.asAt }],
    [{ v: 'Curve source', s: S.bold }, { v: reg.curveSource || 'Built-in FY26 curve' }],
    [
      { v: 'Cost estimate source', s: S.bold },
      { v: reg.rep04?.summary || 'not imported — register entered manually' },
    ],
    [{ v: 'Cost estimate extracts', s: S.bold }, { v: (reg.rep04?.files ?? []).join('; ') || '—' }],
    [
      { v: 'Reported-values source', s: S.bold },
      { v: reg.rep06?.summary || 'not imported — no reported FV/PV' },
    ],
    [{ v: 'Reported-values extracts', s: S.bold }, { v: (reg.rep06?.files ?? []).join('; ') || '—' }],
    [{ v: 'Day count', s: S.bold }, { v: dayCount }],
    [
      { v: 'Leap-year adjustment', s: S.bold },
      {
        v: isThirty360(dayCount)
          ? 'Cost estimate dated in a leap year: escalation to settlement runs from the day after the FY year end (column E)'
          : 'Not applied — actual day counts already include leap days, so escalation runs from the FY year end',
      },
    ],
    [{ v: 'Signed off', s: S.bold }, { v: reg.signedOff ? `${reg.signedOff.by} · ${reg.signedOff.at}` : 'not signed' }],
    [{ v: 'Exported', s: S.bold }, { v: exportedAt }],
    [],
    [{ v: 'Completeness — source trial balance', s: S.title }],
  ];

  // The control total reconciles inside the workbook, so the completeness
  // conclusion survives without the tool that produced it.
  const tbRow = assumptions.length + 1;
  assumptions.push([
    { v: 'Total ARO PV per the source trial balance (manual entry)', s: S.bold },
    { v: reg.trialBalancePv ?? 0, s: S.money },
  ]);
  assumptions.push([
    { v: 'Total PV as reported across the register', s: S.bold },
    { f: `SUM(Results!Q4:Q${last})`, s: S.money },
  ]);
  assumptions.push([
    { v: 'Unreconciled difference (TB less reported)', s: S.bold },
    { f: `B${tbRow}-B${tbRow + 1}`, s: S.money },
  ]);
  assumptions.push([
    { v: 'Total re-calculated PV', s: S.bold },
    { f: `SUM(Results!O4:O${last})`, s: S.money },
  ]);
  assumptions.push([
    { v: 'TB less re-calculated PV', s: S.bold },
    { f: `B${tbRow}-B${tbRow + 3}`, s: S.money },
  ]);

  /* ── Curve ────────────────────────────────────────────────────────── */

  const curveRows: Cell[][] = [
    [head('Term (yrs)'), head('Interest rate (%)'), null, { v: 'Max term', s: S.bold }, { f: 'MAX(A2:A1000)' }],
  ];
  points.forEach((p) => curveRows.push([{ v: p.term }, { v: p.rate * 100, s: S.rate }]));

  /* ── Method ───────────────────────────────────────────────────────── */

  const method: Cell[][] = [
    [{ v: 'Method — column by column', s: S.title }],
    [],
    [head('Column'), head('What it computes'), head('Excel formula (row 4)')],
  ];
  METHOD(dayCount).forEach(([col, what, formula]) =>
    method.push([{ v: col, s: S.bold }, { v: what }, { v: formula }]),
  );
  method.push([]);
  method.push([
    { v: 'Note', s: S.bold },
    {
      v: 'Recalculate on open is set, so Excel evaluates every formula on load. Nothing references an external workbook.',
    },
  ]);

  return [
    {
      name: 'Results',
      rows: results,
      freeze: 3,
      cols: [16, 18, 15, 14, 18, 13, 13, 13, 12, 10, 13, 15, 20, 20, 20, 20, 20, 16, 16, 14, 16],
    },
    { name: 'Assumptions', rows: assumptions, cols: [34, 42] },
    { name: 'Curve', rows: curveRows, cols: [12, 18, 4, 12, 10] },
    { name: 'Method', rows: method, cols: [10, 72, 78] },
  ];
}

const METHOD = (dayCount: string): [string, string, string][] => {
  const dc = coerceDayCount(dayCount);
  const leap = isThirty360(dc)
    ? '=IF(OR(MOD(YEAR(C4),400)=0,AND(MOD(YEAR(C4),4)=0,MOD(YEAR(C4),100)<>0)),Assumptions!$B$3+1,Assumptions!$B$3)'
    : '=Assumptions!$B$3';
  return [
  [
    'E',
    isThirty360(dc)
      ? 'Modified cost estimate date — the FY year end, moved on one day when the cost estimate date falls in a leap year (the extra day the 30/360 grid cannot carry)'
      : 'Modified cost estimate date — the FY year end (leap-year shift is not used on actual day counts)',
    leap,
  ],
  ['G', `Term from the FY year end to settlement, ${dc} — the discount term`, `=${excelYearFraction('Assumptions!$B$3', 'D4', dc)}`],
  [
    'H',
    'Curve term — the term rounded UP to the next whole year (the SAP convention), floored at 1 and capped at the end of the curve',
    '=MIN(MAX(ROUNDUP(G4,0),1),Curve!$E$1)',
  ],
  [
    'I',
    'Discount rate — looked up on the curve at the rounded term, unless an override is entered in F',
    '=IF(F4<>"",F4,VLOOKUP(H4,Curve!$A$2:$B$1000,2,FALSE))',
  ],
  ['J', 'Inflation rate from the assumptions sheet', '=Assumptions!$B$4'],
  ['K', `Escalation term from the cost estimate date to the FY year end, ${dc}`, `=${excelYearFraction('C4', 'Assumptions!$B$3', dc)}`],
  [
    'L',
    `Escalation term from the modified cost estimate date to settlement, ${dc}`,
    `=${excelYearFraction('E4', 'D4', dc)}`,
  ],
  ['M', 'Cost estimate escalated to the FY year end', '=B4*(1+J4/100)^K4'],
  ['N', 'FV — escalated again from the modified cost estimate date to settlement', '=M4*(1+J4/100)^L4'],
  ['O', 'PV — discounted from settlement back to the FY year end', '=N4/(1+I4/100)^G4'],
  ['R', 'FV variance, reported less re-calculated', '=IF(P4="","",P4-N4)'],
  ['S', 'PV variance, reported less re-calculated', '=IF(Q4="","",Q4-O4)'],
  ['T', 'PV variance as a % of the reported balance', '=IF(Q4="","",(Q4-O4)/Q4*100)'],
  [
    'U',
    'Materiality test against both thresholds on the Assumptions sheet — set both to 0 and any variance other than nil is flagged',
    '=IF(Q4="","NO SOURCE DATA",IF(OR(ABS(ROUND(Q4-O4,2))>Assumptions!$B$5,ABS(ROUND(Q4-O4,2)/Q4*100)>Assumptions!$B$6),"VARIANCE","PASS"))',
  ],
];
};
