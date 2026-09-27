import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import { api } from '../services/api';
import {
  BookingsIcon,
  GiftIcon,
  PinIcon,
  CardIcon,
  StarIcon,
  HelpIcon,
  SettingsIcon,
  LogoutIcon,
  CarIcon,
  PhoneIcon,
  LockIcon,
  BanIcon,
  CloseIcon,
} from '../components/DashIcons';

const BOOKING_TABS = [
  { key: 'active', label: 'Active' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STEPS = ['Booking Requested', 'Admin Confirmed', 'Driver Assigned', 'Trip Started', 'Completed'];
const STEP_INDEX = {
  PENDING: 0,
  CONFIRMED: 1,
  DRIVER_ASSIGNED: 2,
  DRIVER_ON_THE_WAY: 2,
  TRIP_STARTED: 3,
  COMPLETED: 4,
};
const PAYABLE = ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_ON_THE_WAY', 'TRIP_STARTED'];
const CANCELLABLE = ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED'];

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtTime = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const tripLabel = (b) => `${b.serviceType[0].toUpperCase()}${b.serviceType.slice(1)} · ${b.tripType === 'round_trip' ? 'Round Trip' : 'One Way'}`;

/* ---------------- Booking card ---------------- */

function RatingForm({ bookingId, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!rating) {
      setErr('Please choose 1 to 5 stars.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await api.post(`/bookings/${bookingId}/feedback`, { rating, comment });
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="d2dash-rate-box">
      <strong>Rate your trip</strong>
      <div className="d2dash-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={n <= rating ? 'on' : ''} onClick={() => setRating(n)} aria-label={`${n} star`}>
            ★
          </button>
        ))}
      </div>
      <textarea placeholder="Tell us about your ride (optional)" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
      {err && <p className="d2dash-form-error">{err}</p>}
      <button className="track-btn" type="button" disabled={busy} onClick={submit}>
        {busy ? 'Sending…' : 'Submit rating'}
      </button>
    </div>
  );
}

