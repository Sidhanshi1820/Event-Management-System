# EventNov@ — Corporate Event Management System

EventNov@ is a full-stack corporate event management system: a static marketing site (home, event types, services, about, contact) backed by a Node.js/Express + MongoDB API. Visitors browse corporate event types, submit booking proposals through the contact form, and manage their account from a personal dashboard; admins review proposals and manage the event catalog from a dedicated admin panel. Corporate events only — conferences, seminars, workshops, webinars, product launches, and similar.

## Tech Stack

- **Frontend:** static HTML pages styled with Tailwind CSS (CDN), vanilla JS (`auth.js`, per-page scripts)
- **Backend:** Node.js + Express (`backend/`)
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (24h) with `tokenVersion` revocation
- **Email:** Nodemailer — dry-run (console-logged) when SMTP is not configured
- **Testing:** Jest + Supertest against an in-memory MongoDB

## Features

- **Get Started flow** — `get-started.html` combines login and register in one page with tabs; auth CTAs across the site point here.
- **JWT auth with revocation** — tokens carry the user's `tokenVersion`; logout and password change/reset bump it, invalidating every token already issued.
- **Brute-force protection** — login/register rate limited to 10 requests / 15 min; 5 failed logins lock that email for 15 minutes.
- **Admin role & panel** — `admin.html` lists booking proposals (new / contacted / closed) and CRUDs the event-type catalog.
- **Events catalog** — `GET /api/events` powers the DB-driven Event Types page (`events.html`), seeded by `scripts/seed-events.js`.
- **Booking proposals** — the contact form posts to `/api/proposals` (public, 5/hour rate limit, optional auth links the submitter).
- **User dashboard** — `dashboard.html`: profile edit, password change, login history, "my event requests".
- **Account recovery** — forgot/reset password (SHA-256-hashed, 10-minute tokens) and email verification links. Without SMTP configured (outside production) the reset link is returned in the API response and mailer output is console-logged.
- **Legal & polish** — Privacy Policy and Terms pages; favicon, meta descriptions, mobile navs, dynamic footer years.

## Quick Start

### Option A — Windows one-click

Run `start.bat` from the repo root. It checks Node/npm, starts the MongoDB service, installs backend dependencies if needed, then launches the backend API on http://localhost:3000 and the frontend (http-server) on http://localhost:8080, and opens the home page.

### Option B — Manual

1. Backend (needs a running MongoDB on :27017):

   ```bash
   cd backend
   npm install
   node scripts/seed-events.js   # upserts the 12 event types
   npm run dev                   # nodemon on :3000
   ```

2. Frontend — serve the repo root with any static server on :8080:

   ```bash
   npx http-server -p 8080 -c-1 --cors
   ```

3. Open http://localhost:8080/home.html

If MongoDB is unreachable, the backend falls back to an **in-memory MongoDB** in development (data is lost on restart); in production it refuses to start.

## Environment Variables

Copy `backend/.env.example` to `backend/.env`.

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | No | Defaults to `mongodb://localhost:27017/event_management` |
| `PORT` | No | Defaults to `3000` |
| `NODE_ENV` | No | `development` / `production`; production is stricter (no fallback DB, no placeholder secrets) |
| `JWT_SECRET` | **Yes** | Server exits at boot if missing/empty; placeholder values abort in production |
| `CORS_ORIGIN` | No | Comma-separated origin whitelist (defaults to localhost dev origins) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | No | Leave `SMTP_HOST` empty for dry-run mode (emails console-logged) |
| `APP_URL` | No | Frontend base URL used in email links (default `http://localhost:8080`) |

## Admin Setup

1. Register normally via `get-started.html`.
2. Promote the account:

   ```bash
   cd backend
   node scripts/create-admin.js you@example.com
   ```

3. Open `admin.html` and log in as that user to manage proposals and event types.

## API Summary

