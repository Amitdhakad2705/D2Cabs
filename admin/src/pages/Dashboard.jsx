import { Link } from 'react-router-dom';
import { api } from '../api';
import { ErrorText, Loading, inr, fmtDate, useFetch } from '../components/ui';

const CARDS = [
  ['totalBookings', 'Total Bookings'],
  ['pendingRequests', 'Pending Requests'],
  ['confirmedBookings', 'Confirmed Bookings'],
  ['todaysTrips', "Today's Trips"],
  ['completedTrips', 'Completed Trips'],
  ['cancelledTrips', 'Cancelled / Rejected'],
  ['totalCustomers', 'Total Customers'],
  ['totalRevenue', 'Total Revenue', true],
  ['pendingPayments', 'Pending Payments'],
];

export default function Dashboard() {
  const { data, error, loading } = useFetch(() => api.get('/admin/dashboard'));
  if (loading) return <Loading />;
  if (error) return <ErrorText>{error}</ErrorText>;

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        {CARDS.map(([key, text, money]) => (
          <div className="card stat" key={key}>
            <span>{text}</span>
            <b>{money ? inr(data.stats[key]) : data.stats[key]}</b>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row-between">
          <h3>New booking requests</h3>
          <Link to="/bookings?status=PENDING">View all</Link>
        </div>
        {data.recentPending.length === 0 ? (
          <p className="muted-text">No requests waiting.</p>
        ) : (
          <table>
            <thead><tr><th>Booking</th><th>Customer</th><th>Route</th><th>Trip date</th><th>Fare</th></tr></thead>
            <tbody>
              {data.recentPending.map((b) => (
                <tr key={b._id}>
                  <td><Link to={`/bookings/${b._id}`}>{b.bookingId}</Link></td>
                  <td>{b.customerDetails.name}</td>
                  <td>{b.pickup.address} → {b.drop.address}</td>
                  <td>{fmtDate(b.journeyDate)} {b.journeyTime}</td>
                  <td>{inr(b.fare.finalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
