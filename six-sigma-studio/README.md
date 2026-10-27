# Six Sigma Studio

**Live application:** https://six-sigma-studio.vercel.app/

Six Sigma Studio is a standalone, authenticated Lean Six Sigma project workspace. Its code lives in this isolated subdirectory of the existing DPM GitHub repository; the deployed application is a **separate Vercel project**, and its database records are isolated in their own Supabase tables.

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
