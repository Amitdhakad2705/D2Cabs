import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../api';
import { Badge, ErrorText, Loading, Modal, Pager, fmtDate, fmtDateTime, inr, useFetch } from '../components/ui';

function CustomerModal({ id, onClose, onChanged }) {
  const { data, error, reload } = useFetch(() => api.get(`/admin/customers/${id}`), [id]);
  const [err, setErr] = useState('');
  async function toggle() {
    try { await api.patch(`/admin/customers/${id}/active`, { active: !data.customer.isActive }); reload(); onChanged(); } catch (e) { setErr(e.message); }
  }
  return (
    <Modal title="Customer" onClose={onClose} wide>
      <ErrorText>{error || err}</ErrorText>
      {data && (
        <>
          <p><b>{data.customer.name}</b> · {data.customer.phone} · {data.customer.email}</p>
          <p>Joined {fmtDateTime(data.customer.createdAt)} · {data.customer.isActive ? 'Active' : 'BLOCKED'}</p>
          <button className={`btn ${data.customer.isActive ? 'danger' : 'primary'}`} onClick={toggle}>
            {data.customer.isActive ? 'Block customer' : 'Unblock customer'}
          </button>
          <h4>Booking history</h4>
          <div className="scroll">
            <table>
              <thead><tr><th>Booking</th><th>Route</th><th>Date</th><th>Fare</th><th>Status</th></tr></thead>
              <tbody>
                {data.bookings.length === 0 && <tr><td colSpan={5} className="muted-text">No bookings.</td></tr>}
                {data.bookings.map((b) => (
                  <tr key={b._id}>
                    <td><Link to={`/bookings/${b._id}`} onClick={onClose}>{b.bookingId}</Link></td>
                    <td>{b.pickup.address} → {b.drop.address}</td>
                    <td>{fmtDate(b.journeyDate)}</td>
                    <td>{inr(b.fare.finalAmount)}</td>
                    <td><Badge status={b.bookingStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}

export default function Customers() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload } = useFetch(() => api.get(`/admin/customers${qs({ q: search, page })}`), [search, page]);

  return (
    <>
      <h1>Customers</h1>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }}>
        <input placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" type="submit">Search</button>
      </form>
      <ErrorText>{error}</ErrorText>
      {loading && !data ? <Loading /> : data && (
        <div className="card scroll">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Bookings</th><th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.customers.length === 0 && <tr><td colSpan={7} className="muted-text">No customers found.</td></tr>}
              {data.customers.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.bookingCount}</td>
                  <td>{fmtDateTime(c.createdAt)}</td>
                  <td>{c.isActive ? <span className="badge ok">Active</span> : <span className="badge bad">Blocked</span>}</td>
                  <td><button className="btn" onClick={() => setOpen(c._id)}>Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} pages={data.pages} onPage={setPage} />
        </div>
      )}
      {open && <CustomerModal id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </>
  );
}
