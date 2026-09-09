/**
 * Blank workbooks a reviewer fills, then imports.
 *
 * The filename does not matter and neither does the source system. Each
 * template's header row uses the names `COLUMN_HINTS` maps first, plus two
 * example rows so the shape is obvious. A short Instructions sheet sits
 * alongside — fewer rows than the data sheet, so `readSheet` still takes the
 * grid rather than the notes.
 */

import { Cell, S, Sheet, download } from './write';

const head = (t: string): Cell => ({ v: t, s: S.head });

export const TEMPLATE_HEADERS = {
  costEstimates: ['ARO obligation no.', 'Cost estimate', 'Cost estimate date'],
  reportedValues: ['ARO obligation no.', 'Settlement date', 'FV of obligation', 'PV of obligation'],
  curve: ['Valid on', 'Term', 'Interest rate'],
} as const;

function instructions(title: string, lines: string[]): Sheet {
  return {
    name: 'Instructions',
    cols: [92],
    rows: [
      [{ v: title, s: S.title }],
      [{ v: lines.join(' ') }],
    ],
  };
}

export function costEstimatesTemplate(): Sheet[] {
  return [
    {
      name: 'Cost estimates',
      freeze: 3,
      cols: [22, 18, 22],
      rows: [
        [{ v: 'Cost estimates', s: S.title }],
        [{ v: 'Required columns: obligation number, cost estimate, cost estimate date. Filename and source system do not matter.' }],
        TEMPLATE_HEADERS.costEstimates.map(head),
        ['ARO-1001', { v: 1000000, s: S.money }, { v: '2025-03-31', t: 'd' }],
        ['ARO-1002', { v: 250000, s: S.money }, { v: '2024-09-30', t: 'd' }],
        ['ARO-1003', { v: 75000, s: S.money }, { v: '2026-03-31', t: 'd' }],
      ],
    },
    instructions(
      'Cost estimates template',
      [
        'Fill the Cost estimates sheet, save as .xlsx, and import it on Source extracts.',
        'Other column names that map automatically: Obligation ID, Asset no., Undiscounted cost, Estimate date.',
        'Replace the example rows with your population. Keep one header row.',
      ],
    ),
  ];
}

export function reportedValuesTemplate(): Sheet[] {
  return [
    {
      name: 'Reported values',
      freeze: 3,
      cols: [22, 18, 20, 20],
      rows: [
        [{ v: 'Reported values', s: S.title }],
        [{ v: 'Required columns: obligation number, settlement date, FV as reported, PV as reported. Filename and source system do not matter.' }],
        TEMPLATE_HEADERS.reportedValues.map(head),
        ['ARO-1001', { v: '2036-06-30', t: 'd' }, { v: 1400000, s: S.money }, { v: 980000, s: S.money }],
        ['ARO-1002', { v: '2031-12-31', t: 'd' }, { v: 310000, s: S.money }, { v: 240000, s: S.money }],
        ['ARO-1003', { v: '2029-03-31', t: 'd' }, { v: 90000, s: S.money }, { v: 72000, s: S.money }],
      ],
    },
    instructions(
      'Reported values template',
      [
        'Fill the Reported values sheet, save as .xlsx, and import it on Source extracts.',
        'Other column names that map automatically: Retirement date, Fair value, Present value, Future value.',
        'Replace the example rows with the figures your source system reported. Keep one header row.',
      ],
    ),
  ];
}

export function curveTemplate(): Sheet[] {
  return [
    {
      name: 'Interest rate curve',
      freeze: 3,
      cols: [16, 12, 16],
      rows: [
        [{ v: 'Interest rate curve', s: S.title }],
        [{ v: 'Required columns: valid on (vintage), term in years, interest rate. Rates may be decimals (0.0234) or percents (2.34) — the import normalises them.' }],
        TEMPLATE_HEADERS.curve.map(head),
        [{ v: '2026-03-31', t: 'd' }, 1, 2.34],
        [{ v: '2026-03-31', t: 'd' }, 5, 3.1],
        [{ v: '2026-03-31', t: 'd' }, 10, 3.65],
        [{ v: '2026-03-31', t: 'd' }, 20, 4.12],
      ],
    },
    instructions(
      'Interest rate curve template',
      [
        'Fill the Interest rate curve sheet, save as .xlsx, and import it on Source extracts.',
        'Other column names that map automatically: As of, As at, Years, Tenor, Yield.',
        'Use one vintage (Valid on) matching the FY year end. Extra vintages in the same sheet are offered at import.',
      ],
    ),
  ];
}

export function downloadCostEstimatesTemplate(): void {
  download('ARO-cost-estimates-template.xlsx', costEstimatesTemplate());
}

export function downloadReportedValuesTemplate(): void {
  download('ARO-reported-values-template.xlsx', reportedValuesTemplate());
}

export function downloadCurveTemplate(): void {
  download('ARO-interest-rate-curve-template.xlsx', curveTemplate());
}
