/**
 * How to use it — a dedicated help surface in the same app, not a second site.
 *
 * Structure follows Onstrength's help page: a short hero, a "show me instead"
 * walkthrough, three pillars, then a five-minute version with an on-this-page
 * list. The ten numbered workflow steps stay in the sidebar; this screen is
 * extra, not an eleventh step.
 */

import React from 'react';
import { useStore } from '../state';
import { FIRST_STEP } from '../nav';
import { startTour } from '../Tour';
import {
  downloadCostEstimatesTemplate,
  downloadCurveTemplate,
  downloadReportedValuesTemplate,
} from '../../xlsx/templates';

const TOC = [
  { id: 'five-minute', label: 'The five-minute version' },
  { id: 'templates', label: '1. Get the templates' },
  { id: 'import', label: '2. Import any matching workbook' },
  { id: 'results', label: '3. Read the recalculation' },
  { id: 'compare', label: '4. Compare and prove completeness' },
  { id: 'exceptions', label: '5. Clear exceptions' },
  { id: 'questions', label: 'Questions people ask' },
  { id: 'your-data', label: 'Your data' },
];

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function RecalcHelp() {
  const { setUi } = useStore();

  return (
    <div className="help-page">
      <div className="help-hero-row">
        <div>
          <div className="help-kicker">ARO Recalculation</div>
          <h1 className="help-title">How to use it</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setUi({ screen: FIRST_STEP, tourStep: null })}>
          Open the tool
        </button>
      </div>

      <button
        className="btn btn-primary help-demo"
        onClick={() => startTour(setUi)}
      >
        Show me instead — 30 seconds
      </button>

      <p className="help-lead">
        Spreadsheet recalculations of asset retirement obligations bury the method
        in a thousand rows of DAYS360 and VLOOKUP. This tool does the same
        measurement in the browser: cost estimate escalated to the year end,
        escalated again to settlement, discounted back on the curve, compared to
        what was reported, and held until the exceptions are actually clear.
      </p>
      <p className="help-lead">
        It is not tied to a particular source system. Any workbook with the
        required columns can be imported — fill a template, or map the columns
        of an extract you already have.
      </p>

      <div className="help-pillars">
        <div>
          <div className="help-kicker">What it is</div>
          <p>
            An independent recalculation of ARO present and future values over
            the population in your extracts, with a completeness test against a
            trial-balance control total.
          </p>
        </div>
        <div>
          <div className="help-kicker">Why use it</div>
          <p>
            Every derived figure is reproducible as Excel, the exception list
            reads live state rather than checkboxes, and nothing is uploaded
            anywhere.
          </p>
        </div>
        <div>
          <div className="help-kicker">How it works</div>
          <p>
            Three workbooks in — cost estimates, reported values, interest rate
            curve — then ten steps from import to sign-off. Seeded demo data is
            already in the register so you can click around before you import.
          </p>
        </div>
      </div>

      <div className="help-layout">
        <nav className="help-toc" aria-label="On this page">
          <div className="help-kicker">On this page</div>
          <ul>
            {TOC.map((item) => (
              <li key={item.id}>
                <button type="button" className="help-toc-link" onClick={() => jump(item.id)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="help-body">
          <section id="five-minute">
            <h2>The five-minute version</h2>
            <p className="help-tagline">If you only read one thing</p>
            <ol className="help-steps">
              <li><strong>Templates.</strong> Download the three workbooks on Source extracts, or use your own files if the columns are there.</li>
              <li><strong>Import.</strong> Choose each workbook. Confirm the column mapping. Nothing enters the register until you say so.</li>
              <li><strong>Results.</strong> Each obligation is escalated and discounted independently. Open a row for the Excel form of the same calc.</li>
              <li><strong>Compare.</strong> Reported FV and PV sit beside the recalculation. Enter the trial-balance total so the population is proven complete.</li>
              <li><strong>Clear.</strong> Blockers on Exceptions &amp; clearance go when the data changes. Sign off on Variance &amp; sign-off when they are gone.</li>
            </ol>
          </section>

          <section id="templates">
            <h2>1. Get the templates</h2>
            <p>
              Three files, one job each. The names on the download are for you —
              the importer never looks at the filename.
            </p>
            <div className="help-downloads">
              <button className="btn btn-primary btn-sm" onClick={downloadCostEstimatesTemplate}>
                Cost estimates.xlsx
              </button>
              <button className="btn btn-primary btn-sm" onClick={downloadReportedValuesTemplate}>
                Reported values.xlsx
              </button>
              <button className="btn btn-primary btn-sm" onClick={downloadCurveTemplate}>
                Interest rate curve.xlsx
              </button>
            </div>
            <ul>
              <li><strong>Cost estimates</strong> — obligation number, cost estimate, cost estimate date.</li>
              <li><strong>Reported values</strong> — obligation number, settlement date, FV as reported, PV as reported.</li>
              <li><strong>Interest rate curve</strong> — valid on, term in years, interest rate.</li>
            </ul>
            <p>
              Replace the example rows. Keep the header row. Save as <strong>.xlsx</strong>
              (Excel Workbook). Older binary .xls files cannot be opened here — save
              them as .xlsx from Excel first.
            </p>
          </section>

          <section id="import">
            <h2>2. Import any matching workbook</h2>
            <p>
              On Source extracts, choose a file for each of the three slots. Cover
              sheets, title rows and oddly named columns are expected: the tool
              picks the busiest sheet, finds the header row, and maps columns by
              the words in the headings. Every guess is shown before the merge.
            </p>
            <p>
              If a column lands on the wrong field, pick the right one in the
              mapping panel. If a field is blank, that column was not found — name
              it in the workbook or point the picker at it.
            </p>
          </section>

          <section id="results">
            <h2>3. Read the recalculation</h2>
            <p>
              Calculation results is the independent measurement. Inflation and the
              FY year end in the header apply to every obligation. The discount
              rate is looked up on the curve at each obligation&apos;s term, rounded
              up to the next whole year. Day count is Excel DAYS360 / 360.
            </p>
            <p>
              Seeded demo obligations are there so the screen is not empty. Import
              cost estimates and they replace the seed. Reset to seed from the
              sidebar if you want the examples back.
            </p>
          </section>

          <section id="compare">
            <h2>4. Compare and prove completeness</h2>
            <p>
              Source comparison puts reported FV and PV beside the recalculation,
              flagged against the materiality in the header. The trial-balance
              control total lives here too: agreeing the extract to an independently
              sourced total is what proves the population complete. Without it, a
              perfect recalculation of half the balance still reads clean.
            </p>
          </section>

          <section id="exceptions">
            <h2>5. Clear exceptions</h2>
            <p>
              Exceptions &amp; clearance is not a checklist. Each item computes
              pass or fail from the register. A missing extract, a duplicate
              obligation number, a term past the end of the curve — they stay until
              the cause is gone. Variance &amp; sign-off then records that a
              conclusion was reached, and by whom.
            </p>
          </section>

          <section id="questions">
            <h2>Questions people ask</h2>
            <h3>Do I have to use a particular report from my ERP?</h3>
            <p>
              No. Any workbook with the required fields will do. Templates are
              the shortest path; a system extract works if you confirm the column
              mapping.
            </p>
            <h3>Can I import .xls?</h3>
            <p>
              Choose .xls or .xlsx. The reader understands the modern .xlsx
              (Office Open XML) format. If an older .xls fails, open it in Excel
              and save as .xlsx, then import that.
            </p>
            <h3>Where does the data go?</h3>
            <p>
              Nowhere. The file is opened in this page. The register is held in
              this browser&apos;s local storage. There is no server, no account, and
              no engagement to attach it to.
            </p>
          </section>

          <section id="your-data">
            <h2>Your data</h2>
            <p>
              Nothing leaves the browser. Export the recalculation workbook (with
              live formulas) from Calculation results or Raw dataset when you need
              working papers that stand without this tool. Starting a new
              recalculation from the sidebar discards the register on this machine;
              there is no undo and nothing is kept elsewhere.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
