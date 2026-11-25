# GSO-Analyzer

GSO Analyzer Pro V1.3.0 - a Windows HTA application for tracking GSO Notified
Body certificates (GCTS numbers), with a record manager, certificate scanner,
and live register sync against gso.org.sa.

## Contents

- `GSO-Analyzer_V1.3.0.hta` - the complete V1.3.0 application (single-file HTA)
- `GSO-Visualizer.html` - browser-based visualization & analysis of `data.json` (see below)
- `CHANGELOG.md` - full V1.3.0 changelog
- `source-parts/` - the 7 source chunks (`GSO-Analyzer_V1.3.0_part01of07.md` ... `part07of07.md`)
- `README-assembly.md` - how to reassemble the HTA from the source parts
- `tests/test-engine.mjs` - engine tests (`node tests/test-engine.mjs [data.json]`)
- `LICENSE` - MIT

## Running

Double-click `GSO-Analyzer_V1.3.0.hta` in Windows (runs in the HTML Application
host). Keep it in the folder with your `data.json` / `config.json`; existing
data is migrated automatically after a backup is taken.

See `CHANGELOG.md` for what changed in V1.3.0: register sync, data model v2
(per-scope statuses, ISO-2 countries, previous-name tags), color-coded scope
statuses, shortname cleanup, plus the V1.2.1 bugfix list.

## GSO Visualizer (browser)

`GSO-Visualizer.html` is a single-file, dependency-light web app (ECharts via CDN)
that reads the `data.json` exported by GSO Analyzer V1.3.0 and renders market
analytics in any browser. Data stays local - nothing is uploaded.

- Open `GSO-Visualizer.html`, then drag & drop (or pick) your `data.json`.
  If the page is served over HTTP from a folder containing `data.json`, it loads
  automatically - e.g. `python -m http.server` in this folder, then browse to
  `http://localhost:8000/GSO-Visualizer.html`.

Views: Overview (total market timeline incl. overall sum, KPI strip: live GCTS,
GCTS/month, GCTS/year, YoY, plus the number of active NBs over time), Snapshot
Donut at any month (all NBs / by affiliation / by country, each as **Total /
Δ MoM / Δ YoY** slices — delta modes slice the magnitude of the change, zero
slices are dropped, and a hint is shown when the selected month has too little
history), Compare NBs, By Affiliation, By Country, and a sortable/filterable NB
Records table with CSV export and a timeline chart of the selected NBs.

Every timeline chart has a series toggle: **Total** (levels, line) / **Δ MoM**
(month-over-month net change, bars) / **Δ YoY** (change vs the same month one
year earlier, line) / **Year total** (net change per calendar year, bars); the
deltas use absolute history, so narrowed period windows still start with a
defined value. In the bar modes the tooltip shows the bar **value plus its
increase from the previous month or year**.

Bars (v0.6.0):
- Δ MoM and Year total render as **bar charts** in every timeline (overview,
  active NBs, affiliation, country, compare, records).
- Affiliation- and country-grouped timelines show **stacked bars per group**;
  the Compare and NB-records timelines show the bars of the compared NBs
  **side by side** for direct contrast.
- Year total aggregates the interpolated monthly series into **calendar-year
  net changes** (a partial first year counts from 0; only years fully inside
  the selected period are shown as bars).

Colors (v0.5.0): affiliation groups use their **corporate brand colors**, kept
identical across all views (overview stacks, affiliation/country charts,
donut, compare, records timeline). Traced from official brand sources: SGS
`#F36F21`, Intertek `#FFC700`, TÜV Rheinland `#0071B9`, TÜV SÜD `#005CA9`,
TÜV Austria `#D51317`, DEKRA `#008143`, Bureau Veritas `#2169B5`, UL `#FF5C00`,
Cotecna `#00BD7B`, BSI `#C8102E`, Eurofins `#005596`, IMQ `#00A3E0`, Nemko
`#005288` (very dark shades are slightly brightened for the dark UI). Groups
without a known brand color (e.g. countries, `Independent`, `Government`,
new affiliations) get a **stable color derived from their name**, so an entity
never changes color between views. NB-level series inherit the affiliation's
brand color, deterministically shaded so several NBs of one group stay
distinguishable — the lowest NB id keeps the pure brand color.

Table behaviour (v0.3.0):
- **All tables (affiliation KPIs, snapshot donut, compare, NB records) are
  sortable** by clicking a column header; each click toggles ascending/descending
  (numeric columns sort descending first, text columns ascending).
- **GCTS/mo** in the table views is the net change over the **last 12 months
  counted backwards from the end of the selected period** (less than 12 if the
  timeline is shorter), not a fixed calendar average.
- The Snapshot Donut table shows **Δ MoM and Δ YoY per slice**, calculated
  backwards from the month picked on the slider (shown as `–` before the first
  / twelfth month of history); the donut tooltip shows the same deltas.
- The **Period selector and the anomaly-exclusion toggle live in a sticky bar
  above all tabs** (v0.6.0), so the from–to period is reachable from every
  screen and applies to all views.

Data handling notes:
- Snapshot dates are irregular and non-equidistant; the engine resamples onto a
  monthly grid using **linear interpolation between snapshots** (0 before an
  NB's first snapshot, last value held afterwards). Interpolated values are
  clamped to be **never negative**.
- Isolated reversing jumps (counting-rule changes such as the platform-wide
  2024-10-28 spike) are detected as anomalous snapshots and excluded by default
  (toggle in the global period bar); the banner reports what was excluded.
- Grouping prefers the `nb_affiliation` field (casing-insensitive, e.g.
  `COTECNA`/`Cotecna` merge); files without that field fall back to fullname
  guessing, and the banner says so.

Run the tests: `node tests/test-engine.mjs path/to/data.json`

## License

MIT - see [LICENSE](LICENSE).
