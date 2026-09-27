import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../api';
import { Badge, ErrorText, Field, Loading, Modal, Pager, fmtDate, inr, useFetch } from '../components/ui';

function DriverForm({ driver, cabs, onClose, onSaved }) {
  const [f, setF] = useState({
    name: driver?.name || '', phone: driver?.phone || '', licenseNumber: driver?.licenseNumber || '',
    cabId: driver?.cabId?._id || '', vehicleName: driver?.vehicleName || '', vehicleNumber: driver?.vehicleNumber || '',
    status: driver?.status || 'AVAILABLE', active: driver ? driver.active : true,
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    const body = { ...f, cabId: f.cabId || null };
    try {
      if (driver) await api.put(`/admin/drivers/${driver._id}`, body);
      else await api.post('/admin/drivers', body);
      onSaved();
    } catch (e2) { setErr(e2.message); }
  }
  return (
    <Modal title={driver ? 'Edit driver' : 'Add driver'} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Name"><input value={f.name} onChange={set('name')} required /></Field>
        <Field label="Mobile number"><input value={f.phone} onChange={set('phone')} maxLength={10} required /></Field>
        <Field label="Licence number"><input value={f.licenseNumber} onChange={set('licenseNumber')} /></Field>
        <Field label="Usual cab type">
          <select value={f.cabId} onChange={set('cabId')}><option value="">—</option>{cabs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
        </Field>
        <div className="grid2">
          <Field label="Car name"><input value={f.vehicleName} onChange={set('vehicleName')} /></Field>
          <Field label="Car number"><input value={f.vehicleNumber} onChange={set('vehicleNumber')} placeholder="MP09 AB 1234" /></Field>
        </div>
        <Field label="Status">
          <select value={f.status} onChange={set('status')}><option value="AVAILABLE">Available</option><option value="ON_TRIP">On trip</option><option value="OFF_DUTY">Off duty</option></select>
        </Field>
        <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active (can be assigned)</label>
        <ErrorText>{err}</ErrorText>
        <button className="btn primary" type="submit">Save driver</button>
      </form>
    </Modal>
  );
}

function TripsModal({ driver, onClose }) {
  const { data, error } = useFetch(() => api.get(`/admin/drivers/${driver._id}/trips`), [driver._id]);
  return (
    <Modal title={`Trips: ${driver.name}`} onClose={onClose} wide>
      <ErrorText>{error}</ErrorText>
      {data && (
        <div className="scroll">
          <table>
            <thead><tr><th>Booking</th><th>Route</th><th>Date</th><th>Fare</th><th>Status</th></tr></thead>
            <tbody>
              {data.trips.length === 0 && <tr><td colSpan={5} className="muted-text">No trips yet.</td></tr>}
              {data.trips.map((t) => (
                <tr key={t._id}>
                  <td><Link to={`/bookings/${t._id}`} onClick={onClose}>{t.bookingId}</Link></td>
                  <td>{t.pickup.address} → {t.drop.address}</td>
                  <td>{fmtDate(t.journeyDate)} {t.journeyTime}</td>
                  <td>{inr(t.fare.finalAmount)}</td>
                  <td><Badge status={t.bookingStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

export default function Drivers() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [trips, setTrips] = useState(null);
  const [msg, setMsg] = useState('');
  const { data, error, loading, reload } = useFetch(() => api.get(`/admin/drivers${qs({ q: search, page })}`), [search, page]);
  const cabs = useFetch(() => api.get('/admin/cabs'));

  async function toggle(d) {
    try { await api.put(`/admin/drivers/${d._id}`, { active: !d.active }); reload(); } catch (e) { setMsg(e.message); }
  }
  async function remove(d) {
    if (!window.confirm(`Delete ${d.name}?`)) return;
    try { await api.del(`/admin/drivers/${d._id}`); reload(); } catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <div className="row-between"><h1>Drivers</h1><button className="btn primary" onClick={() => setForm('new')}>+ Add driver</button></div>
      <p className="muted-text">Drivers do not log in anywhere. You add them here and assign them to bookings.</p>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }}>
        <input placeholder="Search name, phone or car number" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" type="submit">Search</button>
      </form>
      <ErrorText>{error || msg}</ErrorText>
      {loading && !data ? <Loading /> : data && (
        <div className="card scroll">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Car</th><th>Licence</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.drivers.length === 0 && <tr><td colSpan={6} className="muted-text">No drivers yet.</td></tr>}
              {data.drivers.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td><td>{d.phone}</td>
                  <td>{d.vehicleName} {d.vehicleNumber}</td><td>{d.licenseNumber || '—'}</td>
                  <td>{d.active ? <Badge status={d.status} /> : <span className="badge muted">Disabled</span>}</td>
                  <td className="nowrap">
                    <button className="btn" onClick={() => setTrips(d)}>Trips</button>{' '}
                    <button className="btn" onClick={() => setForm(d)}>Edit</button>{' '}
                    <button className="btn" onClick={() => toggle(d)}>{d.active ? 'Disable' : 'Enable'}</button>{' '}
                    <button className="btn danger" onClick={() => remove(d)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} pages={data.pages} onPage={setPage} />
        </div>
      )}
      {form && <DriverForm driver={form === 'new' ? null : form} cabs={cabs.data?.cabs || []} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload(); }} />}
      {trips && <TripsModal driver={trips} onClose={() => setTrips(null)} />}
    </>
  );
}
