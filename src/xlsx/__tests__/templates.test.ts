import { describe, expect, it } from 'vitest';
import { autoMap, readSheet } from '../read';
import {
  TEMPLATE_HEADERS,
  costEstimatesTemplate,
  curveTemplate,
  reportedValuesTemplate,
} from '../templates';
import { build } from '../write';

async function read(sheets: ReturnType<typeof costEstimatesTemplate>) {
  return readSheet(new Uint8Array(await build(sheets).arrayBuffer()));
}

describe('extract templates', () => {
  it('round-trips the cost estimates template onto the mapped fields', async () => {
    const sheet = await read(costEstimatesTemplate());
    expect(sheet.sheetName).toBe('Cost estimates');
    expect(sheet.headers.slice(0, 3).map((h) => h.label)).toEqual([...TEMPLATE_HEADERS.costEstimates]);
    expect(autoMap('rep04', sheet.headers)).toEqual({ id: 0, cost: 1, costEstimateDate: 2 });
    expect(sheet.rows.length).toBeGreaterThanOrEqual(3);
  });

  it('round-trips the reported values template onto the mapped fields', async () => {
    const sheet = await read(reportedValuesTemplate());
    expect(sheet.sheetName).toBe('Reported values');
    expect(sheet.headers.slice(0, 4).map((h) => h.label)).toEqual([...TEMPLATE_HEADERS.reportedValues]);
    expect(autoMap('rep06', sheet.headers)).toEqual({
      id: 0,
      settlementDate: 1,
      fv: 2,
      pv: 3,
    });
  });

  it('round-trips the curve template onto the mapped fields', async () => {
    const sheet = await read(curveTemplate());
    expect(sheet.sheetName).toBe('Interest rate curve');
    expect(sheet.headers.slice(0, 3).map((h) => h.label)).toEqual([...TEMPLATE_HEADERS.curve]);
    expect(autoMap('curve', sheet.headers)).toEqual({ validOn: 0, term: 1, rate: 2 });
    expect(sheet.rows.length).toBeGreaterThanOrEqual(4);
  });
});
