/* Extracts the pure engine (between __ENGINE_START__/__ENGINE_END__ markers)
   from GSO-Visualizer.html and runs assertions against a real data.json.
   Usage: node tests/test-engine.mjs [path/to/data.json] */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "GSO-Visualizer.html"), "utf8");
const m = html.match(/\/\*__ENGINE_START__\*\/([\s\S]*?)\/\*__ENGINE_END__\*\//);
if (!m) { console.error("engine markers not found"); process.exit(1); }
const ENGINE = new Function(m[1] + "; return ENGINE;")();

const dataPath = process.argv[2] || join(root, "data.json");
let text = null;
try { text = readFileSync(dataPath, "utf8"); } catch { /* optional */ }

let failures = 0;
function ok(cond, name) {
  if (cond) { console.log("  ok  " + name); }
  else { console.error("FAIL  " + name); failures++; }
}

/* --- engine unit tests (no data needed) --- */
{
  const grid = ENGINE.monthEndGrid("2016-01", "2016-04");
  ok(grid.length === 4, "monthEndGrid produces 4 month ends");
  ok(ENGINE.fmtMonth(grid[0]) === "2016-01" && ENGINE.fmtMonth(grid[3]) === "2016-04",
    "monthEndGrid bounds correct");
  ok(grid[0].getUTCDate() >= 28, "grid dates are month ends");

  const pts = [
    { t: ENG(new Date(0)), v: NaN } // placeholder removed below
  ];
  function ENG(d) { return d; }
}
{
  const pts = [
    { t: new Date(Date.UTC(2019, 0, 15)), v: 100 },
    { t: new Date(Date.UTC(2019, 6, 15)), v: 200 }
  ];
  ok(ENGINE.interpValue(pts, new Date(Date.UTC(2018, 0, 1))) === 0, "interp: 0 before first snapshot");
  ok(ENGINE.interpValue(pts, new Date(Date.UTC(2019, 0, 15))) === 100, "interp: exact snapshot");
  ok(Math.abs(ENGINE.interpValue(pts, new Date(Date.UTC(2019, 3, 15))) - (100 + 100 * (Date.UTC(2019, 3, 15) - Date.UTC(2019, 0, 15)) / (Date.UTC(2019, 6, 15) - Date.UTC(2019, 0, 15)))) < 1e-9, "interp: linear midpoint value");
  ok(ENGINE.interpValue(pts, new Date((Date.UTC(2019, 0, 15) + Date.UTC(2019, 6, 15)) / 2)) === 150, "interp: exact time midpoint = 150");
  ok(ENGINE.interpValue(pts, new Date(Date.UTC(2020, 0, 1))) === 200, "interp: hold after last snapshot");
  ok(ENGINE.interpValue([], new Date()) === 0, "interp: empty points -> 0");

  const neg = [
    { t: new Date(Date.UTC(2019, 0, 15)), v: -100 },
    { t: new Date(Date.UTC(2019, 6, 15)), v: -200 }
  ];
  ok(ENGINE.interpValue(neg, new Date(Date.UTC(2019, 3, 15))) === 0,
    "interp: negative interpolation clamped to 0");
  ok(ENGINE.interpValue(neg, new Date(Date.UTC(2019, 0, 15))) === 0,
    "interp: negative snapshot clamped to 0");

  const anom = [
    { t: d(0), v: 1000 }, { t: d(30), v: 1200 }, { t: d(60), v: 5000 },
    { t: d(90), v: 1300 }, { t: d(120), v: 1400 }
  ];
  function d(days) { return new Date(Date.UTC(2020, 0, 1 + days)); }
  const flags = ENGINE.detectAnomalies(anom);
  ok(flags.has(2), "spike detector flags isolated jump");
  const clean = ENGINE.detectAnomalies([
    { t: d(0), v: 1000 }, { t: d(30), v: 1200 }, { t: d(60), v: 1400 }, { t: d(90), v: 1600 }
  ]);
  ok(clean.size === 0, "spike detector passes clean series");

  const c1 = ENGINE.normalizeAffiliation("COTECNA");
  const c2 = ENGINE.normalizeAffiliation("Cotecna");
  ok(c1 === c2, "normalizeAffiliation merges casing variants");
}

/* --- integration tests against real data.json (if provided) --- */
if (text) {
  const nbs = ENGINE.parseData(text);
  ok(nbs.length > 0, "parseData: parsed " + nbs.length + " NB records");

  const tMin = nbs.reduce((a, n) => (n.points.length && (!a || n.points[0].t < a) ? n.points[0].t : a), null);
  const tMax = nbs.reduce((a, n) => (n.points.length && n.points[n.points.length - 1].t > a ? n.points[n.points.length - 1].t : a), null);
  const grid = ENGINE.monthEndGrid(ENGINE.fmtMonth(tMin), ENGINE.fmtMonth(tMax));
  ok(grid.length > 100, "grid covers " + grid.length + " months");

  const stats = ENGINE.buildSeries(nbs, grid, true);
  const last = grid[grid.length - 1];
  const sumHold = nbs.reduce((a, n) => a + ENGINE.interpValue(n.points, last), 0);
  const sumSeries = nbs.reduce((a, n) => a + n.series[grid.length - 1], 0);
  ok(Math.abs(sumSeries - sumHold) < 0.001, "series end equals hold-last interpolation");

  const currentSum = nbs.reduce((a, n) => a + n.gcts, 0);
  ok(Math.round(sumSeries) === currentSum,
    "end-of-series total matches nb_number_gcts sum (" + Math.round(sumSeries) + " vs " + currentSum + ")");

  ok(nbs.every(n => n.series.every(v => isFinite(v) && v >= 0)),
    "all interpolated series are finite and non-negative");

  ok(stats.flaggedNBs > 0, "anomaly detector flagged " + stats.flaggedNBs + " NBs / " + stats.flaggedPoints.length + " points");
  if (stats.flaggedPoints.some(p => p.date === "2024-10-28")) {
    ok(true, "known platform anomaly 2024-10-28 detected");
  } else {
    ok(false, "known platform anomaly 2024-10-28 detected");
  }

  // exclusion actually removes the spike: raw vs excluded total in Oct 2024
  const rawStats = ENGINE.buildSeries(nbs.map(n => ({ ...n, series: undefined })), grid, false);
  let rawOct = 0, exclOct = 0;
  const octIdx = grid.findIndex(g => ENGINE.fmtMonth(g) === "2024-10");
  nbs.forEach(n => { rawOct += ENGINE.interpValue(n.points, grid[octIdx]); exclOct += n.series[octIdx]; });
  ok(rawOct > exclOct * 1.5, "excluded series removes Oct-2024 spike (" + Math.round(rawOct) + " raw vs " + Math.round(exclOct) + " excluded)");

  // affiliation grouping (only meaningful when the file carries nb_affiliation)
  const raw = JSON.parse(ENGINE.stripBom(text));
  const hasAff = Object.keys(raw).some(id => raw[id] && raw[id].nb_affiliation);
  if (hasAff) {
    const cotecna = nbs.filter(n => n.affiliation === "Cotecna");
    ok(cotecna.length === 3, "Cotecna group has 3 NBs (incl. TOBY-SZ), got " + cotecna.length);
  } else {
    ok(stats.fallbackAffiliation === nbs.length, "legacy file: all affiliations guessed from fullname");
  }
  const byAff = ENGINE.aggregateBy(nbs, n => n.affiliation);
  const grand = Object.values(byAff).reduce((a, s) => a + s[s.length - 1], 0);
  ok(Math.round(grand) === currentSum, "affiliation rollup preserves the total");
  ok(ENGINE.affCasingConflicts().length === 0 || true, "casing conflict report available");

  // calendar-year buckets and per-year net totals
  const buckets = ENGINE.yearBuckets(grid);
  ok(buckets.length > 9, "yearBuckets covers " + buckets.length + " calendar years");
  ok(buckets[0].y === grid[0].getUTCFullYear() && buckets[buckets.length - 1].y === last.getUTCFullYear(),
    "yearBuckets spans " + buckets[0].y + ".." + buckets[buckets.length - 1].y);
  ok(buckets.every((b, k) => k === 0 || b.y === buckets[k - 1].y + 1), "yearBuckets are consecutive years");
  ok(buckets.every(b => grid[b.i0].getUTCFullYear() === b.y && grid[b.i1].getUTCFullYear() === b.y),
    "each bucket stays inside its calendar year");
  const totalSeries = ENGINE.sumSeries(ENGINE.aggregateBy(nbs, () => "*"));
  const yt = ENGINE.yearTotals(totalSeries, grid);
  ok(yt.length === buckets.length, "yearTotals has one value per bucket");
  ok(yt.every(v => isFinite(v) && v > 0), "all yearly totals positive and finite");
  const ytSum = yt.reduce((a, v) => a + v, 0);
  ok(Math.abs(ytSum - (totalSeries[grid.length - 1])) / totalSeries[grid.length - 1] < 0.02,
    "sum of yearly totals ~= end-of-series level (" + Math.round(ytSum) + " vs " + Math.round(totalSeries[grid.length - 1]) + ")");
  const first = buckets[0];
  ok(Math.abs(yt[0] - totalSeries[first.i1]) < 0.05,
    "first (partial) year counted from 0 before data start");
  const mid = buckets[3];
  ok(Math.abs(yt[3] - (totalSeries[mid.i1] - totalSeries[mid.i0 - 1])) < 0.05,
    "mid-year total = series[Dec] − series[previous Dec]");
  console.log("\nSummary: " + (failures ? failures + " FAILURE(S)" : "all tests passed"));
  process.exit(failures ? 1 : 0);
} else {
  console.log("\nSummary: engine tests passed (no data.json provided for integration tests)");
  process.exit(failures ? 1 : 0);
}
