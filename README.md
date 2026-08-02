# TMS Driver Management Portal

A centralized, role-based web application for managing the driver account lifecycle — Create, Modify, and Disable requests — replacing a manual, email- and spreadsheet-driven process with a validated, auditable, multi-stage approval workflow.

## Contents

- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Roles and workflow](#roles-and-workflow)
- [API reference](#api-reference)
- [Environment variables](#environment-variables)
- [Data persistence](#data-persistence)

## Project structure

```
.
├── backend/            Node.js / Express REST API
│   └── src/
│       ├── config/          env var loading (config/env.js)
│       ├── middleware/      auth, RBAC, upload, rate limiting, error handling
│       ├── routes/          Express routers, one per resource
│       ├── controllers/     request handlers / business logic entry points
│       ├── services/        Excel generation, AD-team notification trigger
│       ├── data/            repositories + in-memory store + seed data
│       └── utils/           workflow state machine, validators, hydration, constants
├── frontend/            React 18 single-page application (Vite)
│   └── src/
│       ├── api/              axios client + one module per resource (the only data-access boundary)
│       ├── components/       shared UI (driver table, Excel upload, timeline, attachments, layout)
│       ├── context/           AuthContext
│       ├── pages/             one folder per role (requester, operations, adteam, processor)
│       └── routes/            role-guarded route definitions
└── db/                  SQL Server schema (not yet connected — see below)
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 6, Tailwind CSS 3, axios, ExcelJS / xlsx |
| Backend | Node.js, Express 5 (ES Modules), JWT (jsonwebtoken + bcryptjs), multer, ExcelJS / xlsx, helmet, cors, morgan, express-rate-limit |
| Database | SQL Server (schema designed, not yet connected — backend runs on an in-memory store) |

## Getting started

Requires Node.js 18+.

**1. Backend**

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=4000
NODE_ENV=development
JWT_SECRET=<any long random string>
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
```

```bash
npm run dev
```

Runs on `http://localhost:4000` with auto-restart on file changes.

**2. Frontend**

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:4000/api
```

```bash
npm run dev
```

Runs on `http://localhost:5173`.

## Demo accounts

All seeded users share the password `Password123!`.

| Email | Role |
|---|---|
| fedx@example.com | Requester |
| hani.alturaiki@asmo.com | Requester |
| operations@asmo.com | Operations |
| ad.team@asmo.com | AD Team |
| it.tms@asmo.com | Processor (read-only) |
| admin@asmo.com | Admin |

## Roles and workflow

Three request types, each with its own status lifecycle:

- **Create Driver** — `Submitted → Under Review – Operations Team → Processing – Operations Team → AD Team Review → Completed` (Returned to Requester or Rejected reachable from Under Review). Operations completes each driver's Group/Customer, Driver Class, and Operating Hours during Processing; completing those profiles is what hands the request to the AD Team and fires the automated notification. The AD Team's only action from there is **Mark as Complete**.
- **Disable Driver** — `Submitted → AD Team Review → Completed` (Rejected reachable directly from Submitted). Operations' accept/forward action fires the notification and hands off to the AD Team, whose only action is again **Mark as Complete** — on completion the driver is flagged `Disabled` and excluded from future searches.
- **Modify Driver** — `Submitted → Completed` or `Submitted → Rejected`, a single Operations decision with no AD Team stage, since no account provisioning is needed. Only PO Number and PO Expiry Date may be changed.

All transition rules are enforced server-side in `backend/src/utils/workflow.js`, independent of whatever the frontend sends — a request can only ever be found in the app in one of the four roles: **Requester** (submit and track own requests), **Operations** (first-stage review, driver profile completion, accept/return/reject), **AD Team** (final confirmation only), or **Admin/Processor** (read-only oversight, reporting).

## API reference

All routes below are mounted under `/api` and (except `/auth/login` and `/auth/register`) require a `Bearer` JWT.

| Resource | Routes |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Users | `GET /users` |
| Drivers | `GET /drivers/my-completed` |
| Requests | `GET /requests`, `POST /requests`, `GET /requests/:id`, `GET /requests/stats`, `PUT /requests/:id/resubmit`, `PATCH /requests/:id/status` |
| Requests — Operations actions | `PATCH /requests/:id/drivers/:driverId/profile`, `POST /requests/:id/complete-driver-profiles` |
| Requests — AD Team actions | `POST /requests/:id/mark-complete` |
| Requests — Excel | `GET /requests/excel-template`, `POST /requests/excel-upload`, `GET /requests/:id/drivers/export` |
| Requests — Attachments | `POST /requests/:id/attachments`, `GET /requests/:id/attachments/:attachmentId`, `GET /requests/:id/attachments/:attachmentId/download` |
| Notifications | `GET /notifications`, `PATCH /notifications/read-all` |
| Reports | `GET /reports/monthly`, `GET /reports/completed`, `GET /reports/rejected`, `GET /reports/export` |

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | backend | HTTP port (default 4000) |
| `JWT_SECRET` | backend | Required — signs auth tokens |
| `JWT_EXPIRES_IN` | backend | Token lifetime (default `8h`) |
| `CORS_ORIGIN` | backend | Allowed frontend origin |
| `UPLOAD_DIR` | backend | Where uploaded attachments/Excel files are stored |
| `VITE_API_URL` | frontend | Backend base URL the axios client targets |

## Data persistence

The backend currently runs entirely on an **in-memory store** (`backend/src/data/store.js`) that resets on every restart, seeded from `backend/src/data/seed.js`. This was a deliberate choice so the API contract, workflow rules, and frontend could all be built and tested without waiting on database provisioning.

A full SQL Server schema already exists at `db/schema.sql` (see `db/README.md`), designed field-for-field to match what the in-memory repositories expose today. Every route talks to data exclusively through the repository layer (`backend/src/data/repositories/`), so wiring the backend up to real SQL Server later is expected to only touch that layer — controllers, workflow rules, and routes should not need to change.

