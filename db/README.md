# Database

`schema.sql` is a T-SQL script meant to be run manually in SSMS against the
team's existing SQL Server instance. It creates a dedicated `tms` schema and
tables for this app, seeds the two lookup tables, and creates a least-
privilege `tms_app` login scoped to that schema only.

**The backend does not connect to this schema yet.** `backend/src/data/`
still runs entirely on an in-memory mock store that resets on every restart.
This script is a forward-looking schema design; wiring the backend's
repositories up to SQL Server (e.g. via the `mssql`/`tedious` driver) is a
separate, later piece of work.

Recommended first run: execute against a scratch/test database, confirm it
runs clean end-to-end, then run it against the real shared database.

## Known dependency risk (documentation only, no code change)

`backend/package.json` pins `xlsx@0.18.5` (SheetJS), which has published
CVEs (prototype pollution, ReDoS) with no fix available on the default npm
registry — `npm audit` reports it as "No fix available". Patched SheetJS
releases are published to SheetJS's own registry (`https://cdn.sheetjs.com/`)
instead of npm's, so upgrading requires a manual decision to switch the
package's registry source, not a routine `npm update`.

Separately, `exceljs`'s own dependency tree (`archiver`, `uuid`, `glob`,
`minimatch`, `rimraf`, `brace-expansion`) currently reports several
high/moderate advisories via `npm audit`. `npm audit fix --force` only
resolves them by downgrading `exceljs` to `3.4.0`, an older major version —
not applied here, since that's a breaking change that needs its own
evaluation rather than being silently forced through a schema/security pass.
