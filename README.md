# MedCoin Admin

The administrative web panel for the **MedCoin.AI** platform. It provides a secure dashboard for the team to monitor the patient triage/consultation pipeline, manage payments and scheduling, configure platform settings, and administer doctors and staff.

This is a single-page React application that talks to the [MedCoin backend API](../medCoin).

---

## Features

- **Authentication** — login, forgot/reset password via email OTP, and protected routes.
- **Dashboard** — key metrics with charts (consultations by state, daily volume, severity breakdown) and date-range filtering.
- **Patients** — searchable, paginated patient records with detail views.
- **Consultations & Meetings** — track session state, scheduling, and outcomes.
- **Transactions** — payment history with status and detail views.
- **Doctors & Staff** — manage profiles, availability, and access.
- **Severities** — configure severity levels used by triage.
- **Settings** — consultation pricing, session expiry timing, doctor alert numbers, and WhatsApp (Z-API) connection management (QR pairing, status, disconnect).
- **Profile** — update your own profile, avatar, and password.
- **Responsive UI** — mobile-friendly layout with touch-optimized controls.

---

## Tech stack

- **Framework:** React 19 + TypeScript
- **Build tool:** Vite 6
- **UI:** Material UI (MUI) v9 + MUI X Data Grid
- **State & data fetching:** Redux Toolkit + RTK Query
- **Routing:** React Router v7
- **Charts:** Recharts
- **Styling:** Tailwind CSS v4 (via Vite plugin) + MUI theming
- **Linting:** ESLint

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- A running instance of the MedCoin backend API

---

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root (see [Environment variables](#environment-variables)).

3. Start the development server:

```bash
npm run dev
```

Vite serves the app locally (default `http://localhost:5173`).

4. Build for production:

```bash
npm run build
```

5. Preview the production build:

```bash
npm run preview
```

---

## Environment variables

Create a `.env` file in the project root. Only variables prefixed with `VITE_` are exposed to the client at build time.

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the backend admin API. Defaults to `/api/admin` (suitable when the app and API share an origin or a dev proxy). Set to the full backend URL otherwise. |

> Do not place secrets in this file — anything prefixed with `VITE_` is bundled into the public client build.

---

## NPM scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload. |
| `npm run build` | Type-check and build the production bundle. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint across the project. |

---

## Project structure

```
medCoin-admin/
├── public/                 # Static assets (logo, favicon)
└── src/
    ├── components/          # Reusable UI: auth, layout, forms, data grid, feedback, modals
    ├── config/             # API base URL and client config
    ├── constants/          # Brand and shared constants
    ├── features/           # Page-level feature modules (dashboard, patients, consultations,
    │                       #   meetings, transactions, doctors, staff, severities, settings, profile)
    ├── hooks/              # Custom React hooks (breakpoints, toasts, debounced search)
    ├── store/              # Redux store, RTK Query API, slices, listeners
    ├── types/              # Shared TypeScript types
    ├── utils/              # Formatting and helper utilities
    ├── App.tsx             # App shell, theme, and route definitions
    └── main.tsx            # Entry point
```

---

## Authentication flow

The panel authenticates against the backend and persists the access token in browser storage. Protected routes redirect unauthenticated users to the login page, while guest-only routes (login, forgot/reset password) redirect authenticated users to the dashboard.

---

## License

Private — for internal MedCoin use.
