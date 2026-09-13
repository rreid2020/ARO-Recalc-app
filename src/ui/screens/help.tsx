/**
 * How to use it — a dedicated help surface in the same app, not a second site.
 *
 * Structure: a short hero, a walkthrough of every numbered step, three pillars,
 * then a reference that covers each screen, the calculation chain, exceptions,
 * and where the data lives. The numbered workflow stays in the sidebar; this
 * screen is extra.
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
  { id: 'chrome', label: 'The layout' },
  { id: 'one-page', label: 'Single obligation' },
  { id: 'templates', label: '01 · Source extracts' },
  { id: 'imported', label: '02 · Imported data' },
  { id: 'results', label: '04 · Calculation results' },
  { id: 'accretion', label: '05 · Results & accretion' },
  { id: 'compare', label: '06 · Source comparison' },
  { id: 'exceptions', label: '07 · Exceptions & clearance' },
  { id: 'variance', label: '08 · Variance & sign-off' },
  { id: 'audit', label: '09 · Audit trail' },
  { id: 'assumptions', label: '10 · Assumptions library' },
  { id: 'raw', label: '11 · Raw dataset' },
  { id: 'chain', label: 'How a figure is calculated' },
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
        Show me instead — walk through every step
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
        of an extract you already have. Or skip the extracts and price one
        obligation on Single obligation.
      </p>

      <div className="help-pillars">
        <div>
          <div className="help-kicker">What it is</div>
          <p>
            An independent recalculation of ARO present and future values, either
            for one obligation or over a whole extract, with a completeness test
            against a trial-balance control total.
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
            Eleven numbered steps in Prepare, Measure and Assure. Seeded demo
            data is already in the register so you can click around before you
            import. Reset to seed from the sidebar restores those three rows.
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
              <li>
                <strong>One obligation.</strong> Open Single obligation. Set
                inflation, the year end and the day count for that obligation —
                nothing there touches the register. Enter the cost estimate
                and dates. Optionally enter FV and PV an external source reported.
                Read CCE, FV, PV, the variance and the calculation underneath.
              </li>
              <li>
                <strong>A whole population.</strong> Download the three templates
                on Source extracts, or use your own .xlsx files if the columns
                are there. Confirm each mapping. Nothing enters the register until
                you say so.
              </li>
              <li>
                <strong>Results.</strong> Calculation results escalates and
                discounts every obligation. Open Calc for the Excel form of the
                same arithmetic. Results &amp; accretion shows the discount
                unwinding period by period.
              </li>
              <li>
                <strong>Compare.</strong> Source comparison puts reported FV and
                PV beside the recalculation. Enter the trial-balance ARO PV so
                the population is proven complete.
              </li>
              <li>
                <strong>Clear and conclude.</strong> Blockers on Exceptions &amp;
                clearance go when the data changes. Sign off on Variance &amp;
                sign-off when they are gone, with your name. Export working papers
                from Calculation results or Raw dataset.
              </li>
            </ol>
          </section>

          <section id="chrome">
            <h2>The layout</h2>
            <p>
              The sidebar is the whole tool: eleven numbered steps grouped as
              Prepare, Measure and Assure, plus How to use it, Reset to seed, and
              Start a new recalculation. You can jump to any step.
            </p>
            <p>
              The header strip (hidden on this help page) shows the FY year end
              and inflation as read-only — click either to edit them in the
              Assumptions library. Materiality is editable in the header: an
              absolute amount and a relative percent of the reported balance.
              Either threshold breaching flags a variance. Set both to 0 and
              nothing but an exact match passes. Flagged is how many compared
              obligations currently fail that test.
            </p>
            <p>
              Under the header, five portfolio totals recompute live: cost
              estimate at FY end, FV at settlement, recalculated closing PV,
              source PV on the covered rows, and net PV variance (reported less
              recalculated).
            </p>
            <p>
              Until all three extracts are imported, a banner says the figures
              are illustrative. Seeded demo data is three obligations so the
              screens are not empty. Reset to seed restores them. Start a new
              recalculation discards the register, the extracts, the conclusion
              and the action log — there is no undo.
            </p>
          </section>

          <section id="one-page">
            <h2>Single obligation</h2>
            <p className="help-tagline">Measure · step 03 — one page, no extracts required</p>
            <p>
              Use this when you are pricing one obligation rather than importing
              a population. Assumptions, the cost estimate and dates, comparable
              figures from an external source, the results, the variance bridge
              and the Excel restatement all sit on one page.
            </p>
            <ul>
              <li>
                <strong>Assumptions</strong> — FY year end, inflation %, day
                count, optional discount rate override, materiality $ and %.
                Blank discount rate looks the curve up at the rounded-up term.
                Each of these applies to this obligation alone: they open on the
                register&apos;s figures and follow them until you change one, and a
                change here is never written back to the register, the assumptions
                library or the extract population. Fields you have changed say so
                and offer Use register; Use register assumptions puts all of them
                back at once.
              </li>
              <li>
                <strong>Obligation</strong> — optional number, cost estimate,
                cost estimate date, settlement date.
              </li>
              <li>
                <strong>External source</strong> — FV as reported and PV as
                reported. Both must be greater than zero before a variance is
                struck. Variance is source minus recalculated, tested against
                materiality.
              </li>
              <li>
                <strong>How it is calculated</strong> — the chain with this
                page&apos;s numbers (t1, CCE, modified date, t2, FV, tD, r, PV,
                ΔFV, ΔPV, the materiality test), then the same chain written as
                Excel. Copy a formula, or Copy all and paste into A1 of a blank
                sheet.
              </li>
            </ul>
            <p>
              Load example fills the first seeded obligation. Copy from register
              pulls an imported row into this scratch pad. Clear empties it and
              hands the assumptions back to the register. The scratch pad is not an
              extract row: typing here does not add an obligation to the population
              or the exception list.
            </p>
          </section>

          <section id="templates">
            <h2>01 · Source extracts</h2>
            <p className="help-tagline">Prepare — load cost estimates, reported values, and a curve</p>
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
              <li>
                <strong>Cost estimates</strong> — obligation number, cost
                estimate, cost estimate date. Other headings that map
                automatically include Obligation ID, Asset no., Undiscounted
                cost, Estimate date.
              </li>
              <li>
                <strong>Reported values</strong> — obligation number, settlement
                date, FV as reported, PV as reported. Other headings include
                Retirement date, Fair value, Present value, Future value.
              </li>
              <li>
                <strong>Interest rate curve</strong> — valid on (vintage), term
                in years, interest rate. Rates may be decimals (0.0234) or
                percents (2.34). Extra vintages in the same sheet are offered at
                import; the vintage matching the year end is offered first.
              </li>
            </ul>
            <p>
              Replace the example rows. Keep one header row. Save as
              <strong> .xlsx</strong> (Excel Workbook). Older binary .xls files
              cannot be opened here — save them as .xlsx from Excel first.
            </p>
            <h3>Import, then map</h3>
            <p>
              Choose a file for each of the three slots. Cover sheets, title
              rows and oddly named columns are expected: the tool picks the
              busiest sheet, finds the header row, and maps columns by the words
              in the headings. Every guess is shown before the merge — sheet
              name, header row number, each field, and the first rows as this
              mapping reads them.
            </p>
            <p>
              If a column lands on the wrong field, pick the right one. If a
              field is blank, that column was not found — name it in the
              workbook or point the picker at it. Import into the register
              writes the extract. Cancel discards the staging.
            </p>
            <p>
              You can merge another workbook of the same kind afterwards. A first
              cost-estimate import replaces the seeded demo rows. Later
              cost-estimate files update matching obligation numbers and add new
              ones. Reported-values files attach settlement dates and source
              FV/PV onto matching numbers. The curve in force is the imported
              table, or the built-in FY26 curve until one is loaded — revert to
              the built-in from this screen if you need to.
            </p>
          </section>

          <section id="imported">
            <h2>02 · Imported data</h2>
            <p className="help-tagline">Prepare — the extract as it was read</p>
            <p>
              Switch between cost estimates, reported values and the curve to
              see the file, the mapped columns (marked on the header) and the
              rows. This is how a reader ties a figure in the recalculation back
              to a cell in the original workbook.
            </p>
            <p>
              These rows are held in memory for this browser session only. They
              are the client&apos;s data and never leave the machine, so they
              clear on reload. The register — the recalculated obligations —
              is what is saved.
            </p>
          </section>

          <section id="results">
            <h2>04 · Calculation results</h2>
            <p className="help-tagline">Measure — the independent measurement, row by row</p>
            <p>
              Each obligation is escalated to the FY year end, escalated again
              to settlement, then discounted back. Inflation, year end and day
              count come from the assumptions library. The discount rate is
              looked up on the curve at the term from year end to settlement,
              rounded up to the next whole year, floored at 1, capped at the
              last published point.
            </p>
            <p>
              You can edit obligation number, dates, cost estimate and reported
              FV/PV in the grid. Add obligation inserts a blank row. Filter by
              number or by flag (all, variances only, passing only, no source
              data). Calc opens the Excel restatement for that row. Explain
              jumps to Variance &amp; sign-off for that obligation. Export to
              Excel writes a workbook with live formulas.
            </p>
            <p>
              A row without both a reported FV and a reported PV (each greater
              than zero) cannot be compared — it shows NO SRC rather than a
              variance of the whole balance.
            </p>
          </section>

          <section id="accretion">
            <h2>05 · Results &amp; accretion</h2>
            <p className="help-tagline">Measure — the same measurement at later dates</p>
            <p>
              Pick an obligation. The schedule unwinds the discount from the
              recalculated PV at the year end to the FV at settlement, period
              by period. Nothing is posted from this — it is here so PV and FV
              can be seen to be the same measurement at different dates. The
              Excel formulas for that obligation sit underneath.
            </p>
          </section>

          <section id="compare">
            <h2>06 · Source comparison</h2>
            <p className="help-tagline">Measure — reported against recalculated, and the control total</p>
            <p>
              Enter the total ARO present value carried on the source trial
              balance. Nothing is derived from it. It exists to prove the
              extract population is complete, because a perfect recalculation of
              half the balance still reads clean. The status is NOT ENTERED,
              AGREES (within absolute materiality) or DIFFERENCE.
            </p>
            <p>
              Below that, every obligation that carries both reported figures is
              listed with recalculated FV/PV, reported FV/PV, the two
              variances, variance as a percent of reported PV, and the
              materiality flag. FV variance is shown separately on purpose: an
              FV that does not agree points at the cost estimate, the inflation
              rate or the dates, not at the discounting.
            </p>
          </section>

          <section id="exceptions">
            <h2>07 · Exceptions &amp; clearance</h2>
            <p className="help-tagline">Assure — evaluated, never asserted</p>
            <p>
              This is not a checklist. Each item computes pass or fail from the
              register. Resolve jumps to the step that can clear it. An
              exception cannot be ticked away — it goes when the data that
              caused it changes.
            </p>
            <h3>Blockers — the recalculation cannot be concluded</h3>
            <ul>
              <li>Cost estimates not imported</li>
              <li>Reported values not imported</li>
              <li>Duplicate obligation numbers</li>
              <li>Obligations with no cost estimate</li>
              <li>Obligations with no settlement date</li>
              <li>Trial balance total not entered</li>
              <li>Reported figures do not agree to the trial balance</li>
              <li>PV variances above materiality</li>
            </ul>
            <h3>Review — conclude, but explain on file first</h3>
            <ul>
              <li>FV variances above materiality</li>
              <li>Obligations with no source figures (outside the tested population)</li>
              <li>Interest rate curve not imported (built-in FY26 curve in use)</li>
              <li>Curve vintage may not match the year end</li>
              <li>Terms beyond the end of the curve (last rate applied flat)</li>
              <li>Manual discount rate overrides in use</li>
            </ul>
            <h3>Information</h3>
            <ul>
              <li>Materiality set to nil (every difference other than an exact match is flagged)</li>
              <li>Variance conclusion not signed off</li>
            </ul>
            <p>
              The sidebar badge on this step is the open blocker count. Clear to
              finalise means no blockers remain; reviews and info can still sit
              on file.
            </p>
          </section>

          <section id="variance">
            <h2>08 · Variance &amp; sign-off</h2>
            <p className="help-tagline">Assure — why one obligation differs, then who concluded</p>
            <p>
              Pick an obligation that carries both reported figures. The source
              publishes three numbers and none of its assumptions, so its
              inflation and discount rates are back-solved over the recalculated
              terms. Substituting them one at a time walks recalculated PV to
              reported PV with no residual. An implied rate absorbs everything
              in that leg — including a wrong cost estimate or a wrong date —
              which is why the steps are labelled by leg rather than by cause.
            </p>
            <p>
              Input by input puts our inflation, discount rate, FV and PV beside
              what the source figures imply. Accretion for that obligation is
              repeated here.
            </p>
            <p>
              Sign-off is held while any blocker is open. Enter the name of
              whoever concluded, then Sign off the variance analysis. The
              signature records who reached it; it does not certify their rank.
              Withdraw clears it if you need to reopen.
            </p>
          </section>

          <section id="audit">
            <h2>09 · Audit trail</h2>
            <p className="help-tagline">Assure — every write, newest first</p>
            <p>
              Importing an extract, editing a row, changing inflation or the
              year end, setting the trial balance, and signing off are prepended
              here with a timestamp, the name in the header if one has been
              typed, the action and a detail (usually the obligation number).
              This is the live log, not a canned demo.
            </p>
          </section>

          <section id="assumptions">
            <h2>10 · Assumptions library</h2>
            <p className="help-tagline">Assure — rates that apply to every obligation</p>
            <p>
              FY year end is the valuation date. Day count is the year-fraction
              convention for every term: 30/360 US (DAYS360) by default, or
              30E/360 (European), Actual/365, Actual/360, Actual/Actual. On
              30/360, a cost estimate dated in a leap year moves the second
              escalation boundary to the day after the year end; discounting
              still runs from the year end itself. Actual conventions already
              count the extra day, so that shift is not applied.
            </p>
            <p>
              Named inflation options are edited in the table — curve name,
              basis and rate. Set applies that rate to every obligation in the
              register, and to Single obligation unless that page has been given a
              rate of its own. Add option / Remove keep the library yours. The In
              use row is whichever rate currently matches the live inflation.
            </p>
            <p>
              The interest rate curve is listed with how many obligations hit
              each whole-year term. Import a client table on Source extracts.
              Until then the built-in FY26 curve (terms 1–30) is used and
              Exceptions &amp; clearance says so.
            </p>
          </section>

          <section id="raw">
            <h2>11 · Raw dataset</h2>
            <p className="help-tagline">Assure — the register as stored, and the exports</p>
            <p>
              Every stored field per obligation, plus CCE, FV and PV as
              currently calculated. Filter the same way as Calculation results.
            </p>
            <ul>
              <li>
                <strong>Excel (with formulas)</strong> — working papers that
                stand without this tool. Inflation, year end and the curve are
                on the assumptions, not copied onto every row.
              </li>
              <li><strong>CSV</strong> — the stored fields only, one row per obligation.</li>
              <li>
                <strong>JSON</strong> — year end, inflation, day count,
                inflation options, materiality and the obligation list.
              </li>
            </ul>
          </section>

          <section id="chain">
            <h2>How a figure is calculated</h2>
            <p>
              One chain, used on Single obligation and on every extract row.
            </p>
            <ol className="help-steps">
              <li>
                <strong>t1</strong> — year fraction from the cost estimate date
                to the FY year end, on the selected day count.
              </li>
              <li>
                <strong>CCE</strong> — cost estimate × (1 + inflation)^t1. The
                cost at the year end.
              </li>
              <li>
                <strong>Modified cost estimate date</strong> — the year end,
                except on 30/360 when the cost estimate date falls in a leap
                year, in which case it is the next day.
              </li>
              <li>
                <strong>t2</strong> — year fraction from that modified date to
                settlement.
              </li>
              <li>
                <strong>FV</strong> — CCE × (1 + inflation)^t2. The future value
                at settlement.
              </li>
              <li>
                <strong>tD</strong> — year fraction from the FY year end to
                settlement (the leap-year shift does not apply here).
              </li>
              <li>
                <strong>r</strong> — the curve rate at ROUNDUP(tD), floored at 1
                year and capped at the last published term, unless a manual
                override is in force.
              </li>
              <li>
                <strong>PV</strong> — FV ÷ (1 + r)^tD. The present value at the
                year end — the recalculated provision.
              </li>
              <li>
                <strong>Variance</strong> — reported minus recalculated, for FV
                and for PV, when both source figures are present and positive.
                Flagged if the absolute PV difference exceeds materiality $ or
                materiality % of the reported PV.
              </li>
            </ol>
            <p>
              The Excel panel restates that chain as cells A1–A15. Paste the
              formula column into A1 of a blank sheet and every figure
              reproduces, unaided and offline.
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
            <h3>Does Single obligation change the extract?</h3>
            <p>
              No. It is a scratch calculation, and that now includes its
              assumptions: the year end, inflation, day count and materiality you
              set there apply to that one obligation, so the register&apos;s
              assumptions, its totals and its exceptions do not move. The cost,
              dates and source figures stay on that page too — edit the extract
              itself on Calculation results.
            </p>
            <p>
              Until you change one, each assumption follows the register, so the
              page opens on the figures in force. A changed field is labelled and
              can be handed back with Use register, or all of them at once with Use
              register assumptions.
            </p>
            <h3>Why is the discount rate not a column I can type?</h3>
            <p>
              For the extract population the rate is looked up on the curve —
              that is the source system&apos;s own convention. Type an override
              on Single obligation when you are pricing one row off-curve. A
              row that already carries an override is flagged for review.
            </p>
            <h3>Where does the data go?</h3>
            <p>
              Nowhere. The file is opened in this page. The register is held in
              this browser&apos;s local storage. There is no server, no account,
              and no engagement to attach it to. If storage is full the sidebar
              says so — export before you close the tab.
            </p>
          </section>

          <section id="your-data">
            <h2>Your data</h2>
            <p>
              Nothing leaves the browser. Export the recalculation workbook
              (with live formulas) from Calculation results or Raw dataset when
              you need working papers that stand without this tool. Starting a
              new recalculation from the sidebar discards the register on this
              machine; there is no undo and nothing is kept elsewhere.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
