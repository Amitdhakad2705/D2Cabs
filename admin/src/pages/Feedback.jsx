import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ErrorText, Loading, Pager, fmtDateTime, useFetch } from '../components/ui';

export default function Feedback() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useFetch(() => api.get(`/admin/feedback?page=${page}`), [page]);
  const [msg, setMsg] = useState('');

  async function toggle(f) {
    try { await api.patch(`/admin/feedback/${f._id}/visibility`, { isVisible: !f.isVisible }); reload(); } catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <h1>Feedback &amp; ratings</h1>
      <ErrorText>{error || msg}</ErrorText>
      {loading && !data ? <Loading /> : data && (
        <div className="card scroll">
          <table>
            <thead><tr><th>When</th><th>Customer</th><th>Booking</th><th>Rating</th><th>Comment</th><th /></tr></thead>
            <tbody>
              {data.feedback.length === 0 && <tr><td colSpan={6} className="muted-text">No feedback yet.</td></tr>}
              {data.feedback.map((f) => (
                <tr key={f._id}>
                  <td>{fmtDateTime(f.createdAt)}</td>
                  <td>{f.customerId?.name}</td>
                  <td>{f.bookingId ? <Link to={`/bookings/${f.bookingId._id}`}>{f.bookingId.bookingId}</Link> : '—'}</td>
                  <td>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</td>
                  <td>{f.comment || '—'}</td>
                  <td><button className="btn" onClick={() => toggle(f)}>{f.isVisible ? 'Hide' : 'Show'}</button></td>
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
