# Six Sigma Studio

**Live application:** https://six-sigma-studio.vercel.app/

Six Sigma Studio is a standalone, authenticated Lean Six Sigma project workspace. Its code lives in this isolated subdirectory of the existing DPM GitHub repository; the deployed application is a **separate Vercel project**, and its database records are isolated in their own Supabase tables.

## Bischof+Klein-inspired dashboard theme (28 Oct 2026)

The **live Six Sigma Studio dashboard** now imports `bk-theme.css` after the existing stylesheet and activates it through `<html data-theme="bk">`. The project portfolio, navigation groups, KPI and method cards, project overview, phase stages, tables, forms, and authentication screens use the same navy / blue / green visual system. The overview values remain **connected to actual project state**; no presentation-only sample data have been injected.

This is an **unofficial visual interpretation** of public Bischof+Klein branding, not the approved corporate identity manual. The B+K mark is typographic and should be replaced with approved company assets when provided. Nothing about Supabase authentication, tables, data, calculations, analysis logic or project actions was changed for the theme.

UI regression tests: `node --test tests/bk-theme.smoke.test.mjs tests/run-chart.integration.test.mjs`.

## Architecture

- Frontend: HTML, CSS, ES modules and pinned Supabase JavaScript client
- Hosting: dedicated Vercel project `six-sigma-studio`
- Database: existing Supabase project `lean-command-center` (Frankfurt)
- Persistence: PostgreSQL tables prefixed `sigma_studio_`
- Security: Supabase Auth, project-user scoped foreign keys, owner-based Row Level Security
- Files: private Supabase Storage bucket `sigma-studio`, signed download links
- The publishable Supabase browser key in `app.js` is **public by design**; never add a Supabase service-role/secret key to the frontend.

## Running

Open https://six-sigma-studio.vercel.app/ in a web browser. Sign in with your Supabase account or create an account. If email confirmation is enabled in the Supabase project, complete that step before signing in.

You can also serve `index.html`, `styles.css`, and `app.js` through a local HTTP server. This is *not* a browser-local mock application: successful saves use authenticated requests to Postgres.

## Update: Run Chart workflow repair (27 Oct 2026)

The **Measure → Run Chart** method has its own working interface, not the generic input controls:

1. Select a named saved project table, or use **Create Run Chart data table** to create a table with time, measurement, and optional grouping fields.
2. Enter several observations **directly inside Run Chart** (no import required). The manual-entry grid supports all columns, including time/date, measurement, and optional text/category fields.
3. Click **Save entered observations** to insert typed rows in Supabase. Saved observations appear immediately below and can be edited.
4. Choose the **Y measurement** and optional **X date/time/sequence**, and press **Generate Run Chart**. The result plots chronological observations against the **median**, with labeled dates and descriptive run metrics.
5. Close and reopen the Run Chart method: it keeps its selected dataset and saved calculation, and retrieves saved observations from the project database.
6. **Import CSV to this table** accepts comma-, semicolon-, or tab-separated data with quoted fields. Numeric decimal commas and German dates (e.g. 27.10.2026 09:00) are parsed and validated against the named table schema.

These actions were tested using a **test-only in-memory Supabase adapter**, including the app command handler for inserting rows, chart calculation, reopening the method, and the actual CSV importer. Tests: `node --test six-sigma-studio/tests/run-chart.integration.test.mjs`. They do not replace a signed-in live-browser test against the production database.

**Methodology:** A Run Chart uses a median reference line and chronological order. It is **not an SPC I–MR chart with control limits**; choose I–MR separately for Shewhart limits and moving ranges.

## Update: Typed Data Library & method-specific SPC (27 Oct 2026)

The Data Hub is now a **saved Project Data Library**, not a generic X/Y table.

