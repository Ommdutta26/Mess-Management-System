# IIIT Bhubaneswar · Mess Hub (MERN)

A mess management system for IIIT Bhubaneswar, built with **MongoDB, Express, React and Node.js**. Students book and skip meals and pay through a wallet. Mess staff serve meals at the counter, approve payments, edit the menu and review an audit log.

## Quick start

You need Node.js 18 or newer and MongoDB (local, Docker or Atlas).

```bash
docker compose up -d          # optional: starts MongoDB on port 27017
npm install                   # installs the root helper (concurrently)
npm run install:all           # installs server and client dependencies
cp server/.env.example server/.env   # then set JWT_SECRET to a long random string
npm run seed                  # loads demo users and the weekly menu
npm run dev                   # API on :5000, React app on http://localhost:5173
```

The Vite dev server proxies `/api` to the API, so no extra CORS setup is needed in development.

### Demo logins (after `npm run seed`)

| Role | ID | Password |
| --- | --- | --- |
| Student | `B2024CSE045`, `B2024ECE012`, `B2023IT033` | `student@123` |
| Head | `ADMIN` | `admin@123` |
| Counter staff / Accountant | `COUNTER01` / `ACCOUNTS01` | `staff@123` |

Staff sign in on the **Mess office** tab. Change these passwords before any real use.

## Features

- **Authentication:** JWT sessions (8 hours), bcrypt password hashing, student self-registration, suspended accounts blocked, login rate limiting.
- **Roles:** student, head, counter staff and accountant, enforced on the server for every protected route.
- **Students:** today's menu, weekly menu, skip or re-book meals (closes 2 hours before a meal), wallet and transaction history, top-up requests, meal feedback.
- **Wallet safety:** top-ups are requests that an accountant approves. Meal charges use an atomic database update, so a balance can never go below the configured minimum, and a meal can only be served once per student per day.
- **Counter:** serve a meal by roll number. Skipped meals, suspended accounts, duplicate servings and low balances are refused.
- **Mess office:** overview (wallet money held, low balances, expected versus served plates), top-up approvals, cash credits, suspend or activate students, menu editor (head), audit log.
- **Security basics:** helmet, CORS allow-list, request size limit, input validation and centralised error handling.

## Project structure

```
server/src/   config.js  models.js  auth.js  routes.js  seed.js  index.js
client/src/   App.jsx  pages.jsx (student)  staff.jsx (mess office)  api.js  ctx.js  util.js  styles.css
```

## API (all under `/api`, JSON, `Authorization: Bearer <token>`)

| Method and path | Access |
| --- | --- |
| `POST /auth/register`, `POST /auth/login`, `GET /me`, `GET /config` | public / signed in |
| `GET /menu`, `GET /notices`, `GET /skips`, `POST /skips/toggle` | signed in |
| `GET /wallet`, `POST /topups`, `GET /topups` | signed in (students see their own) |
| `POST /feedback`, `GET /feedback` | signed in |
| `PUT /menu`, `POST /notices`, `POST /admin/staff` | head |
| `POST /topups/:id/decide`, `GET /admin/overview`, `GET /admin/students`, `POST /admin/students/:id/credit`, `POST /admin/students/:id/toggle`, `GET /admin/audit` | head or accountant |
| `POST /counter/serve`, `GET /counter/today` | head or counter staff |

## Configuration (`server/.env`)

`MONGO_URI`, `JWT_SECRET` (required), `CLIENT_ORIGIN` (allowed web origin in production), `MIN_BALANCE` (lowest balance allowed after a charge, default 0) and `PORT`.

## Production

Run `npm run build`, serve `client/dist` from a web server or CDN, and run `npm start --prefix server` behind HTTPS. Set a strong `JWT_SECRET` and `CLIENT_ORIGIN`, and use a hosted MongoDB such as Atlas.

## Not yet ported from the earlier browser demo

Polls, feasts and events, guest passes, leave planner, kitchen stock, help desk, notification bell, monthly printable bill, charts, diet filter, dark-mode toggle, the demo payment QR and staff account screens (the staff API exists). There are no automated tests yet. Good next steps: tests for the wallet and counter rules, refresh tokens, and a real payment gateway.
