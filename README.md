# TMS Driver Registration Portal — Frontend Only (Phase 1)

This is the **frontend-only** build of the TMS Driver Portal: the exact same
React UI as the full-stack version, but with no backend, no database, and no
network calls. All data (users, requests, drivers, comments, workflow
history, notifications) lives in a small mock "database" held in your
browser's `localStorage`, seeded with dummy demo data on first load.

Use this to build/demo/iterate on the UI independently. When Phase 2 (the
real backend) is ready, swap the files in `src/api/` for the versions that
call the real API — every page and component calls the same function names
(`login`, `listRequests`, `createRequest`, `updateStatus`, etc.), so nothing
else needs to change. See **"Linking to the real backend later"** below.

## 1. Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. No `.env`, no MySQL, no second terminal —
just this one command.

### Demo accounts (password for all: `Password123!`)

| Email | Role |
| --- | --- |
| fedx@example.com | Requester |
| hani.alturaiki@asmo.com | Requester |
| it.tms@asmo.com | Processor |
| ad.team@asmo.com | Processor |
| admin@asmo.com | Admin |

The seed data already includes a few sample requests in different statuses
(Completed, Under Review, Draft, Rejected) so the dashboards aren't empty on
first login.

There's a **" Reset demo data"** link at the bottom of the sidebar if you
want to wipe anything you created and start over from the original seed.

## 2. How the mock backend works

| Folder | Purpose |
| --- | --- |
| `src/mock/seedData.js` | The initial dummy dataset — users, requests, drivers, comments, workflow history, notifications |
| `src/mock/db.js` | Loads/saves that dataset to `localStorage` (`tms_mock_db_v1`), so it survives page refreshes |
| `src/mock/session.js` | Mock login session (`tms_token` / `tms_user` in `localStorage`) |
| `src/mock/hydrate.js` | Joins raw rows into the nested shape pages expect (e.g. `request.requester.fullName`, `request.drivers`, `request.history`) |
| `src/mock/workflow.js` | Same status-transition rules as the backend (`Draft → Submitted → Under Review → ...`) |
| `src/mock/validators.js` | Same field validation rules (required fields, email/phone format) |
| `src/mock/excel.js` | Client-side Excel template generation + upload parsing (using the `xlsx` package directly in the browser, no server needed) |
| `src/api/*.js` | Same function names as the full-stack version, but implemented against the mock DB instead of HTTP calls |

Everything else — `components/`, `pages/`, `context/AuthContext.jsx`,
`routes/AppRoutes.jsx` — is identical to the full-stack build.

## 3. Create vs. Modify vs. Disable

Switching the "Type of Request" changes the rest of the New Request form:

- **Create Driver** — unchanged: Manual entry or Excel upload into a blank driver table.
- **Modify Driver** — search the existing driver directory (`src/mock/seedData.js` → `driverDirectory`, via `src/api/drivers.js` → `searchDrivers()`), select one or more drivers, then edit only the fields that need to change. Changed fields are highlighted, and a plain-language change summary (`"Phone: '...' → '...'"`) is attached to each driver row and shown in Request Details / Process Request.
- **Disable Driver** — same search-and-select step, but the driver's info is shown read-only. The requester provides a Disable Reason, Business Justification, and a required Effective Date instead.

`driverDirectory` is a separate dummy dataset representing drivers that
already exist in AD/DCT (as opposed to `drivers`, which are line items on a
specific request) — this is the thing a real backend would need to add: an
endpoint like `GET /api/drivers/search?q=...` backed by whatever system of
record already holds active drivers.

## 3. Known limitations of the mock build

- **Attachments** are stored as base64 data URLs inside `localStorage` (capped
  at 3MB per file) so downloads work even after a refresh — but this isn't
  how you'd want to store files in production.
- **No real authentication** — `login()` just checks the email exists and the
  password matches the shared demo password. Fine for UI work, not for
  anything resembling security.
- **Single browser / single device** — data lives in your browser's
  `localStorage`, so it won't sync between two browsers/devices, and clearing
  site data wipes it (falls back to reseeding automatically).

## 4. Linking to the real backend later

The full-stack version of this project (`tms-driver-portal/`) already has a
working Express + MySQL backend with the same API shape. To connect this UI
to it:

1. Copy `tms-driver-portal/frontend/src/api/axiosClient.js` into this
   project's `src/api/` folder.
2. Replace each file in this project's `src/api/` (`auth.js`, `requests.js`,
   `notifications.js`, `reports.js`, `users.js`) with the corresponding
   axios-based version from `tms-driver-portal/frontend/src/api/`.
3. Delete `src/mock/` — it's no longer needed.
4. Add a `.env` with `VITE_API_URL=http://localhost:5000/api` (see the
   full-stack project's README for backend setup).

No changes are needed anywhere else — every page/component imports from
`src/api/*.js` by function name only, never by data shape or implementation.
