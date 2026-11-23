# GSO Analyzer Pro — README / Assembly Instructions (V1.3.0)

## What is in this library

| Document | Content |
|---|---|
| `GSO-Analyzer_V1.3.0_part01of07.md` … `part07of07.md` | The complete HTA application, split into 7 sequential chunks. Parts 1–6 each end with a marker line `=== END OF PART NN … ===` (part 7 ends with `=== END OF PART 07/7 — FILE COMPLETE ===`). |
| `CHANGELOG.md` | Full V1.3.0 changelog (standalone). |
| `README-assembly.md` (this file) | How to reassemble and run the app. |

## Step 1 — Reassemble the HTA file

1. Download all **7** part documents into **one folder**. If your viewer adds a `.md`
   extension on download, that is fine.
2. Open **PowerShell** in that folder and run:

```powershell
Get-ChildItem GSO-Analyzer_V1.3.0_part*of07.md |
    Sort-Object Name |
    Get-Content -Raw |
    ForEach-Object { $_ -replace "(?m)^=== END OF PART 0\d.*$\r?\n?", "" } |
    Set-Content -Path GSO-Analyzer_V1.3.0.hta -Encoding UTF8
```

This concatenates the parts in order and strips all the `=== END OF PART … ===`
marker lines. The result must be `GSO-Analyzer_V1.3.0.hta`, ~105 KB, ~3,321 lines long,
ending with `</html>`.

Sanity check:

```powershell
(Get-Item GSO-Analyzer_V1.3.0.hta).Length           # expect ~105 KB
Select-String GSO-Analyzer_V1.3.0.hta "END OF PART" # expect NO matches
Select-String GSO-Analyzer_V1.3.0.hta "GSO Analyzer Pro V1.3.0"
```

If any marker line survived, or a part is missing, the file is incomplete —
re-download the missing part.

Note: the document library may normalize a few cosmetic bytes in part 1 (the
trailing newline and the self-closing `/>` on the two `<meta>` tags). Both are
functionally identical in HTML/HTA — no impact on the app.

## Step 2 — Put it in your project folder

1. Copy `GSO-Analyzer_V1.3.0.hta` into the folder where your current
   `GSO-Analyzer_V1.2.1` HTA and its `data.json` / `config.json` live.
   Keep your old version until you have confirmed V1.3.0 works.
2. No changes to `data.json` or `config.json` are required. On first start the app
   migrates the old records automatically (adds per-scope statuses, ISO country
   codes, former-name and manual-shortname tags) and creates a backup of
   `data.json` first.

## Step 3 — Run

- If you downloaded the HTA (browser, GitHub, e-mail): right-click the file →
  **Properties** → **Unblock** → OK first. A blocked (Mark-of-the-Web) HTA runs
  in the restricted Internet zone; there `ADODB.Stream` is prohibited and saving
  `config.json` / `data.json` fails with "Safety settings on this computer
  prohibit accessing a data source on another domain.". V1.3.0 falls back to a
  FileSystemObject writer in that case, but unblocking restores full
  functionality. Run the HTA from a plain local disk folder (not a network
  share).
- Double-click `GSO-Analyzer_V1.3.0.hta` in Windows (it runs in the HTA host;
  if your Windows opens it in a browser instead, right-click → Open with →
  **Microsoft (R) HTML Application host**).
- First start will:
  1. Run the **one-time cleanup** proposal (`-KSA` → `-SA`, `-UK` → `-GB`,
     ISO country normalize). Confirm or decline — the flag is then persisted.
  2. **Sync with the register** at gso.org.sa (9 pages) and list new / changed
     NBs exactly as described in `CHANGELOG.md`.
- If you prefer no automatic sync at start, use **Sync Register** manually;
  a network-less start will simply log that the register was unreachable.

## Notes & troubleshooting

- The scanner uses `MSXML2.ServerXMLHTTP.6.0` (with `XMLHTTP` fallback); run the
  HTA locally from disk, not from a network share with stricter security.
- If register sync / diagnostics report timeouts on a network where the browser
  reaches gso.org.sa fine, your machine most likely routes all traffic through
  the per-user (WinINET/IE) proxy. `MSXML2.ServerXMLHTTP` uses the machine-level
  WinHTTP proxy instead, not the Internet Explorer settings. Two fixes (both in
  `config.json`, read at startup):
  - add `"httpEngine": "user"` — the app then requests only via
    `MSXML2.XMLHTTP`, exactly like V1.2.1, which follows the user proxy and
    works on such networks;
  - and/or run `netsh winhttp import proxy source=ie` as administrator, or add
    `"proxy": "proxyserver:port"`, to make the WinHTTP route work as well.
  The default `"httpEngine": "auto"` starts on `ServerXMLHTTP` and switches to
  the user-proxy engine automatically after its first transport failure.
- **Diagnostics → Dump List HTML** writes `register_dump.html` to the app folder
  and shows how many NBs the parser recognized on page 1 (expect 10 entries,
  with NB-0008 appearing twice because the register itself lists two companies;
  register sync keeps the first occurrence and logs the anomaly) — use it first
  if register sync ever returns unexpected results.
- Column widths: drag the right edge of any column header to resize it, or
  double-click a header to auto-fit that column to its content. Widths persist
  in `config.json` as `"columnWidths": {"id": 60, "nb_shortname": 120,
  "nb_fullname": 240, "nb_country": 45, "scopes": 175, "nb_status_agg": 95,
  "nb_number_gcts": 85}` (all keys optional — omitted columns keep their
  default; delete the key to reset). Default Full Name width is 240 px so the
  Scopes chips and GCTS Max stay visible on narrower windows; the table also
  gains a horizontal scrollbar when the columns need more room.
- Backups: the app writes `data.json.bak` and dated backups (e.g.
  `data_YYYY-MM-DD.HHMM.json`) before any sync that changes data — you can
  always roll back by restoring one of those files.
