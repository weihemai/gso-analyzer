# GSO-Analyzer

GSO Analyzer Pro V1.3.0 - a Windows HTA application for tracking GSO Notified
Body certificates (GCTS numbers), with a record manager, certificate scanner,
and live register sync against gso.org.sa.

## Contents

- `GSO-Analyzer_V1.3.0.hta` - the complete V1.3.0 application (single-file HTA)
- `CHANGELOG.md` - full V1.3.0 changelog
- `LICENSE` - MIT

## Running

Double-click `GSO-Analyzer_V1.3.0.hta` in Windows (runs in the HTML Application
host). Keep it in the folder with your `data.json` / `config.json`; existing
data is migrated automatically after a backup is taken.

See `CHANGELOG.md` for what changed in V1.3.0: register sync, data model v2
(per-scope statuses, ISO-2 countries, previous-name tags), color-coded scope
statuses, shortname cleanup, plus the V1.2.1 bugfix list.

## License

MIT - see [LICENSE](LICENSE).