function BookingCard({ booking: b, group, rating, onChanged }) {
  const [showFare, setShowFare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const drv = b.driverSnapshot && b.driverSnapshot.name ? b.driverSnapshot : null;
  const step = STEP_INDEX[b.bookingStatus];
  const lastNote = (b.statusHistory || []).slice(-1)[0]?.note;
  const canPay = PAYABLE.includes(b.bookingStatus) && b.balanceDue > 0;
  const payLabel = b.paidAmount > 0 ? `Pay balance ${inr(b.balanceDue)}` : `Pay ${inr((b.fare.finalAmount * b.payPercent) / 100)} now`;

  async function cancel() {
    if (!window.confirm('Cancel this booking?')) return;
    setBusy(true);
    setErr('');
    try {
      await api.post(`/bookings/${b.bookingId}/cancel`, {});
      onChanged();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="d2dash-booking-card">
      {b.bookingStatus === 'CANCELLED' && <span className="d2dash-booking-tag cancelled">Cancelled by {b.cancelledBy || 'you'}</span>}
      {b.bookingStatus === 'REJECTED' && <span className="d2dash-booking-tag cancelled">Not confirmed</span>}
      {b.bookingStatus === 'COMPLETED' && <span className="d2dash-booking-tag completed">Completed</span>}

      <div className="d2dash-booking-top">
        <div className="d2dash-avatar">{drv ? drv.name.trim().charAt(0).toUpperCase() : '?'}</div>
        <div className="d2dash-booking-driver">
          <strong>{drv ? drv.name : 'Driver not assigned yet'}</strong>
          <span>Booking ID: {b.bookingId}</span>
        </div>
        {rating && (
          <div className="d2dash-booking-rating">
            <StarIcon /> {rating.rating}
          </div>
        )}
      </div>

      <div className="d2dash-booking-route">
        <div className="pickup">{b.pickup.address}</div>
        <div className="drop">{b.drop.address}</div>
      </div>

      {step !== undefined && (
        <ul className="d2dash-steps">
          {STEPS.map((label, i) => (
            <li key={label} className={i <= step ? 'done' : ''}>
              {i <= step ? '✓' : '○'} {i === 2 && b.bookingStatus === 'DRIVER_ON_THE_WAY' ? 'Driver On The Way' : label}
            </li>
          ))}
        </ul>
      )}
      {b.bookingStatus === 'REJECTED' && lastNote && <p className="d2dash-note">Reason: {lastNote}</p>}

      <div className="d2dash-booking-info">
        <div className="d2dash-booking-info-row"><span>Date</span><b>{fmtDate(b.journeyDate)}</b></div>
        <div className="d2dash-booking-info-row"><span>Time</span><b>{fmtTime(b.journeyTime)}</b></div>
        <div className="d2dash-booking-info-row"><span>Car Type</span><b>{b.cabId ? `${b.cabId.name} (${b.cabId.category})` : '—'}</b></div>
        <div className="d2dash-booking-info-row"><span>Trip Type</span><b>{tripLabel(b)}</b></div>
        {drv && (
          <>
            <div className="d2dash-booking-info-row"><span>Driver Phone</span><b>{drv.phone}</b></div>
            <div className="d2dash-booking-info-row"><span>Vehicle</span><b>{drv.vehicleName || '—'}</b></div>
            <div className="d2dash-booking-info-row"><span>Number Plate</span><b>{drv.vehicleNumber || '—'}</b></div>
          </>
        )}
      </div>

      <button type="button" className="d2dash-booking-payment" onClick={() => setShowFare((v) => !v)}>
        <span>
          Payment{' '}
          <span className={b.paymentStatus === 'PAID' ? 'paid' : 'pending'}>
            ({b.paymentStatus === 'NOT_REQUESTED' ? 'Awaiting approval' : b.paymentStatus.replace('_', ' ').toLowerCase()})
          </span>
        </span>
        <b>
          {inr(b.fare.finalAmount)} <span className="d2dash-fare-caret">{showFare ? '▲' : '▼'}</span>
        </b>
      </button>

      {showFare && (
        <div className="d2dash-fare-detail">
          <div className="d2dash-fare-detail-row"><span>Trip Fare ({b.fare.distanceKm} km)</span><b>{inr(b.fare.baseFare)}</b></div>
          {b.fare.driverAllowance > 0 && <div className="d2dash-fare-detail-row"><span>Driver Allowance</span><b>{inr(b.fare.driverAllowance)}</b></div>}
          {b.fare.addonAmount > 0 && <div className="d2dash-fare-detail-row"><span>Add-ons</span><b>{inr(b.fare.addonAmount)}</b></div>}
          {b.fare.gst > 0 && <div className="d2dash-fare-detail-row"><span>GST</span><b>{inr(b.fare.gst)}</b></div>}
          <div className="d2dash-fare-detail-row"><span>Paid so far</span><b>{inr(b.paidAmount)}</b></div>
          <div className="d2dash-fare-detail-row"><span>Balance due</span><b>{inr(b.balanceDue)}</b></div>
          <div className="d2dash-fare-detail-row d2dash-fare-total"><span>Total</span><b>{inr(b.fare.finalAmount)}</b></div>
        </div>
      )}

      {err && <p className="d2dash-form-error">{err}</p>}

      {group === 'active' && drv && (
        <div className="d2dash-booking-actions">
          <a className="icon-btn call-btn" href={`tel:${drv.phone}`} aria-label="Call driver">
            <PhoneIcon /> Call driver
          </a>
          {canPay && <Link className="track-btn" to={`/?pay=${b.bookingId}`}>{payLabel}</Link>}
        </div>
      )}
      {group === 'upcoming' && (
        <div className="d2dash-booking-actions">
          {CANCELLABLE.includes(b.bookingStatus) && (
            <button className="cancel-btn" type="button" disabled={busy} onClick={cancel}>
              {busy ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
          {canPay && <Link className="track-btn" to={`/?pay=${b.bookingId}`}>{payLabel}</Link>}
        </div>
      )}
      {group === 'completed' && !rating && <RatingForm bookingId={b.bookingId} onDone={onChanged} />}
    </div>
  );
}

/* ---------------- Real pickup/drop search (same Photon API + Indore bias as the homepage) ---------------- */

const INDORE_LAT = 22.7196;
const INDORE_LON = 75.8577;

async function searchLocations(query) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${INDORE_LAT}&lon=${INDORE_LON}&limit=6&lang=en`;
  const res = await fetch(url, { method: 'GET', mode: 'cors', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('search failed: ' + res.status);
  const data = await res.json();
  const features = (data.features || []).filter((f) => {
    const p = f.properties || {};
    return !p.countrycode || p.countrycode === 'IN';
  });
  return features.map((f) => {
    const p = f.properties || {};
    const coords = (f.geometry && f.geometry.coordinates) || [];
    const primary = p.name || p.street || p.district || 'Unknown';
    const area = p.city || p.district || p.state || 'India';
    const label = primary.toLowerCase() === area.toLowerCase() ? primary : `${primary}, ${area}`;
    return { label, lat: coords[1], lon: coords[0] };
  });
}

function LocationField({ kind, place, onChange, placeholder }) {
  const [query, setQuery] = useState(place.label || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  function handleInput(val) {
    setQuery(val);
    onChange({ label: val, lat: null, lon: null });
    clearTimeout(timerRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(val.trim());
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch (err) {
        setSuggestions([]);
        setOpen(false);
      }
    }, 350);
  }

  function pick(r) {
    setQuery(r.label);
    onChange({ label: r.label, lat: r.lat, lon: r.lon });
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className={`d2dash-loc-field ${kind}`}>
      <div className="d2dash-loc-row">
        <div className="d2dash-loc-text">
          <label>{kind === 'pickup' ? 'From' : kind === 'drop' ? 'To' : 'Address'}</label>
          <input
            type="text"
            value={query}
            placeholder={placeholder || (kind === 'pickup' ? 'Enter Pickup Location' : 'Enter Drop Location')}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
        </div>
      </div>
      {open && (
        <div className="d2dash-loc-suggestions">
          {suggestions.map((r, i) => (
            <div key={i} onMouseDown={() => pick(r)}>{r.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Data hook: all of the customer's bookings ---------------- */

function useMyBookings() {
  const [state, setState] = useState({ loading: true, error: '', groups: null, ratings: {} });
  const load = useCallback(async () => {
    try {
      const r = await api.get('/bookings/my');
      setState({ loading: false, error: '', groups: r.groups, ratings: r.ratings || {} });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load };
}

/* ---------------- Bookings view ---------------- */

function BookingsView({ firstName, data }) {
  const [tab, setTab] = useState('active');
  const [pickup, setPickup] = useState({ label: '', lat: null, lon: null });
  const [drop, setDrop] = useState({ label: '', lat: null, lon: null });
  const navigate = useNavigate();
  const list = data.groups ? data.groups[tab] : [];

  const emptyText = {
    active: 'No active booking right now.',
    upcoming: 'No upcoming bookings.',
    completed: "You haven't completed a ride yet.",
    cancelled: 'No cancelled bookings.',
  }[tab];

  function handleBookRide() {
    // Hand the chosen pickup/drop to the homepage booking form (same key public/js/index.js reads).
    localStorage.setItem(
      'd2cabsPendingLocations',
      JSON.stringify({
        fromLabel: pickup.label,
        fromLat: pickup.lat,
        fromLon: pickup.lon,
        toLabel: drop.label,
        toLat: drop.lat,
        toLon: drop.lon,
      })
    );
    navigate('/#homeScreen');
  }

  return (
    <section className="d2dash-bookings-section">
      <div className="d2dash-card d2dash-hero-card">
        <h2 className="d2dash-hero-greet">Hi, {firstName}</h2>
        <p className="d2dash-sub">Where are you going today?</p>
        <div className="d2dash-hero-route">
          <LocationField kind="pickup" place={pickup} onChange={setPickup} />
          <LocationField kind="drop" place={drop} onChange={setDrop} />
        </div>
        <button className="d2dash-book-btn" type="button" onClick={handleBookRide}>
          Book a Ride
        </button>
      </div>

      <div className="d2dash-tabs d2dash-tabs-4">
        {BOOKING_TABS.map((t) => (
          <button key={t.key} type="button" className={`d2dash-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            {data.groups && data.groups[t.key].length > 0 ? ` (${data.groups[t.key].length})` : ''}
          </button>
        ))}
      </div>

      {data.loading ? (
        <div className="d2dash-empty"><p>Loading your bookings…</p></div>
      ) : data.error ? (
        <div className="d2dash-empty">
          <p>{data.error}</p>
          <button className="d2dash-link-btn" type="button" onClick={data.reload}>Try again</button>
        </div>
      ) : list.length === 0 ? (
        <div className="d2dash-empty">
          <div className="d2dash-empty-icon">{tab === 'cancelled' ? <BanIcon /> : <CarIcon />}</div>
          <p>{emptyText}</p>
          {(tab === 'active' || tab === 'upcoming') && (
            <Link className="d2dash-link-btn" to="/#homeScreen">Book a Ride</Link>
          )}
        </div>
      ) : (
        <div className="d2dash-booking-list">
          {list.map((b) => (
            <BookingCard key={b._id} booking={b} group={tab} rating={data.ratings[b._id]} onChanged={data.reload} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Notifications ---------------- */

function NotificationsView() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/notifications').then((r) => setItems(r.notifications)).catch((e) => setErr(e.message));
  }, []);

  async function markAll() {
    await api.post('/notifications/read-all').catch(() => {});
    setItems((list) => (list || []).map((n) => ({ ...n, isRead: true })));
  }

  return (
    <section className="d2dash-card">
      <h3>Notifications</h3>
      <p className="d2dash-sub">Updates on your bookings and payments</p>
      {err && <p className="d2dash-form-error">{err}</p>}
      {items === null && !err && <div className="d2dash-empty"><p>Loading…</p></div>}
      {items && items.length === 0 && (
        <div className="d2dash-empty">
          <div className="d2dash-empty-icon"><GiftIcon /></div>
          <p>No notifications yet.</p>
        </div>
      )}
      {items && items.length > 0 && (
        <>
          <button className="d2dash-link-btn" type="button" onClick={markAll}>Mark all as read</button>
          <div className="d2dash-notif-list">
            {items.map((n) => (
              <div key={n._id} className={`d2dash-notif${n.isRead ? '' : ' unread'}`}>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small>{new Date(n.createdAt).toLocaleString('en-IN')}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- Saved addresses ---------------- */

function AddressesView({ user, setUser }) {
  const [label, setLabel] = useState('Home');
  const [place, setPlace] = useState({ label: '', lat: null, lon: null });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!place.label.trim()) {
      setErr('Please search and choose an address.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const r = await api.post('/auth/addresses', {
        label,
        address: place.label.trim(),
        latitude: place.lat ?? undefined,
        longitude: place.lon ?? undefined,
      });
      setUser({ ...user, addresses: r.addresses });
      setPlace({ label: '', lat: null, lon: null });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      const r = await api.del(`/auth/addresses/${id}`);
      setUser({ ...user, addresses: r.addresses });
    } catch (e) {
      setErr(e.message);
    }
  }

  const addresses = user.addresses || [];
  return (
    <section className="d2dash-card">
      <h3>Saved Addresses</h3>
      {addresses.length === 0 && <div className="d2dash-empty"><p>No saved addresses yet.</p></div>}
      {addresses.map((a) => (
        <div key={a._id} className="d2dash-address-row">
          <div>
            <strong>{a.label || 'Address'}</strong>
            <p>{a.address}</p>
          </div>
          <button type="button" className="cancel-btn" onClick={() => remove(a._id)}>Remove</button>
        </div>
      ))}
      <div className="d2dash-address-add">
        <select value={label} onChange={(e) => setLabel(e.target.value)}>
          <option>Home</option>
          <option>Office</option>
          <option>Other</option>
        </select>
        <LocationField key={addresses.length} kind="address" place={place} onChange={setPlace} placeholder="Search an address" />
        {err && <p className="d2dash-form-error">{err}</p>}
        <button className="d2dash-update-btn" type="button" disabled={busy} onClick={add}>{busy ? 'Saving…' : 'Save address'}</button>
      </div>
    </section>
  );
}

/* ---------------- Payment history ---------------- */

function PaymentsView({ data }) {
  const all = data.groups ? Object.values(data.groups).flat() : [];
  const rows = all.filter((b) => b.paidAmount > 0 || b.paymentStatus === 'PENDING' || b.paymentStatus === 'PARTIALLY_PAID');
  return (
    <section className="d2dash-card">
      <h3>Payment History</h3>
      {data.loading && <div className="d2dash-empty"><p>Loading…</p></div>}
      {!data.loading && rows.length === 0 && <div className="d2dash-empty"><p>No payments yet.</p></div>}
      {rows.map((b) => (
        <div key={b._id} className="d2dash-address-row">
          <div>
            <strong>{b.bookingId}</strong>
            <p>{b.pickup.address} → {b.drop.address}</p>
            <small>Paid {inr(b.paidAmount)} of {inr(b.fare.finalAmount)} · {b.paymentStatus.replace('_', ' ').toLowerCase()}</small>
          </div>
          {PAYABLE.includes(b.bookingStatus) && b.balanceDue > 0 && (
            <Link className="track-btn" to={`/?pay=${b.bookingId}`}>Pay {inr(b.balanceDue)}</Link>
          )}
        </div>
      ))}
    </section>
  );
}

/* ---------------- Reviews ---------------- */

function ReviewsView({ data }) {
  const all = data.groups ? data.groups.completed : [];
  const rated = all.filter((b) => data.ratings[b._id]);
  return (
    <section className="d2dash-card">
      <h3>Ratings &amp; Reviews</h3>
      {!data.loading && rated.length === 0 && <div className="d2dash-empty"><p>You haven't rated a ride yet. Rate a completed trip from My Bookings.</p></div>}
      {rated.map((b) => (
        <div key={b._id} className="d2dash-address-row">
          <div>
            <strong>{'★'.repeat(data.ratings[b._id].rating)}{'☆'.repeat(5 - data.ratings[b._id].rating)}</strong>
            <p>{b.pickup.address} → {b.drop.address}</p>
            {data.ratings[b._id].comment && <small>{data.ratings[b._id].comment}</small>}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ---------------- Account settings ---------------- */

function AccountSettings({ user, onSave }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  async function handleUpdate(e) {
    e.preventDefault();
    setErr('');
    try {
      const r = await api.put('/auth/profile', { name, email });
      onSave({ ...user, ...r.user });
      setMsg('Saved!');
      setTimeout(() => setMsg(''), 2000);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');
    try {
      await api.post('/auth/change-password', { currentPassword: cur, newPassword: next });
      setCur('');
      setNext('');
      setPwMsg('Password changed.');
    } catch (e2) {
      setPwErr(e2.message);
    }
  }

  return (
    <section className="d2dash-card">
      <h3>Account Settings</h3>
      <p className="d2dash-sub">Personal Info</p>
      <form className="d2dash-settings-card" onSubmit={handleUpdate}>
        <label className="d2dash-field"><span>Name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="d2dash-field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="d2dash-field">
          <span>Phone Number</span>
          <input type="tel" value={user.phone || ''} disabled />
          <small>To change your mobile number, please contact D2Cabs support.</small>
        </label>
        {err && <p className="d2dash-form-error">{err}</p>}
        <div className="d2dash-settings-footer">
          {msg && <span className="d2dash-saved-msg">{msg}</span>}
          <button className="d2dash-update-btn" type="submit">Update</button>
        </div>
      </form>

      <p className="d2dash-sub" style={{ marginTop: 24 }}>Change Password</p>
      <form className="d2dash-settings-card" onSubmit={handlePassword}>
        <label className="d2dash-field"><span>Current password</span><input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required /></label>
        <label className="d2dash-field"><span>New password (min 8 characters)</span><input type="password" minLength={8} maxLength={72} value={next} onChange={(e) => setNext(e.target.value)} required /></label>
        {pwErr && <p className="d2dash-form-error">{pwErr}</p>}
        <div className="d2dash-settings-footer">
          {pwMsg && <span className="d2dash-saved-msg">{pwMsg}</span>}
          <button className="d2dash-update-btn" type="submit">Change password</button>
        </div>
      </form>
    </section>
  );
}

/* ---------------- Header: profile circle opens the FULL menu ---------------- */

function HeaderProfileMenu({ view, setView, firstName, onLogout }) {
  const [open, setOpen] = useState(false);
  const items = [
    { key: 'bookings', label: 'My Bookings', Icon: BookingsIcon },
    { key: 'notifications', label: 'Notifications', Icon: GiftIcon },
    { key: 'addresses', label: 'Saved Addresses', Icon: PinIcon },
    { key: 'payments', label: 'Payment History', Icon: CardIcon },
    { key: 'reviews', label: 'Ratings & Reviews', Icon: StarIcon },
    { key: 'support', label: 'Help & Support', Icon: HelpIcon },
    { key: 'settings', label: 'Account Settings', Icon: SettingsIcon },
  ];

  return (
    <>
      <button className="d2dash-profile-icon-btn" type="button" onClick={() => setOpen(true)} aria-label="Account menu">
        <span className="d2dash-header-avatar">{firstName.charAt(0).toUpperCase()}</span>
      </button>
      {open && (
        <>
          <div className="d2dash-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="d2dash-fullmenu">
            <div className="d2dash-fullmenu-top">
              <button className="d2dash-fullmenu-close" type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>
            <div className="d2dash-fullmenu-list">
              {items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  className={view === it.key ? 'active' : ''}
                  onClick={() => {
                    setView(it.key);
                    setOpen(false);
                  }}
                >
                  <span className="d2dash-nav-icon"><it.Icon /></span> {it.label}
                </button>
              ))}
              <button
                type="button"
                className="d2dash-row-danger"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
              >
                <span className="d2dash-nav-icon"><LogoutIcon /></span> Log Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ---------------- Root ---------------- */

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [view, setView] = useState('bookings');
  const bookings = useMyBookings();

  // The real login is the httpOnly cookie: ask the server who we are.
  useEffect(() => {
    api
      .get('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  async function handleLogout() {
    await api.post('/auth/logout').catch(() => {});
    navigate('/');
  }

  if (!checked) return null;

  if (!user) {
    return (
      <div className="d2dash">
        <header className="d2dash-header">
          <Link className="d2dash-brand" to="/"><span>D2Cabs</span></Link>
        </header>
        <main className="d2dash-main">
          <div className="d2dash-card d2dash-empty">
            <div className="d2dash-empty-icon"><LockIcon /></div>
            <p>You need to log in to see your dashboard.</p>
            <Link className="d2dash-link-btn" to="/">Go to login</Link>
          </div>
        </main>
      </div>
    );
  }

  const firstName = user.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="d2dash">
      <header className="d2dash-header">
        <Link className="d2dash-brand" to="/"><span>D2Cabs</span></Link>
        <HeaderProfileMenu view={view} setView={setView} firstName={firstName} onLogout={handleLogout} />
      </header>

      <main className="d2dash-main d2dash-single-col">
        <div className="d2dash-col-main">
          {view === 'bookings' && <BookingsView firstName={firstName} data={bookings} />}
          {view === 'notifications' && <NotificationsView />}
          {view === 'addresses' && <AddressesView user={user} setUser={setUser} />}
          {view === 'payments' && <PaymentsView data={bookings} />}
          {view === 'reviews' && <ReviewsView data={bookings} />}
          {view === 'settings' && <AccountSettings user={user} onSave={setUser} />}
          {view === 'support' && (
            <section className="d2dash-card">
              <h3>Help &amp; Support</h3>
              <a className="d2dash-row-btn" href="https://wa.me/918889633535" target="_blank" rel="noreferrer">
                Chat on WhatsApp <span className="arrow">›</span>
              </a>
              <Link className="d2dash-row-btn" to="/faq">FAQs <span className="arrow">›</span></Link>
              <Link className="d2dash-row-btn" to="/contact">Contact Us <span className="arrow">›</span></Link>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
