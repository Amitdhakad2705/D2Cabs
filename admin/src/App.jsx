import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import BookingDetail from './pages/BookingDetail';
import Bookings from './pages/Bookings';
import Cabs from './pages/Cabs';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Feedback from './pages/Feedback';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted-text" style={{ padding: 24 }}>Loading…</p>;
  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="customers" element={<Customers />} />
        <Route path="cabs" element={<Cabs />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="payments" element={<Payments />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
