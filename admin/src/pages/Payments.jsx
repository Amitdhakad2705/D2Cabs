import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../api';
import { Badge, ErrorText, Field, Loading, Modal, Pager, fmtDateTime, inr, useFetch } from '../components/ui';

function RefundModal({ payment, onClose, onDone }) {
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
      <p className="muted-text">Maximum refund: {inr(max)}. It is returned through Razorpay.</p>
      <Field label="Amount (₹)"><input type="number" min="1" max={max} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="Reason"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <ErrorText>{err}</ErrorText>
      <button className="btn danger" disabled={busy} onClick={go}>{busy ? 'Refunding…' : 'Refund'}</button>
    </Modal>
  );
}

const FILTERS = ['', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'];

export default function Payments() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refund, setRefund] = useState(null);
  const { data, error, loading, reload } = useFetch(() => api.get(`/admin/payments${qs({ status, page })}`), [status, page]);

  return (
    <>
      <h1>Payments</h1>
      <div className="tabs">
        {FILTERS.map((s) => <button key={s} className={`tab${status === s ? ' active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>{s ? s[0] + s.slice(1).toLowerCase() : 'All'}</button>)}
      </div>
      <p className="muted-text">"Pending" rows are payment attempts that were started but not completed.</p>
      <ErrorText>{error}</ErrorText>
      {loading && !data ? <Loading /> : data && (
        <div className="card scroll">
          <table>
            <thead><tr><th>When</th><th>Booking</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.payments.length === 0 && <tr><td colSpan={7} className="muted-text">No payments.</td></tr>}
              {data.payments.map((p) => (
                <tr key={p._id}>
                  <td>{fmtDateTime(p.paidAt || p.createdAt)}</td>
                  <td>{p.bookingId ? <Link to={`/bookings/${p.bookingId._id}`}>{p.bookingId.bookingId}</Link> : '—'}</td>
                  <td>{p.bookingId?.customerDetails?.name}<br /><small>{p.bookingId?.customerDetails?.phone}</small></td>
                  <td>{inr(p.amount)}{p.refund?.amount > 0 && <><br /><small>refunded {inr(p.refund.amount)}</small></>}</td>
                  <td>{p.method || '—'}</td>
                  <td><Badge status={p.status} /></td>
                  <td>{p.status === 'PAID' && p.razorpayPaymentId && <button className="btn" onClick={() => setRefund(p)}>Refund</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} pages={data.pages} onPage={setPage} />
        </div>
      )}
      {refund && <RefundModal payment={refund} onClose={() => setRefund(null)} onDone={() => { setRefund(null); reload(); }} />}
    </>
  );
}
