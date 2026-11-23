# GSO Analyzer Pro — Changelog

## V1.3.0

### Register Sync (new)

- On startup (and via the new **Sync Register** toolbar button), the app downloads the
  online NB register at `https://www.gso.org.sa/nb/notified-body-list?orderBy=number&page=N`
  (9 pages, deterministic order) and diffs it against the local `data.json`.
- Handles the diff according to configurable rules:
  - **Empty local list** → offers to pull the complete listing from scratch (full rebuild).
  - **New NB entries** → added one by one after individual confirmation, with the
    proposed shortname shown for approval.
  - **Scope/status changes** → applied silently, every change written to the system log.
  - **Name changes** → confirmed per NB; the previous name is preserved in a new
    `nb_previous_names` tag. Corrupted names (`********`) are repaired automatically
    without confirmation.
- Sync aborts gracefully on network errors (3 retries with increasing backoff per page,
  300 ms pacing between pages) and verifies the parsed page count against the
  "Found N Results / for X Pages" markers.
- Register-side duplicates (currently NB-0008 lists two companies) are detected and
  skipped; anomaly count is logged.
- **Dump List HTML** (Diagnostics section) saves the first register page to
  `register_dump.html` and reports exactly how many NBs the parser recognized,
  for calibration.

### Data model v2

- New scopes added: **MS-SC** (e-scooters) and **MS-GA** (gas appliances).
- "Electrical Appliances - MS" now has **its own tag MS-LV** (separate from WER).
- **Per-scope status**: each scope carries its own value
  (notified / suspended / withdrawn / empty if scope off). Legacy files without
  statuses are migrated automatically (active scope without status → "notified");
  no manual conversion needed.
- Aggregate status per NB (priority: notified > suspended > withdrawn > expired).
- Names: new `nb_previous_names` array; countries normalized to **ISO-2 codes**.

### Status display

- Scope tags in the list are color-coded per request:
  notified = green, suspended = yellow, withdrawn = red, expired = grey.
- NBs with **no active scope** (nothing set to "notified") are shown muted and are
  **excluded from GCTS scans** until at least one scope becomes active again;
  skipped IDs are logged. The scannable count is shown next to the record count.

### Shortnames

- Rule: group name + ISO country code (e.g. "SGS Gulf Limited", UAE → `SGS-AE`).
  Acronym in company name wins (e.g. `(MOTABAQAH)` → `MOTABAQAH-SA`); a 36-entry
  group dictionary handles known groups; Chinese branches disambiguate by city
  (SGS-SZ / SGS-SH / SGS-GZ).
- **Existing shortnames are kept.** Once a shortname has been manually edited
  (`nb_shortname_manual`), register sync never overwrites it.
- **One-time cleanup** on first start (confirm dialog, flag persisted in `config.json`):
  proposes `-KSA` → `-SA` and `-UK` → `-GB` suffix renames (collision-checked),
  normalizes country fields to ISO-2, and reports corrupted names awaiting
  register-sync repair.

### Bugfixes (from the V1.2.1 review)

- File writes (`config.json`, `data.json`, CSV exports, register dump) now fall back
  to a FileSystemObject writer when `ADODB.Stream` is blocked by Windows security
  zones (the classic "Safety settings on this computer prohibit accessing a data
  source on another domain" error on HTA files carrying Mark-of-the-Web), and the
  log points users to Properties \u2192 Unblock.
- `checkUrl` now throws on HTTP status != 200 instead of treating any response
  body as "EXISTS".
- HTTP layer: `MSXML2.ServerXMLHTTP.6.0` with explicit timeouts
  (5 s / 5 s / 10 s / 30 s), fallback to `MSXML2.XMLHTTP`, no-cache headers added.
- Scan engine:
  - network errors are treated as inconclusive (3 retries with 2 s x n backoff);
    the NB is skipped after that and the current `max` is **never lowered** on error;
  - upper-boundary extension: on convergence the app probes one step above the
    current minimum and extends the search range if a certificate exists there
    (max 10 extensions);
  - deleting a record mid-scan no longer crashes the scan loop.
- File safety: atomic writes (`.tmp` + rename with rolling `.bak`), dated backup
  of `data.json` before every sync that changes data, UTF-8 BOM tolerated on read,
  `JSON.parse` with `eval` fallback, log capped at 500 lines.
- Validation: GCTS input must be a non-negative number (no silent 0), NB ID must be
  4-6 digits, scan step (100-1,000,000) and threshold (0-10,000) range-checked in
  both `config.json` loading and the Settings pane.
- UI: sidebar buttons/selects disabled until a record is selected, delete clears the
  selection instead of jumping to the first record, GCTS field is a text input
  (reliable in HTA), renamed IDs keep their "updated this session" highlight.

### Verification

- JavaScript extracted and validated with `node --check` (ES3-compatible, IE8-safe).
- Parser tested against the live register structure: 87 results / 9 pages markers,
  Unicode hyphen in NB numbers (`NB-0055` uses U+2010), duplicate NB-0008, all
  six scope labels including MS-SC / MS-GA / MS-LV.
- Migration tested against the provided `data.json` (84 records, UTF-8 BOM,
  one non-ISO country `Egypt` → `EG`); cleanup proposals verified
  (5 renames; `DQC-KSA` correctly skipped because `DQC-SA` exists).
