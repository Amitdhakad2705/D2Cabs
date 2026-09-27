import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

const LINKS = [
  ['/', 'Dashboard'],
  ['/bookings', 'Bookings'],
  ['/customers', 'Customers'],
  ['/cabs', 'Cabs'],
  ['/drivers', 'Drivers'],
  ['/payments', 'Payments'],
  ['/feedback', 'Feedback'],
  ['/notifications', 'Notifications'],
  ['/reports', 'Reports'],
  ['/settings', 'Settings'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    let stop = false;
    const tick = () => api.get('/admin/notifications').then((r) => !stop && setUnread(r.unread)).catch(() => {});
    tick();
    const id = setInterval(tick, 30000); // simple polling; new booking requests show up here
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="shell">
      <aside className={`side${menu ? ' open' : ''}`}>
        <div className="brand">D2Cabs <small>Admin</small></div>
        <nav onClick={() => setMenu(false)}>
          {LINKS.map(([to, text]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {text}
              {to === '/notifications' && unread > 0 && <span className="dot">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div>{user.name}</div>
          <button className="btn" type="button" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="content">
        <button className="btn menu-btn" type="button" onClick={() => setMenu((v) => !v)}>☰ Menu</button>
        <Outlet />
      </main>
    </div>
  );
}
