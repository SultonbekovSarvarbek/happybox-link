# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server. Proxies `/api` and `/uploads` to `https://happybox.uz` (see `vite.config.js`), so partner/service/order requests work locally with no extra setup.
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the production build locally.

No test runner, linter, or formatter is configured. Don't invent commands for them.

### Required env

`VITE_AMPLITUDE_API_KEY` (see `.env.example`). When absent, `src/lib/analytics.js` no-ops with a console warning — fine for local dev.

## Architecture

Single-page React 18 app (Vite, no React Router, no state library). The whole user flow lives in `src/App.jsx`.

### Two top-level modes, decided once on mount from the URL

`src/api.js` parses `window.location.pathname`:

- `/c/:shortCode` → **recipient view**: `App` short-circuits and renders `<CertificatePage shortCode={...} />`, which fetches the order and shows the gifted certificate / card-transfer activation flow.
- `/p/:id` (or bare `/:id`) → **sender view**: the multi-step purchase flow described below.

If neither matches, `App` shows `ErrorScreen` ("Партнёр не найден").

### Sender flow is a `step` integer, not routes

`App.jsx` holds `step` (0–6) and renders one element from a `screens` array. Navigation is `go(n)` which sets `step` and scrolls to top. Back/continue handlers are wired component-by-component; there is no router, no history entries per step, and refresh resets to step 0.

Steps: `Landing` → `ChooseType` → `Services` → `Cart` → `Recipient` → `Activation` → `Success`.

### `giftType` controls list source and cart semantics

`giftType` is `'cert'` or `'services'`. It decides:

- which list `Services` renders (`certificates` vs `services`, fetched in parallel on mount via `Promise.allSettled`),
- cart behavior in `toggleCart`: `'cert'` allows only one item (shows a toast if user tries to add a second); `'services'` is multi-select,
- which step `Recipient`'s back button returns to (cert flow has a Cart step; services flow goes straight back to selection — see `onBack={() => go(giftType === 'cert' ? 3 : 2)}`),
- analytics event shape (see below).

Switching `giftType` mid-flow with a non-empty cart triggers `ClearCartModal` via `pendingType`; confirming clears the cart and restarts at step 2.

### Order creation hands off to the backend's certificate URL

`Recipient`'s continue handler calls `createOrder(partnerId, ...)`, then `window.location.assign(o.certificateUrl)` — the app never reaches the local `Activation`/`Success` steps in the normal path; the backend redirects to `/c/:shortCode` which the recipient (or sender, after payment) opens. Steps 5 and 6 exist for completeness/legacy. Before redirecting, the partner's `cardNumber` is stashed in `localStorage` under `hb-card-number:<shortCode>` so `CertificatePage` can show the card-transfer details without a second API call.

### Analytics — Amplitude via `src/lib/analytics.js`

All `analytics.track*` helpers are no-ops until `analytics.init()` runs (called from `main.jsx`). `giftType` is mapped: `cert` → `ready`, `services` → `custom` when sent as `certificate_type`.

The "services" flow has a **builder session** concept tracked by the `builderActive` ref in `App.jsx`: `startBuilder` fires on entering step 2 with `giftType === 'services'`; it ends as `completed` on continue from `Services`, as `abandoned` on back from `Services` or on `beforeunload`. Don't add new entry/exit points to the services flow without wiring these.

### Styling

Single global stylesheet at `src/index.css` (~31KB). CSS variables (e.g. `--primary`, `--black`, `--sub-gray`, `--kb-offset`) are the source of truth — use them instead of hex literals. `--kb-offset` is updated from `visualViewport` in `App.jsx` so inputs aren't covered by the mobile keyboard; preserve that effect when touching layout.

UI text is Russian (`<html lang="ru">`). Keep new strings in Russian unless told otherwise.

## Conventions

- Commit messages follow `type(scope): summary` — types seen in history: `ui`, `feat`, `fix`. Scope is the screen or feature (e.g. `cert-page`, `recipient`, `services`, `gift-page`, `choose-type`). Keep summaries short and lowercase.
- Files in `dist/` are build output — never edit by hand, never commit fixes there.
- `docs/analytics.md` and `amplitude-plan.md` are the spec for analytics events; consult them before adding or renaming Amplitude events.
