# D2Cabs - Complete Project (Steps 1-8)

```
D2Cabs/
  customer/   React + Vite customer website (connected to the API)
  admin/      React + Vite admin panel (new)
  backend/    Node + Express + MongoDB API (new)
  docs/       TESTING.md (manual test plan), DEPLOYMENT.md (go-live guide)
  docker-compose.yml   optional local MongoDB
```

## Status (read this first)

| Step | What | Status |
|---|---|---|
| 1 | Backend, 10 MongoDB models, customer + admin login (bcrypt + JWT in httpOnly cookie) | Written |
| 2 | Cabs API, server-side fare engine, drivers API | Written. **Fare engine tested** (`npm test`, matches the old frontend numbers) |
| 3 | Booking API: request, approve/reject, assign driver, status flow, cancel, notifications, ratings | Written |
| 4 | Customer site connected to the API (login, fares, booking, payment, dashboard) | Written |
| 5 | Admin panel (12 screens) | Written |
| 6 | Real Razorpay payments: order, signature check, capture check, webhook, refund | Written |
| 7 | Real forgot-password (email OTP), booking emails, in-site notifications | Written (needs SMTP details) |
| 8 | Tests + deployment guide + production checklist | Tests: 10 automated. Manual test plan in `docs/TESTING.md` |

**Not yet run end to end.** This package was written where npm install and a browser were not
available. What HAS been verified: every JS/JSX file parses; every import/export resolves;
the 10 automated tests pass (fare engine vs the old formulas, Razorpay signature checks, trip
type detection, booking status rules, input validation). What has NOT: starting the server,
talking to MongoDB, a real Razorpay payment, clicking through the screens. Expect to fix small
things in the first test run - `docs/TESTING.md` is the checklist to find them.

## Run everything locally

Needs Node 18+ and MongoDB (`docker compose up -d` gives one).

```bash
# 1) backend
cd backend
npm install
cp .env.example .env      # fill MONGODB_URI, JWT_SECRET, ADMIN_* (Razorpay/SMTP can wait)
npm run seed:cabs         # 6 cabs + prices from the old frontend
npm run seed:admin        # first admin login from .env
npm test                  # 10 tests, no database needed
npm run dev               # http://localhost:5000/api/health

# 2) customer website (new terminal)
cd customer && npm install && npm run dev      # http://localhost:3000

# 3) admin panel (new terminal)
cd admin && npm install && npm run dev         # http://localhost:3001
```
Both frontends forward `/api` to the backend (Vite proxy), so login cookies just work.

## How a booking works now

1. Customer picks pickup/drop on the website. The **server** finds the road distance, decides
   Local / Airport / Outstation from the coordinates and prices every cab (`POST /api/fare/quote`).
2. Customer logs in and taps REQUEST BOOKING. Server re-prices everything itself and saves the
   booking as `PENDING` (`POST /api/bookings`). Admin gets a notification (and email if SMTP is set).
3. Admin opens **Bookings** -> the request -> **Accept** (booking `CONFIRMED`, payment `PENDING`) or **Reject** (reason).
4. Customer gets a notification and pays from **My Bookings -> Pay now** (25% advance or 100%).
   The server creates the Razorpay order, checks the signature, asks Razorpay if the payment is
   really captured, then marks it paid. A Razorpay webhook is a second safety net.
5. Admin **assigns a driver** (saved driver or typed manually). Customer sees driver name, phone, car, number.
6. Admin moves the trip: Driver on the way -> Trip started -> Completed. Customer can then rate the trip.
7. Balance can be paid online, or admin records a cash payment. Refunds are done from the admin Payments screen.

Booking status: `PENDING -> CONFIRMED -> DRIVER_ASSIGNED -> DRIVER_ON_THE_WAY -> TRIP_STARTED -> COMPLETED`
(also `PENDING -> REJECTED`, and `CONFIRMED / DRIVER_ASSIGNED / DRIVER_ON_THE_WAY -> CANCELLED`).
Payment status is separate: `NOT_REQUESTED -> PENDING -> PARTIALLY_PAID -> PAID` (`FAILED`, `REFUNDED`).
Rules live in `backend/src/constants.js`.

