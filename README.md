# FixMate — Smart Device & Home Appliance Repair Platform

A full-stack marketplace connecting households with verified repair technicians.
Customers browse approved services and submit repair requests; technicians
manage services and job statuses; admins oversee users, approvals, bookings and
payments.

**Stack:** Next.js 16 (App Router, Cache Components) · Express 5 · MongoDB ·
BetterAuth · JWT · Stripe Checkout · ImgBB · TypeScript

---

## Features

| Area | Highlights |
| --- | --- |
| Public site | Home, service listing with server-side search/filter/sort, service details, About, Login/Register (＋ `/sign-in`, `/sign-up` aliases), payment result pages, 404/error boundaries |
| Customers | Dashboard, my bookings with cancel + Pay Now, booking details with status timeline, payment history, profile editing with avatar upload |
| Technicians | Dashboard, add/edit/delete services (ImgBB upload), approval status, booking requests with the enforced status pipeline, final amount on completion |
| Admin | Platform statistics, user role management, service approvals, all services, all bookings, transaction history with revenue charts |
| Security | BetterAuth sessions → short-lived HS256 JWTs → Express verification with **role re-read from the database on every request**, ownership checks, signed Stripe webhook, duplicate-payment prevention |

### Booking business rules (enforced server-side)

- Only `customer` accounts can create bookings (technicians/admins are blocked)
- No booking your own service
- One active booking per customer per service (`requested/accepted/in-progress`)
- Customers may cancel only while status is `requested`
- Technician pipeline: `requested → accepted/rejected`, `accepted → in-progress`, `in-progress → completed`
- Completing a job requires `finalAmount > 0`

---

## Prerequisites

- Node.js 20+
- A MongoDB database (local or MongoDB Atlas)
- (Optional) Stripe test-mode keys for payments
- (Optional) ImgBB API key for image uploads

---

## Installation

```bash
# Frontend
npm install

# Backend
npm install --prefix server
```

## Environment variables

Create the following files. **Never commit real values** — both `.env*` files
are gitignored.

### `.env.local` (Next.js — root directory)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string used by BetterAuth |
| `BETTER_AUTH_SECRET` | Secret used by BetterAuth to sign session cookies |
| `BETTER_AUTH_URL` | Public base URL of the Next.js app (e.g. `http://localhost:3000`) |
| `JWT_SECRET` *(optional)* | Falls back to `BETTER_AUTH_SECRET` if unset |
| `NEXT_PUBLIC_API_URL` *(optional)* | Express API base URL (defaults to `http://localhost:5000`) |

### `server/.env` (Express — `server/` directory)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (e.g. `5000`) |
| `CLIENT_URL` | Allowed CORS origin of the Next.js app |
| `MONGODB_URI` | Same database as the frontend |
| `BETTER_AUTH_SECRET` | Same secret as the frontend |
| `BETTER_AUTH_URL` | Base URL used by the server-side BetterAuth instance |
| `IMGBB_API_KEY` | ImgBB key for service/avatar image uploads |
| `STRIPE_SECRET_KEY` *(optional)* | Stripe **test-mode** secret key |
| `STRIPE_WEBHOOK_SECRET` *(optional)* | Signing secret of the Stripe webhook endpoint |
| `JWT_SECRET` *(optional)* | Falls back to `BETTER_AUTH_SECRET` if unset |

> The app runs without Stripe keys, but checkout and webhook endpoints return
> `503` until they are configured.

---

## Development

```bash
# Terminal 1 — Next.js (http://localhost:3000)
npm run dev

# Terminal 2 — Express API (http://localhost:5000)
npm run dev --prefix server
```

## Seed data

```bash
npm run seed --prefix server
```

Creates (idempotently — existing documents are never overwritten):

- 2 technicians, 2 customers, 1 admin
- 14 services (12 approved, 1 pending, 1 unavailable)
- 5 sample bookings across the status pipeline
- **No payment records** — payments are only written by the verified Stripe webhook

All seeded accounts use the password `fixmate123` (development only).

## Production build

```bash
# Frontend
npm run build
npm start

# Backend
npm run build --prefix server
npm run start --prefix server
```

## Lint

```bash
npm run lint
```

---

## Stripe webhook setup (test mode)

1. Create a test key pair in the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys).
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `server/.env`.
3. Forward events to your API:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
   (or register `https://<your-api-domain>/api/payments/webhook` in the dashboard)
4. Copy the printed webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

Checkout only unlocks for **completed, unpaid** bookings. The webhook payload is
signature-verified before any booking is marked paid, and duplicate deliveries
are ignored. Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## API overview

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/services` | public (approved + available, `search/category/mode/sort/limit`) |
| GET | `/api/services/:id` | public |
| POST | `/api/services` · `/api/services/upload-image` | technician |
| GET | `/api/services/mine` | technician |
| PATCH/DELETE | `/api/services/:id` · `/:id/availability` | technician (owner) |
| GET | `/api/services/admin/pending` · `/admin/all` | admin |
| PATCH | `/api/services/:id/approval` | admin |
| POST | `/api/bookings` | customer |
| GET | `/api/bookings/mine` | customer |
| GET | `/api/bookings/assigned` | technician |
| GET | `/api/bookings/all` | admin |
| GET | `/api/bookings/:id` | owner (customer/technician) or admin |
| PATCH | `/api/bookings/:id/status` | technician (pipeline enforced) |
| PATCH | `/api/bookings/:id/cancel` | customer (only while `requested`) |
| POST | `/api/payments/checkout/:bookingId` | customer |
| GET | `/api/payments/verify?session_id=` | customer (read-only) |
| GET | `/api/payments/mine` | customer |
| GET | `/api/payments` | admin |
| POST | `/api/payments/webhook` | Stripe (signature-verified) |
| GET/PATCH | `/api/users/me` · POST `/api/users/upload-image` | any signed-in user |
| GET | `/api/users` · PATCH `/api/users/:id/role` | admin |
| GET | `/api/admin/stats` | admin |

Health check: `GET /api/health`.

---

## Deployment notes

- **Frontend:** `npm run build && npm start` (or Vercel) — set `NEXT_PUBLIC_API_URL` to the deployed API URL.
- **Backend:** `npm run build --prefix server && npm run start --prefix server` behind a process manager; set `CLIENT_URL` to the deployed frontend origin and register the production webhook URL in Stripe.
- Point both apps at the same MongoDB database and share `BETTER_AUTH_SECRET`.
- Run `npm run seed --prefix server` once against an empty database if you want demo data.

## Troubleshooting

- **`bad auth : authentication failed`** — the `MONGODB_URI` credentials are wrong or the Atlas IP access list does not include your machine.
- **Webhook returns 400** — `STRIPE_WEBHOOK_SECRET` does not match the endpoint Stripe is signing with.
- **Services page shows the error state** — the API is unreachable; start the backend and press Retry.
