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
Donut at any month (all NBs / by affiliation / by country), Compare NBs, By
Affiliation, By Country, and a sortable/filterable NB Records table with CSV
export and a timeline chart of the selected NBs.

Every timeline chart has a series toggle: **Total** (levels) / **Δ MoM**
(month-over-month net change) / **Δ YoY** (change vs the same month one year
earlier); deltas use absolute history, so narrowed period windows still start
with a defined value.

Data handling notes:
- Snapshot dates are irregular and non-equidistant; the engine resamples onto a
  monthly grid using **linear interpolation between snapshots** (0 before an
  NB's first snapshot, last value held afterwards).
- Isolated reversing jumps (counting-rule changes such as the platform-wide
  2024-10-28 spike) are detected as anomalous snapshots and excluded by default
  (toggle in the header); the banner reports what was excluded.
- Grouping prefers the `nb_affiliation` field (casing-insensitive, e.g.
  `COTECNA`/`Cotecna` merge); files without that field fall back to fullname
  guessing, and the banner says so.

Run the tests: `node tests/test-engine.mjs path/to/data.json`

## License

MIT - see [LICENSE](LICENSE).