## Decisions I made (change them if the owner disagrees)

| Question | What the code does now | Where to change |
|---|---|---|
| Payment timing | After admin approval | `payment.controller.js` |
| Advance | Customer chooses 25% or 100% (as the old site offered) | `constants.js` PAY_PERCENT_OPTIONS |
| Driver before payment? | Allowed. Set `REQUIRE_PAYMENT_BEFORE_DRIVER=true` to require the advance | `backend/.env` |
| Customer cancel | Allowed until the driver is on the way. **No automatic refund** - admin refunds from Payments | `constants.js` CUSTOMER_CANCELLABLE |
| Refund policy / cancellation fee | **Not decided by me** - admin decides case by case | owner |
| Forgot password | 6-digit OTP by **email** (SMS needs a paid provider) | `account.controller.js` |
| Round trip days | Counted from pickup date to return date, Rs 300 per day (old site always charged 1 day) | `fare.service.js` |
| Minimum notice | Pickup must be at least 1 hour ahead (admin can change in Settings) | admin Settings |
| Service type | Decided by the server from coordinates, browser value ignored | `geo.service.js` |
| Coupons | Not implemented; the coupon box now says "not available yet" | - |

## Security fixes vs the old ZIP

Plain-text passwords in localStorage -> bcrypt + httpOnly cookie. Hard-coded OTP 1234 -> real emailed OTP
(5 tries, 10 min). Fare/distance/service type calculated in the browser -> calculated on the server.
Payment success posted by the browser -> verified by the server with Razorpay. Google Apps Script URL and
admin email removed from public JS. Admin cannot be created by signing up; role is always checked on the server.
Old login sessions stop working after a password change.

## Still to do before real customers (owner / coder)

- Run through `docs/TESTING.md` and fix what breaks. Use Razorpay TEST keys first.
- Fill SMTP settings (forgot-password and emails need them).
- **Terms & Conditions and cancellation/refund policy pages**: content must come from the owner. Not created.
- Replace the free public map services (OSRM demo, Photon search) - see `docs/DEPLOYMENT.md`.
- Replace `example@gmail.com` placeholders in About / Contact / FAQ pages and check the WhatsApp number.
- Compress images (7.6 MB) and CSS (about 900 KB).
- Optional later: SMS/WhatsApp notifications, real React rewrite of the old HTML pages, public reviews on the homepage.
- The first Google Apps Script booking system is gone from the code. Turn it off in the Google account too.

## API reference

Public: `GET /api/health`, `GET /api/config`, `GET /api/cabs`, `POST /api/fare/quote`,
`POST /api/auth/register|login|logout|forgot-password|reset-password`.

Customer (login cookie): `GET /api/auth/me`, `PUT /api/auth/profile`, `POST|DELETE /api/auth/addresses`,
`POST /api/auth/change-password`, `POST /api/bookings`, `GET /api/bookings/my`, `GET /api/bookings/:id`,
`POST /api/bookings/:id/cancel`, `POST /api/bookings/:id/feedback`, `POST /api/payments/create-order`,
`POST /api/payments/verify-payment`, `GET /api/notifications`, `POST /api/notifications/read-all|:id/read`.

Razorpay: `POST /api/payments/webhook` (signature-checked, raw body).

Admin (admin cookie, all under `/api/admin`): `auth/login|logout|me|change-password`, `dashboard`, `reports?period=`,
`bookings` (+ `/:id`, `/:id/approve|reject|assign-driver|status|note|record-cash`), `cabs`, `drivers` (+ `/:id/trips`),
`payments` (+ `/:id/refund`), `customers`, `feedback`, `notifications`, `settings`.

## Rules for developers

1. Login is an httpOnly cookie. Every browser request needs `credentials: 'include'`. Never store a token or password in the browser.
2. Never trust an amount, distance, service type or price sent by a browser. The server recalculates.
3. Razorpay **secret** keys live only in `backend/.env`.
4. Do not change the homepage booking steps; only the code behind them changed.
5. Customer and admin use different cookies, so both can be logged in at once.
