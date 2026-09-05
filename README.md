# ARO Recalculation

Mode 1 of the ARO platform, standing on its own: **recalculate an asset
retirement obligation portfolio independently over a source system's extracts,
and report the variance against the figures that system published.**

It is a single-purpose tool. There is no server, no database and no sign-in —
the extracts are read in the browser, the register is held in `localStorage`,
and nothing leaves the machine. That is the point: an auditor can run it on a
client file they are not permitted to upload anywhere.

```bash
npm install
npm run dev        # http://localhost:5174
npm test           # 173 tests
npm run build
```

## The six steps

| # | Step | What it does |
| --- | --- | --- |
| 01 | Source extracts | Stage REP04 (cost estimates), REP06 (settlement dates and reported FV/PV) and the interest rate curve. Columns are auto-mapped and shown before anything merges. |
| 02 | Imported data | The extracts as they were read, mapped columns marked, so every figure ties back to a row in the original workbook. |
| 03 | Recalculation | The independent chain, obligation by obligation, with the same calculation written as Excel for any row. |
| 04 | Source comparison | Recalculated against reported, per obligation and in total, against tiered materiality — plus the trial-balance control total that proves the population complete. |
| 05 | Exceptions & clearance | Everything standing between the register and a finalised recalculation. |
| 06 | Variance & sign-off | Why one obligation differs, in two steps that sum to the variance exactly, and the conclusion. |

## Layout

```
src/engine/    the calculation — pure, dependency-free, no React
src/core/      the register: merges, totals, completeness, exceptions
src/xlsx/      a hand-rolled .xlsx reader and writer (no library)
src/ui/        the shell, the six screens and the sheet component
```

`src/engine/` and `src/core/` are pure functions over plain data. Every figure
the screens show is computed by a function a test can call directly, which is
why the test suite covers the arithmetic end to end without rendering anything.

## What it shares with the ARO Suite, and what it does not

The engine, the register logic, the xlsx reader/writer and the Modernist
stylesheet are the Suite's, unchanged — same arithmetic, same wording, same
look. A firm running both reads one vocabulary, and the step ids here are the
Suite's own (`recalc-import`, `recalculation`, `recalc-compare`, …).

Two of the Suite's invariants are deliberately **not** carried over, and
`src/ui/state.tsx` says so at the point where they would have gone:

- **§3, the authority model.** A single-purpose tool has one user, who owns
  everything in it. There is nothing to refuse a write against.
- **§7, role gating.** Preparer / reviewer / partner is a property of an
  engagement team, not of a calculator. The sign-off records *that* a conclusion
  was reached and by whom; it does not enforce who may reach it.

**§2 does apply and is kept:** the action log is only ever prepended to.

## Limits worth knowing

- **The built-in curve is not a client curve.** Until a curve file is imported
  the tool runs on a plausible FY26 sovereign table. That is a REVIEW exception,
  never a silent default, and every figure derived from it is illustrative.
- **`localStorage` is the only store.** If the browser refuses to save, the
  sidebar says so rather than pretending. Export the workbook before closing.
- **Raw extract rows are session-only.** They are never persisted, so *Imported
  data* is empty after a reload even though the register survives.