- Design a table from an empty schema: choose the table name, description, each column title, type, unit and whether a value is required.
- Column types: text, category, decimal measurement, integer/count, percentage, date, date-time, Boolean.
- Enter observations manually and save them in PostgreSQL; edit saved cells with type validation; import/export CSV. Edit existing table schemas without silently deleting populated columns.
- Select the same named table independently in multiple method instances. Data are not duplicated in tool files.
- Each statistical method uses its own dataset requirements, column labels and input mapping.
- Select **Create compatible table** inside an SPC method to begin with the right headers.
- I–MR requires sequenced continuous individual measurements and plots both I and MR charts.
- X-bar/R requires equal-size rational subgroups with individual numeric measurements and plots both mean and range charts.
- p chart requires defective units and inspected units, including varying subgroup sizes with varying upper/lower limits.
- np chart requires a **constant** sample size. c chart requires equal inspection opportunity. u chart uses counts and varying exposure denominators.
- Pareto, tests, normality, DPMO, regression, etc. expose distinct roles instead of forcing irrelevant fields.
- SPC input validation catches blank counts, noninteger counts, zero denominators, impossible defective counts, and incompatible subgroup structures.
- Supabase now stores a stable observation sequence to preserve chart order when an explicit date/time column is not mapped.

Note: Table libraries are reusable **within each project**, not globally shared across unrelated projects. The first 5,000 rows per project are loaded by this client version; large-data pagination is still needed. Statistical chart limits are computed, but full Western Electric/Nelson signal suites, measurement-system studies, and formal statistical validation are future work.

## What is implemented

- Select existing projects from the command bar; create/edit a project and record site/location.
- Five DMAIC phases with consistent introductions, project context, search and a phase conclusion/completion action.
- Create multiple **instances of the same method** under one project and save each separately.
- Structured **editable tables** for SIPOC, VOC, CTQ, RACI, Process Map, Data Collection Plan, Check Sheet, MSA data, Gage R&R data collection, Fishbone 6M, FMEA, 5 Whys, DOE planning, solution selection, Kaizen, 5S, pilot studies, control plans and standard work.
- Structured forms for Project Charter, 5W2H, PDCA, SOP and training records.
- Postgres-backed dataset editor with custom columns and observations, CSV import/export and in-place cell edits.
- KPI library with baseline, target, rule (at most/at least/range), optional dataset/column binding and latest reading status.
- Numeric calculators with saved parameters and results: Descriptive, histogram, run chart, Pareto, simple regression and correlation, Welch two-sample t-test, one-way ANOVA, Jarque–Bera normality screening, I–MR, p chart, X-bar/R, DPMO, and overall-sigma Pp/Ppk capability estimates.
- Actions with due dates/status, related method reference, private file uploads/downloads, HTML project reports.

The tool library contains both **real computation methods** and **working structured worksheets**. A structured worksheet is not a complete built-in statistical computation. In particular, Gage R&R data collection is not a validated Gage R&R variance-components analysis. FMEA supports editable scoring and RPN, not a complete AIAG-VDA Action Priority implementation.

Some chart previews do not show every limit (for example, variable subgroup-size p-chart limits are returned numerically). Interpret process capability and hypothesis tests with validated assumptions and professional review.

## Database

Eight main tables:
`sigma_studio_projects`, `sigma_studio_phases`, `sigma_studio_kpis`, `sigma_studio_datasets`, `sigma_studio_data_rows`, `sigma_studio_tools`, `sigma_studio_actions`, and `sigma_studio_files`.

All tables have RLS enabled with user ownership checks. Existing `sigma_projects` records were **copied** into Studio; original records were not changed. Historical dataset observations were also copied when present.

## Current limitations and next engineering steps

- This is a working first production-hosted version, **not a full Minitab replacement** or validated regulated statistical package.
- Access is private to each account. Shared projects, invitation roles, approval audit trails and multi-user permissions need a separate collaboration architecture.
- The input table currently renders the first 400 rows and initial reads are capped at 5,000 per project; use database pagination for large datasets.
- CSV import currently accepts comma-separated values and does not support Excel XLSX directly.
- Data source APIs from SAP/MES/Power BI and automatic KPI refresh are not connected.
- The browser application loads a pinned JavaScript dependency from esm.sh.
- **Automatic GitHub → Vercel deployment is not enabled:** The Vercel GitHub Login Connection was not configured for this account. After GitHub edits, redeploy the files manually or connect the repository in Vercel for CI/CD.
- Full browser test coverage with a test user/session should be added; syntax, public endpoint and sample statistical calculations were checked.

## Code location

https://github.com/DailyPerformanceManagement/DPM/tree/main/six-sigma-studio

## Important

Never add private production/customer data to public GitHub. Only source code is committed; actual user records and uploaded files remain in Supabase under their owner's access policies.