Base URL: `http://localhost:3000/api` (single source of truth in `config.js`).

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `GET /api/health` | — | Uptime check (exempt from rate limits) |
| `POST /api/auth/register` | — | Create account, sends verification email |
| `POST /api/auth/login` | — | Login (rate limited + lockout), returns JWT |
| `POST /api/auth/logout` | User | Bumps `tokenVersion`, revoking all tokens |
| `GET /api/auth/status` | User | Current session check |
| `GET /api/auth/verify/:token` | — | Email verification link |
| `POST /api/auth/forgot-password` | — | Sends reset link (always a generic 200) |
| `POST /api/auth/reset-password` | — | Sets a new password with the emailed token |
| `GET /api/auth/login-history` | User | Recent login timestamps/IPs |
| `GET` / `PUT /api/users/profile` | User | Read / update profile |
| `POST /api/users/change-password` | User | Change password (revokes tokens) |
| `DELETE /api/users/account` | User | Delete account |
| `GET /api/users/my-proposals` | User | Proposals submitted by the caller |
| `POST /api/proposals` | — | Submit a booking proposal (auth optional) |
| `GET /api/proposals` | Admin | List proposals (newest 100) |
| `PATCH /api/proposals/:id/status` | Admin | Set `new` / `contacted` / `closed` |
| `GET /api/events` | — | Active event types, optional `?category=` filter |
| `POST` / `PUT /api/events/:id` / `DELETE /api/events/:id` | Admin | Manage event types |

## Testing

```bash
cd backend
npm test    # 60+ test cases: model validation + API integration
```

Runs on Jest + Supertest against an in-memory MongoDB — no local database required. CI runs the same suite via GitHub Actions on every push/PR to `main` (`.github/workflows/test.yml`).

## Security Notes

- bcrypt password hashing; 8–72 character passwords (byte-length checked to avoid bcrypt truncation)
- JWT (24h) + `tokenVersion` revocation on logout and password change/reset
- Rate limits (300 req / 15 min globally, 10 / 15 min on login & register, 5 / hour on proposals) plus account lockout: 5 failed logins → 15-minute lock (in-memory, resets on server restart)
- `express-mongo-sanitize` (NoSQL injection), Helmet headers, CORS origin whitelist, schema-level input validation

The frontend stores tokens in `localStorage` and ships as static files — deploy the API behind HTTPS in production.

## Project Structure

```
Event management system/
├── home.html, get-started.html, events.html, services.html, about.html, contact.html
├── dashboard.html / admin.html  User dashboard · admin panel (proposals, event types)
├── forgot-password.html, reset.html, privacy.html, terms.html
├── login.html, register.html    Legacy standalone pages (superseded by get-started.html)
├── auth.js                      Shared frontend auth helpers (token in localStorage)
├── config.js                    window.API_BASE_URL — change once when deploying
├── start.bat                    Windows launcher (MongoDB + backend + frontend)
├── backend/
│   ├── server.js                Express app, middleware, rate limiters, DB connect
│   ├── routes/                  auth.js, users.js, proposals.js, events.js
│   ├── models/                  User, EventType, Proposal, Event, TicketType
│   ├── middleware/auth.js       verifyToken / verifyTokenOptional / requireAdmin
│   ├── utils/mailer.js          Nodemailer wrapper (dry-run without SMTP)
│   ├── scripts/                 seed-events.js, create-admin.js
│   ├── tests/auth.test.js       API integration tests (models/Event.test.js = model validation)
└── .github/workflows/test.yml   CI (Node 20, npm ci, npm test)
```

## Roadmap

- **Ticket sales** — the `TicketType` model (and the richer `Event` model) are scaffolding with no payment integration yet; the live catalog API is backed by `EventType`.
- **Content Security Policy** — disabled because Tailwind loads from a CDN with inline scripts; wiring nonces/hashes is pending.
- **Email verification is optional** — accounts work unverified; the emailed link only re-confirms the address.
