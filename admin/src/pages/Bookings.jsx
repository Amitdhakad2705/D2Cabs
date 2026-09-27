import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, qs } from '../api';
import { Badge, ErrorText, Loading, Pager, fmtDate, inr, useFetch } from '../components/ui';

const TABS = [
  ['', 'All'],
  ['PENDING', 'Pending (new requests)'],
  ['CONFIRMED', 'Confirmed'],
  ['DRIVER_ASSIGNED', 'Driver assigned'],
  ['DRIVER_ON_THE_WAY,TRIP_STARTED', 'Ongoing'],
  ['COMPLETED', 'Completed'],
  ['CANCELLED', 'Cancelled'],
  ['REJECTED', 'Rejected'],
];

export default function Bookings() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading } = useFetch(
    () => api.get(`/admin/bookings${qs({ status, q: search, page })}`),
    [status, search, page]
  );

  const count = (key) => (key ? key.split(',').reduce((n, k) => n + ((data && data.counts[k]) || 0), 0) : data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0);

  return (
    <>
      <h1>Bookings</h1>
      <div className="tabs">
        {TABS.map(([key, text]) => (
          <button key={text} type="button" className={`tab${status === key ? ' active' : ''}`} onClick={() => { setParams(key ? { status: key } : {}); setPage(1); }}>
            {text}{data ? ` (${count(key)})` : ''}
          </button>
        ))}
      </div>

      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }}>
        <input placeholder="Search booking ID, customer name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" type="submit">Search</button>
      </form>

      <ErrorText>{error}</ErrorText>
      {loading && !data ? <Loading /> : data && (
        <div className="card scroll">
          <table>
            <thead><tr><th>Booking</th><th>Customer</th><th>Route</th><th>Trip date</th><th>Cab</th><th>Fare</th><th>Status</th><th>Payment</th></tr></thead>
            <tbody>
              {data.bookings.length === 0 && <tr><td colSpan={8} className="muted-text">No bookings found.</td></tr>}
              {data.bookings.map((b) => (
                <tr key={b._id}>
                  <td><Link to={`/bookings/${b._id}`}>{b.bookingId}</Link></td>
                  <td>{b.customerDetails.name}<br /><small>{b.customerDetails.phone}</small></td>
                  <td>{b.pickup.address}<br />→ {b.drop.address}</td>
                  <td>{fmtDate(b.journeyDate)}<br /><small>{b.journeyTime}</small></td>
                  <td>{b.cabId ? b.cabId.name : '—'}</td>
                  <td>{inr(b.fare.finalAmount)}<br /><small>paid {inr(b.paidAmount)}</small></td>
                  <td><Badge status={b.bookingStatus} /></td>
                  <td><Badge status={b.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} pages={data.pages} onPage={setPage} />
        </div>
      )}
    </>
  );
}
