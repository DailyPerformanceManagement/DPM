# Six Sigma Studio — Development Handoff

## Current deliverables
- [Connected single-file HTML](./SixSigmaStudio_Connected_Dashboard.html) (HTML, CSS and application JavaScript modules embedded).
- [Modular project source](./) (preferred for further editing and long-term maintainability).
- The single HTML connects to the existing Supabase PostgreSQL database and loads the publishable Supabase JS library from esm.sh. Internet and sign-in are required; it is not an offline application.

## Next work that still needs implementation and verification

**1. Validate every Lean Six Sigma tool separately.** For each method, specify its objective, required data structure, field mapping, calculations, assumptions, chart/document output, project evidence linking, and completion criteria. A method is not functional simply because users can save notes.

**2. Extend statistical correctness.** Fully validate Run Chart interpretation rules; expand SPC with reliable special-cause signal tests, rational subgroup chronology, and appropriate individual, X-bar/R, p, np, c, u charts. Add complete measurement system analysis (Gage R&R and attribute agreement), capability estimation using appropriate within-process variation and distributions, confidence intervals and tests, and DOE, with documented numerical validation against trusted reference results.

**3. Improve data editing and importing.** Add direct multi-row paste from Excel, drag/drop XLSX import, field-preview and mapping, validation messages beside cells, clear date/decimal locale conversion, history/versions, paging beyond the current project 5,000-row client load limit, and editable dataset links without accidental deletion of referenced evidence.

**4. Connect the project story.** Explicitly link problem → KPI → dataset → analysis run → finding → validated root cause → countermeasure → verified outcome → Control Plan; enable reports and phase closure only when documented evidence meets configurable requirements.

**5. Production-level collaboration and operations.** Build project-specific role-based sharing and invitations, audit trail and approvals, accessibility and keyboard operation, automated integration and signed-in browser testing, monitoring and error recovery, optional external integrations (Teams / Excel / Power BI / Minitab), and security review.

## First acceptance scenario to run with a signed-in test account

1. Open existing project, then Measure → Run Chart.
2. Create a named table with Observation Time (date/time), Measurement (number), and Shift (category).
3. Manually enter 10 observations; save; leave the page; reopen; confirm the rows persisted.
4. Choose the same saved table in Run Chart; map time and measurement; generate a median-based chart.
5. Import semicolon-separated CSV with German decimal commas; verify the newly imported rows appear and a recalculation includes them.
6. Close Run Chart, reopen the same tool instance and confirm dataset selection, saved chart result, and reproducible source data.
7. Check invalid measurements, missing timestamps, duplicate/unsorted dates, large tables, and browser/API failure feedback.
8. Repeat equivalent **method-specific** scenarios for Pareto, p/np/c/u charts, Gage R&R, FMEA, and each other method.

## Limits of verification so far

Run Chart and several SPC calculations were tested with automated synthetic data. Browser-level and live authenticated database acceptance testing on the actual user account has not been demonstrated. Do not represent unimplemented statistical workbooks as verified analytical software. This work requires engineering, statistical domain review and production testing, not simply an expanded HTML file.
