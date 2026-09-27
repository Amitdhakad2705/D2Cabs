# Manual test plan (run before going live)

Use Razorpay **TEST** keys (`rzp_test_...`) and test cards/UPI from Razorpay's documentation.
Tick each line. Anything that fails: note the exact screen, what you clicked, and the error text.

## A. Backend basics
- [ ] `npm test` in `backend/` - 10 tests pass
- [ ] `GET /api/health` returns `{"success":true,"status":"ok"}`
- [ ] `npm run seed:cabs` prints "Cabs added: 6"; running it again prints "Cabs added: 0"
- [ ] `npm run seed:admin` creates the admin; running again says it already exists
- [ ] `GET /api/cabs` lists 6 cabs with prices

## B. Customer login
- [ ] Sign up with name, email, 10-digit mobile, password (min 8) - header shows your initial
- [ ] Sign up again with the same email or phone - clear error message
- [ ] Log out, log in with mobile number, log out, log in with email
- [ ] Wrong password shows "Invalid login details" (same message for unknown user)
- [ ] 11 wrong logins within 15 minutes are blocked
- [ ] Browser storage (Application tab) has NO password and no token; cookie `d2_customer_token` is HttpOnly
- [ ] Forgot password: enter email or mobile -> OTP arrives by email (dev: printed in backend terminal) -> reset -> old password fails, new works
- [ ] Wrong OTP 5 times locks that OTP

## C. Fares (compare with the old site)
- [ ] Indore city -> Indore city = Local; anything to Indore Airport = Airport; Indore -> Bhopal = Outstation
- [ ] Prices for a few routes match what the OLD site showed (one-way outstation Dzire 300 km = Rs 4,630)
- [ ] Round trip with a 3-day gap charges Rs 900 driver allowance (3 days)
- [ ] Disable a cab in admin -> it disappears from the results screen
- [ ] Changing a cab's price in admin changes the price shown on the website
- [ ] Booking at 12:30 AM books the correct DATE (old site had a timezone bug)

## D. Booking request
- [ ] Not logged in: REQUEST BOOKING asks you to log in
- [ ] Logged in: request goes through, "pending approval" screen shows a D2C-2026-000001 style id
- [ ] Booking appears in the customer dashboard under Upcoming (status "Booking Requested")
- [ ] Admin panel: Notifications shows the new request; Dashboard "Pending Requests" = 1
- [ ] Add-ons (roof carrier etc.) are included in the total shown in admin
- [ ] Trying to book a pickup less than 1 hour ahead is refused

## E. Admin approval and payment
- [ ] Admin -> Bookings -> open request -> Accept. Customer notification appears
- [ ] Customer dashboard shows "Pay ..." on that booking; it opens the checkout screen with the right amount
- [ ] Pay 25% with a Razorpay test payment -> success screen -> booking shows "partially paid", balance correct
- [ ] Pay the rest (100% option / Pay balance) -> "paid"
- [ ] Close the browser right after paying (before the success screen) -> after ~1 minute the booking is still marked paid (webhook)
- [ ] A failed payment leaves the booking unpaid and lets you retry
- [ ] Admin -> Payments shows the payment. Refund part of it -> booking balance updates, customer notified

## F. Driver and trip
- [ ] Admin -> Drivers -> add a driver
- [ ] Booking -> Assign driver -> customer sees driver name, phone, car, number
- [ ] Assigning the same driver to an overlapping trip is blocked (unless "assign even if overlapping" is ticked)
- [ ] Driver on the way -> Start trip -> Complete trip: each step shows in the customer's timeline
- [ ] Customer can rate a completed trip once; admin Feedback shows it
- [ ] Record a cash payment for the balance

## G. Cancel / reject
- [ ] Reject a pending booking with a reason -> customer sees the reason, payment never requested
- [ ] Customer cancels an upcoming booking -> admin notification says "REFUND DUE" if money was paid
- [ ] A booking already "Trip started" cannot be cancelled by the customer

## H. Security spot checks
- [ ] Logged in as a customer, open `/api/admin/bookings` -> 401/403
- [ ] Register with an extra field `"role":"admin"` in the request (use curl) -> account is still a customer
- [ ] Customer A cannot open Customer B's booking (`GET /api/bookings/<other id>` -> 404)
- [ ] Change the price in the browser network tab before booking -> ignored, server price used
- [ ] After changing password, another logged-in browser is logged out

## I. Admin panel screens
Dashboard, Bookings (all tabs and search), Customers (block/unblock), Cabs (add/edit/disable/delete),
Drivers (add/edit/trips), Payments, Feedback, Notifications, Reports (daily/weekly/monthly), Settings (save + change password).
