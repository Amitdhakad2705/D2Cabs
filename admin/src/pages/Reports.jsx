import { useState } from 'react';
import { api } from '../api';
import { ErrorText, Loading, inr, useFetch } from '../components/ui';

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const { data, error, loading } = useFetch(() => api.get(`/admin/reports?period=${period}`), [period]);
  const maxRevenue = data ? Math.max(1, ...data.rows.map((r) => r.revenue)) : 1;
  const totals = data ? data.rows.reduce((t, r) => ({ bookings: t.bookings + r.bookings, revenue: t.revenue + r.revenue }), { bookings: 0, revenue: 0 }) : null;

  return (
    <>
      <h1>Reports</h1>
      <div className="tabs">
        {[['daily', 'Daily (30 days)'], ['weekly', 'Weekly (12 weeks)'], ['monthly', 'Monthly (12 months)']].map(([k, t]) => (
          <button key={k} className={`tab${period === k ? ' active' : ''}`} onClick={() => setPeriod(k)}>{t}</button>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>
      {loading && !data ? <Loading /> : data && (
        <div className="card scroll">
          <p><b>{totals.bookings}</b> bookings · revenue <b>{inr(totals.revenue)}</b> (money actually received, after refunds)</p>
          <table>
            <thead><tr><th>Period</th><th>Bookings</th><th>Completed</th><th>Cancelled / rejected</th><th>Revenue</th><th /></tr></thead>
            <tbody>
              {data.rows.length === 0 && <tr><td colSpan={6} className="muted-text">No data for this period.</td></tr>}
              {data.rows.map((r) => (
                <tr key={r.period}>
                  <td>{r.period}</td><td>{r.bookings}</td><td>{r.completed}</td><td>{r.cancelled}</td><td>{inr(r.revenue)}</td>
                  <td style={{ width: 160 }}><div className="bar"><i style={{ width: `${(r.revenue / maxRevenue) * 100}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
