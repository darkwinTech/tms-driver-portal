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

### Demo accounts (password for all: `Password123!`)

| Email | Role |
| --- | --- |
| fedx@example.com | Requester |
| hani.alturaiki@asmo.com | Requester |
| operations@asmo.com | Operations |
| ad.team@asmo.com | AD Team |
| it.tms@asmo.com | Processor |
| admin@asmo.com | Admin |

### Workflow

Each request type follows its own path (see `../backend/src/workflow.js`):

- **Create Driver**: `Submitted → Under Review → Processing → AD Team Review → RPA Triggered → Completed`, with `Returned to Requester`/`Rejected` available off Under Review. Operations reviews first and completes the hidden driver-profile fields (Group/Customer, Driver Class, Operating Hours) during Processing before handing off to the AD Team, who either Reject (mandatory reason) or Approve & Trigger RPA, then mark the request Completed once account creation is confirmed externally.
- **Modify Driver**: `Submitted → Completed | Rejected` — a single Operations decision (Accept applies the change directly to the driver's record, no AD Team involved).
- **Disable Driver**: `Submitted → AD Team Review → RPA Triggered → Completed`, or `Rejected` at Submitted — Operations accepts and forwards to the AD Team, who own the actual account disablement.

Account creation/disablement happens outside this application via a Power
Automate flow (`backend/src/services/powerAutomateService.js`); this app
never sends the handoff email itself.

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
