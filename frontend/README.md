# TMS Driver Portal — Frontend

React UI for the TMS Driver Portal. This app talks to the real backend in
`../backend` (see the root [README.md](../README.md) for the monorepo
overview and current build status).

## 1. Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Demo accounts (password for all: `cc`)

| Email | Role |
| --- | --- |
| fedx@example.com | Requester |
| hani.alturaiki@asmo.com | Requester |
| operations.manager@asmo.com | Operations manager assigning requests |
| operations@asmo.com | Operations employee 1 |
| operations2@asmo.com | Operations employee 2 |
| ad.team@asmo.com | AD Team |
| it.tms@asmo.com | Processor |
| admin@asmo.com | Admin |

### Workflow

Each request type follows its own path (see `../backend/src/workflow.js`):

- **Create Driver**: `Submitted → Under Review → Processing → AD Team Review → RPA Triggered → Completed`, with `Returned to Requester`/`Rejected` available off Under Review. Operations reviews first and completes the hidden driver-profile fields (Group/Customer, Driver Class, Operating Hours) during Processing before handing off to the AD Team, who either Reject (mandatory reason) or Approve & Trigger RPA, then mark the request Completed once account creation is confirmed externally.
- **Modify Driver**: `Submitted → Completed | Rejected` — a single Operations decision (Accept applies the change directly to the driver's record, no AD Team involved).
- **Disable Driver**: `Submitted → AD Team Review → RPA Triggered → Completed`, or `Rejected` at Submitted — Operations accepts and forwards to the AD Team, who own the actual account disablement.

Account creation/disablement happens outside this application: the backend
sends a handoff email to ServiceNow directly via Microsoft Graph
(`backend/src/services/serviceNowEmailService.js`); this app has no further
visibility once that email is sent.

## 2. API layer

`src/api/*.js` calls the real backend over HTTP via `src/api/axiosClient.js`
(reads `VITE_API_URL` from `.env.local`). Every page/component imports from
`src/api/*.js` by function name only.

## 3. Create vs. Modify vs. Disable — driver lookup

Modify/Disable Driver search against the requester's own **completed**
Create Driver requests (`GET /api/drivers/my-completed`), not a separate
global directory — a driver only becomes searchable once their Create
Driver request has actually completed and they've been assigned a
username.

## 4. Known dependency finding (documented, not exploitable here)

`npm audit` flags `react-router`/`react-router-dom` for a CSRF advisory
([GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2)).
That advisory only affects apps using React Router's **unstable RSC (React
Server Components)** APIs — a server-rendering/framework-mode feature this
app doesn't use anywhere; this is a client-side Vite SPA with no SSR/RSC. No
patched release exists on npm yet (latest published is still `7.18.2`,
inside the flagged range) — the only "fix" `npm audit` currently offers is a
forced downgrade to `7.11.0`, which would give up several versions of real
fixes to avoid a threat that doesn't apply to this app's configuration. This
is an intentionally accepted, non-exploitable finding — revisit once a real
patched version ships.
