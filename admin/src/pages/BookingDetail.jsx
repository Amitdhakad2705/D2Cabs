import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Badge, ErrorText, Field, Loading, Modal, fmtDate, fmtDateTime, inr, label, useFetch } from '../components/ui';

/* ---- small modals ---- */

function ReasonModal({ title, action, onSubmit, onClose }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    if (!text.trim()) return setErr('Please write a reason.');
    setBusy(true);
    try { await onSubmit(text.trim()); } catch (e) { setErr(e.message); setBusy(false); }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <Field label="Reason (the customer will see this)"><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <ErrorText>{err}</ErrorText>
      <button className="btn danger" type="button" disabled={busy} onClick={go}>{busy ? 'Please wait…' : action}</button>
    </Modal>
  );
}

function DriverModal({ booking, onDone, onClose }) {
  const { data } = useFetch(() => api.get('/admin/drivers?active=true&limit=100'));
  const [manual, setManual] = useState(false);
  const [f, setF] = useState({ driverId: '', driverName: '', driverPhone: '', vehicleName: '', vehicleNumber: '', vehicleType: booking.cabId?.category || '', specialInstructions: '', force: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  function pickDriver(e) {
    const d = (data?.drivers || []).find((x) => x._id === e.target.value);
    setF({ ...f, driverId: e.target.value, vehicleName: d?.vehicleName || '', vehicleNumber: d?.vehicleNumber || '' });
  }

  async function go() {
    setBusy(true);
    setErr('');
    try {
      const body = manual
        ? { driverName: f.driverName, driverPhone: f.driverPhone }
        : { driverId: f.driverId };
      await api.post(`/admin/bookings/${booking._id}/assign-driver`, {
        ...body, vehicleName: f.vehicleName, vehicleNumber: f.vehicleNumber, vehicleType: f.vehicleType,
        specialInstructions: f.specialInstructions, force: f.force,
      });
      onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <Modal title="Assign driver" onClose={onClose}>
      <label className="check"><input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} /> Enter driver details manually (not a saved driver)</label>
      {manual ? (
        <>
          <Field label="Driver name"><input value={f.driverName} onChange={set('driverName')} /></Field>
          <Field label="Driver mobile number"><input value={f.driverPhone} onChange={set('driverPhone')} maxLength={10} /></Field>
        </>
      ) : (
        <Field label="Saved driver">
          <select value={f.driverId} onChange={pickDriver}>
            <option value="">Choose a driver…</option>
            {(data?.drivers || []).map((d) => <option key={d._id} value={d._id}>{d.name} · {d.phone}</option>)}
          </select>
        </Field>
      )}
      <div className="grid2">
        <Field label="Car name"><input value={f.vehicleName} onChange={set('vehicleName')} /></Field>
        <Field label="Car number"><input value={f.vehicleNumber} onChange={set('vehicleNumber')} /></Field>
      </div>
      <Field label="Car type"><input value={f.vehicleType} onChange={set('vehicleType')} /></Field>
      <Field label="Special instructions"><textarea rows={2} value={f.specialInstructions} onChange={set('specialInstructions')} /></Field>
      <label className="check"><input type="checkbox" checked={f.force} onChange={set('force')} /> Assign even if the driver has an overlapping trip</label>
      <ErrorText>{err}</ErrorText>
      <button className="btn primary" type="button" disabled={busy || (!manual && !f.driverId)} onClick={go}>{busy ? 'Assigning…' : 'Assign driver'}</button>
    </Modal>
  );
}

function CashModal({ booking, onDone, onClose }) {
  const due = booking.fare.finalAmount - booking.paidAmount;
  const [amount, setAmount] = useState(String(due));
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  async function go() {
    try { await api.post(`/admin/bookings/${booking._id}/record-cash`, { amount: Number(amount), note }); onDone(); } catch (e) { setErr(e.message); }
  }
  return (
    <Modal title="Record cash / bank payment" onClose={onClose}>
      <p className="muted-text">Balance due: {inr(due)}</p>
      <Field label="Amount received (₹)"><input type="number" min="1" max={due} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. paid to driver in cash" /></Field>
      <ErrorText>{err}</ErrorText>
      <button className="btn primary" type="button" onClick={go}>Save payment</button>
    </Modal>
  );
}

function RefundModal({ payment, onDone, onClose }) {
  const max = payment.amount - (payment.refund?.amount || 0);
  const [amount, setAmount] = useState(String(max));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    setBusy(true);
    try { await api.post(`/admin/payments/${payment._id}/refund`, { amount: Number(amount), reason }); onDone(); } catch (e) { setErr(e.message); setBusy(false); }
  }
  return (
    <Modal title="Refund payment" onClose={onClose}>
      <p className="muted-text">Refund goes back to the customer's original payment method through Razorpay. Maximum: {inr(max)}</p>
      <Field label="Refund amount (₹)"><input type="number" min="1" max={max} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="Reason"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <ErrorText>{err}</ErrorText>
      <button className="btn danger" type="button" disabled={busy} onClick={go}>{busy ? 'Refunding…' : 'Refund'}</button>
    </Modal>
  );
}

/* ---- page ---- */

export default function BookingDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useFetch(() => api.get(`/admin/bookings/${id}`), [id]);
  const [modal, setModal] = useState(null); // 'reject' | 'cancel' | 'driver' | 'cash' | {refund: payment}
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => { if (data) setNote(data.booking.adminNote || ''); }, [data]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorText>{error}</ErrorText>;
  const { booking: b, payments, feedback } = data;
  const st = b.bookingStatus;
  const due = b.fare.finalAmount - b.paidAmount;

  async function run(fn) {
    setBusy(true);
    setMsg('');
    try { await fn(); setModal(null); reload(); } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }
  const post = (path, body = {}) => run(() => api.post(`/admin/bookings/${b._id}/${path}`, body));
  const setStatus = (status, noteText = '') => post('status', { status, note: noteText });

  return (
    <>
      <p><Link to="/bookings">‹ Bookings</Link></p>
      <div className="row-between">
        <h1>{b.bookingId} <Badge status={st} /> <Badge status={b.paymentStatus} /></h1>
      </div>
      <ErrorText>{msg}</ErrorText>

      <div className="card">
        <h3>Actions</h3>
        <div className="actions">
          {st === 'PENDING' && (
            <>
              <button className="btn primary" disabled={busy} onClick={() => post('approve', {})}>Accept &amp; ask for payment</button>
              <button className="btn danger" disabled={busy} onClick={() => setModal('reject')}>Reject</button>
            </>
          )}
          {(st === 'CONFIRMED' || st === 'DRIVER_ASSIGNED') && (
            <button className="btn primary" disabled={busy} onClick={() => setModal('driver')}>{st === 'CONFIRMED' ? 'Assign driver' : 'Change driver'}</button>
          )}
          {st === 'DRIVER_ASSIGNED' && <button className="btn" disabled={busy} onClick={() => setStatus('DRIVER_ON_THE_WAY')}>Driver on the way</button>}
          {(st === 'DRIVER_ASSIGNED' || st === 'DRIVER_ON_THE_WAY') && <button className="btn" disabled={busy} onClick={() => setStatus('TRIP_STARTED')}>Start trip</button>}
          {st === 'TRIP_STARTED' && <button className="btn primary" disabled={busy} onClick={() => setStatus('COMPLETED')}>Complete trip</button>}
          {['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_ON_THE_WAY'].includes(st) && <button className="btn danger" disabled={busy} onClick={() => setModal('cancel')}>Cancel booking</button>}
          {!['PENDING', 'REJECTED', 'CANCELLED'].includes(st) && due > 0 && <button className="btn" disabled={busy} onClick={() => setModal('cash')}>Record cash payment</button>}
          {['COMPLETED', 'REJECTED', 'CANCELLED'].includes(st) && due <= 0 && <span className="muted-text">No further actions.</span>}
        </div>
        {st === 'CANCELLED' && b.paidAmount > 0 && <p className="error">Customer paid {inr(b.paidAmount)} — refund it from the Payments table below.</p>}
      </div>

      <div className="grid2">
        <div className="card">
          <h3>Customer</h3>
          <p><b>{b.customerId?.name || b.customerDetails.name}</b></p>
          <p>{b.customerDetails.phone} · {b.customerDetails.email}</p>
          {b.customerId && <p><Link to="/customers">Customer account</Link>{b.customerId.isActive === false && ' (blocked)'}</p>}
          {b.customerNote && <p>Note: {b.customerNote}</p>}
        </div>
        <div className="card">
          <h3>Trip</h3>
          <p>{label(b.serviceType)} · {b.tripType === 'round_trip' ? 'Round trip' : 'One way'} · {b.fare.distanceKm} km</p>
          <p><b>Pickup:</b> {b.pickup.address}</p>
          <p><b>Drop:</b> {b.drop.address}</p>
          <p><b>Date:</b> {fmtDate(b.journeyDate)} at {b.journeyTime}{b.returnDate && <> · <b>Return:</b> {fmtDate(b.returnDate)} {b.returnTime}</>}</p>
          <p><b>Cab:</b> {b.cabId?.name} ({b.cabId?.category}){b.addons.length > 0 && <> · Add-ons: {b.addons.join(', ')}</>}</p>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h3>Fare</h3>
          <table className="plain"><tbody>
            <tr><td>Trip fare</td><td>{inr(b.fare.baseFare)}</td></tr>
            {b.fare.driverAllowance > 0 && <tr><td>Driver allowance</td><td>{inr(b.fare.driverAllowance)}</td></tr>}
            {b.fare.addonAmount > 0 && <tr><td>Add-ons</td><td>{inr(b.fare.addonAmount)}</td></tr>}
            {b.fare.gst > 0 && <tr><td>GST</td><td>{inr(b.fare.gst)}</td></tr>}
            <tr><td><b>Total</b></td><td><b>{inr(b.fare.finalAmount)}</b></td></tr>
            <tr><td>Paid</td><td>{inr(b.paidAmount)}</td></tr>
            <tr><td>Balance</td><td>{inr(due)}</td></tr>
            <tr><td>Customer advance choice</td><td>{b.payPercent}%</td></tr>
          </tbody></table>
        </div>
        <div className="card">
          <h3>Driver</h3>
          {b.driverSnapshot?.name ? (
            <>
              <p><b>{b.driverSnapshot.name}</b> · {b.driverSnapshot.phone}</p>
              <p>{b.driverSnapshot.vehicleName} · {b.driverSnapshot.vehicleNumber} {b.driverSnapshot.vehicleType && `(${b.driverSnapshot.vehicleType})`}</p>
              {b.driverSnapshot.specialInstructions && <p>Instructions: {b.driverSnapshot.specialInstructions}</p>}
            </>
          ) : <p className="muted-text">No driver assigned yet.</p>}
        </div>
      </div>

      <div className="card scroll">
        <h3>Payments</h3>
        {payments.length === 0 ? <p className="muted-text">No payments yet.</p> : (
          <table>
            <thead><tr><th>When</th><th>Amount</th><th>Method</th><th>Status</th><th>Razorpay ID</th><th /></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{fmtDateTime(p.paidAt || p.createdAt)}</td>
                  <td>{inr(p.amount)}{p.refund?.amount > 0 && <><br /><small>refunded {inr(p.refund.amount)}</small></>}</td>
                  <td>{p.method || '—'}{p.note && <><br /><small>{p.note}</small></>}</td>
                  <td><Badge status={p.status} /></td>
                  <td><small>{p.razorpayPaymentId || '—'}</small></td>
                  <td>{p.status === 'PAID' && p.razorpayPaymentId && <button className="btn" onClick={() => setModal({ refund: p })}>Refund</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid2">
        <div className="card">
          <h3>Status history</h3>
          <ul className="timeline">
            {b.statusHistory.map((h, i) => (
              <li key={i}><b>{label(h.status)}</b> <small>{fmtDateTime(h.at)}</small>{h.note && <div>{h.note}</div>}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Admin note (private)</h3>
          <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn" type="button" disabled={busy} onClick={() => run(() => api.patch(`/admin/bookings/${b._id}/note`, { adminNote: note }))}>Save note</button>
          {feedback && <p style={{ marginTop: 16 }}><b>Customer rating:</b> {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)} {feedback.comment}</p>}
        </div>
      </div>

      {modal === 'reject' && <ReasonModal title="Reject booking" action="Reject booking" onClose={() => setModal(null)} onSubmit={(reason) => api.post(`/admin/bookings/${b._id}/reject`, { reason }).then(() => { setModal(null); reload(); })} />}
      {modal === 'cancel' && <ReasonModal title="Cancel booking" action="Cancel booking" onClose={() => setModal(null)} onSubmit={(note2) => api.post(`/admin/bookings/${b._id}/status`, { status: 'CANCELLED', note: note2 }).then(() => { setModal(null); reload(); })} />}
      {modal === 'driver' && <DriverModal booking={b} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {modal === 'cash' && <CashModal booking={b} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
      {modal && modal.refund && <RefundModal payment={modal.refund} onClose={() => setModal(null)} onDone={() => { setModal(null); reload(); }} />}
    </>
  );
}
