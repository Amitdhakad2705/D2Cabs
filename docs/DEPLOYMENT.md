# Going live

## 1. What you need
- A domain (example: `d2cabs.com`). Use sub-domains so the login cookie works everywhere:
  `d2cabs.com` (customer site), `admin.d2cabs.com` (admin), `api.d2cabs.com` (backend). **Keep them on one parent domain.**
- MongoDB Atlas (free/paid cluster) - copy the connection string. Allow only your server's IP.
- A small server (any VPS with Ubuntu) or a host that runs Node (Render, Railway ...).
- Razorpay LIVE keys (after KYC), and an SMTP account for email (Brevo, Gmail app password, Amazon SES ...).
- HTTPS everywhere (Let's Encrypt / Cloudflare). Cookies are `secure` in production, so plain HTTP will not log in.

## 2. Backend
```bash
cd backend && npm ci --omit=dev
cp .env.example .env     # NODE_ENV=production and fill everything
```
Important `.env` values in production:
- `NODE_ENV=production`
- `JWT_SECRET` = 48+ random characters (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `CLIENT_URLS=https://d2cabs.com,https://admin.d2cabs.com`
- `MONGODB_URI` = Atlas string
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `SMTP_*`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL`
- `OSRM_BASE_URL` - see section 5

Run once: `npm run seed:cabs` and `npm run seed:admin` (then delete `ADMIN_PASSWORD` from `.env`).
Keep it running with PM2: `pm2 start src/server.js --name d2cabs-api && pm2 save && pm2 startup`.
Put Nginx (or your host's proxy) in front for HTTPS and forward to port 5000. Behind a proxy the code already uses `trust proxy`.

## 3. Razorpay webhook
Razorpay Dashboard -> Settings -> Webhooks -> add `https://api.d2cabs.com/api/payments/webhook`,
secret = `RAZORPAY_WEBHOOK_SECRET`, events: `payment.captured`, `payment.failed`.
Also switch the Razorpay account to live keys only after the full TEST run in `docs/TESTING.md`.

## 4. Frontends
```bash
cd customer && cp .env.example .env    # VITE_API_BASE_URL=https://api.d2cabs.com/api
npm ci && npm run build                 # upload the dist/ folder
cd ../admin && cp .env.example .env     # same value
npm ci && npm run build
```
Serve each `dist/` as a static site with a **single-page-app fallback** (every unknown URL returns `index.html`).
Nginx example: `location / { try_files $uri /index.html; }`. Netlify/Cloudflare Pages: the `_redirects` file is already in `customer/public`.
Add the same `_redirects` line (`/* /index.html 200`) to `admin/public/_redirects` if you use Netlify.
Block search engines from the admin site (it already has `noindex`).

## 5. Replace free demo services BEFORE launch
- **Distance (server):** `router.project-osrm.org` is a free demo with usage limits. Self-host OSRM, or change only the
  `getRoadRoute()` function in `backend/src/services/routing.service.js` to Google Distance Matrix / Mapbox Directions.
- **Place search (browser):** the website and dashboard use `photon.komoot.io` free search. For real traffic use Google Places,
  Mapbox Geocoding, or self-host Photon. Search is in `customer/public/js/index.js` and `customer/src/pages/Dashboard.jsx`.

## 6. Production checklist
- [ ] All of `docs/TESTING.md` passed with test keys, then one small real payment + refund with live keys
- [ ] `.env` files are NOT in git/zip; secrets rotated if they were ever shared
- [ ] Admin password is long and unique; `seed:admin` password removed from `.env`
- [ ] MongoDB Atlas backups on; database user has only the needed rights
- [ ] HTTPS on all three domains; `CLIENT_URLS` lists only your real domains
- [ ] Terms & Conditions, Privacy, cancellation/refund policy pages written by the owner
- [ ] Contact page, About page, FAQ: real email/phone (placeholders `example@gmail.com` removed)
- [ ] Images compressed (public/images ~7.6 MB) and CSS trimmed (~900 KB) for mobile speed
- [ ] Google Apps Script web app from the old system turned off
- [ ] Uptime monitor on `https://api.d2cabs.com/api/health`
- [ ] Someone checks the admin Notifications daily (or set `ADMIN_NOTIFY_EMAIL` so new requests are emailed)
