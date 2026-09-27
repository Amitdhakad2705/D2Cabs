import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { ErrorText, Field, Loading, useFetch } from '../components/ui';

export default function Settings() {
  const { user } = useAuth();
  const { data, error, loading } = useFetch(() => api.get('/admin/settings'));
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  useEffect(() => { if (data) setF({ ...data.settings.companyProfile, minAdvanceHours: data.settings.minAdvanceHours }); }, [data]);

  async function save(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      const { minAdvanceHours, ...companyProfile } = f;
      await api.put('/admin/settings', { companyProfile, minAdvanceHours: Number(minAdvanceHours) });
      setMsg('Saved.');
    } catch (e2) { setErr(e2.message); }
  }
  async function changePassword(e) {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    try {
      await api.post('/admin/auth/change-password', { currentPassword: cur, newPassword: next });
      setCur(''); setNext(''); setPwMsg('Password changed. Other devices were logged out.');
    } catch (e2) { setPwErr(e2.message); }
  }

  if (loading && !data) return <Loading />;
  return (
    <>
      <h1>Settings</h1>
      <ErrorText>{error}</ErrorText>
      {f && (
        <form className="card" onSubmit={save}>
          <h3>Company profile &amp; booking</h3>
          <div className="grid2">
            <Field label="Company name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Phone"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Email"><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Address"><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
            <Field label="Minimum advance booking (hours)" hint="Customers cannot book a pickup sooner than this."><input type="number" min="0" max="168" value={f.minAdvanceHours} onChange={(e) => setF({ ...f, minAdvanceHours: e.target.value })} /></Field>
          </div>
          <ErrorText>{err}</ErrorText>
          {msg && <p className="ok-text">{msg}</p>}
          <button className="btn primary" type="submit">Save settings</button>
        </form>
      )}

      <form className="card" onSubmit={changePassword}>
        <h3>Admin profile</h3>
        <p>{user.name} · {user.email}</p>
        <div className="grid2">
          <Field label="Current password"><input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required /></Field>
          <Field label="New password (min 8 characters)"><input type="password" minLength={8} maxLength={72} value={next} onChange={(e) => setNext(e.target.value)} required /></Field>
        </div>
        <ErrorText>{pwErr}</ErrorText>
        {pwMsg && <p className="ok-text">{pwMsg}</p>}
        <button className="btn" type="submit">Change password</button>
      </form>

      <div className="card">
        <h3>Payment &amp; notification settings</h3>
        <p className="muted-text">Razorpay keys, SMTP email and the "driver only after payment" rule are set on the server in <code>backend/.env</code> (never in this panel, for security). See the README.</p>
      </div>
    </>
  );
}
