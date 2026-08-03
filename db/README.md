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

## Resolved dependency risk (previously documented here, now fixed)

This section used to flag `xlsx@0.18.5` (SheetJS) as an unfixable
`npm audit` finding (prototype pollution, ReDoS, "No fix available" since
SheetJS stopped publishing patches to the npm registry). That dependency has
since been removed entirely — `backend/src/services/excelService.js` now
does all Excel read/write work through `exceljs` alone, which was already a
dependency for the upload template builder.

The `exceljs`-transitive `uuid` advisory (moderate, buffer bounds check) is
resolved via a `"overrides": { "uuid": "^11.1.1" }` entry in
`backend/package.json`, which pins the nested `uuid` dependency to a patched
version without downgrading `exceljs` itself.

`backend` and `frontend` both report 0 `npm audit` vulnerabilities as of this
change, aside from one documented, non-exploitable finding in the frontend
(see `frontend/README.md`).
