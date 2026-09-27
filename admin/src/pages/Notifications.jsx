import { Link } from 'react-router-dom';
import { api } from '../api';
import { ErrorText, Loading, fmtDateTime, useFetch } from '../components/ui';

export default function Notifications() {
  const { data, error, loading, reload } = useFetch(() => api.get('/admin/notifications'));

  async function readAll() {
    await api.post('/admin/notifications/read-all').catch(() => {});
    reload();
  }
  async function read(n) {
    if (!n.isRead) await api.post(`/admin/notifications/${n._id}/read`).catch(() => {});
    reload();
  }

  return (
    <>
      <div className="row-between"><h1>Notifications</h1><button className="btn" onClick={readAll}>Mark all as read</button></div>
      <ErrorText>{error}</ErrorText>
      {loading && !data ? <Loading /> : data && (
        <div className="card">
          {data.notifications.length === 0 && <p className="muted-text">Nothing yet.</p>}
          {data.notifications.map((n) => (
            <div key={n._id} className={`notif${n.isRead ? '' : ' unread'}`} onClick={() => read(n)}>
              <div className="row-between"><b>{n.title}</b><small>{fmtDateTime(n.createdAt)}</small></div>
              <p>{n.message}</p>
              {n.bookingId && <Link to={`/bookings/${n.bookingId}`}>Open booking</Link>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
