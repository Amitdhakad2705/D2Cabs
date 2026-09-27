import { useState } from 'react';
import { api } from '../api';
import { ErrorText, Field, Loading, Modal, inr, useFetch } from '../components/ui';

const EMPTY = {
  key: '', name: '', category: '', image: '', seats: 4, luggage: '', fuel: '', transmission: 'Manual', ac: true, active: true, sortOrder: 0,
  pricing: {
    local: { baseFare: 0, perKm: 0 },
    outstation: { minimumFare: 0, perKm: 0, driverAllowance: 0 },
    airport: { baseFare: 0, perKm: 0 },
  },
};

function CabForm({ cab, onClose, onSaved }) {
  const editing = Boolean(cab);
  const [f, setF] = useState(cab ? JSON.parse(JSON.stringify(cab)) : JSON.parse(JSON.stringify(EMPTY)));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setNum = (k) => (e) => setF({ ...f, [k]: Number(e.target.value) });
  const setPrice = (group, k) => (e) => setF({ ...f, pricing: { ...f.pricing, [group]: { ...f.pricing[group], [k]: Number(e.target.value) } } });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const body = {
      name: f.name, category: f.category, image: f.image || undefined, seats: f.seats, luggage: f.luggage, fuel: f.fuel,
      transmission: f.transmission, ac: f.ac, active: f.active, sortOrder: f.sortOrder, pricing: f.pricing,
    };
    try {
      if (editing) await api.put(`/admin/cabs/${cab._id}`, body);
      else await api.post('/admin/cabs', { ...body, key: f.key });
      onSaved();
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  const P = f.pricing;
  return (
    <Modal title={editing ? `Edit ${cab.name}` : 'Add cab'} onClose={onClose} wide>
      <form onSubmit={save}>
        <div className="grid2">
          <Field label="Key (short id, cannot change later)" hint="lowercase letters, numbers, hyphen e.g. dzire">
            <input value={f.key} onChange={set('key')} disabled={editing} required />
          </Field>
          <Field label="Name"><input value={f.name} onChange={set('name')} required /></Field>
          <Field label="Category (Hatchback / Sedan / MPV / SUV)"><input value={f.category} onChange={set('category')} required /></Field>
          <Field label="Image path (e.g. /images/img_031.jpg)"><input value={f.image} onChange={set('image')} /></Field>
          <Field label="Seats"><input type="number" min="1" max="20" value={f.seats} onChange={setNum('seats')} required /></Field>
          <Field label="Luggage"><input value={f.luggage} onChange={set('luggage')} placeholder="2 Bags" /></Field>
          <Field label="Fuel"><input value={f.fuel} onChange={set('fuel')} /></Field>
          <Field label="Transmission">
            <select value={f.transmission} onChange={set('transmission')}><option>Manual</option><option>Automatic</option></select>
          </Field>
          <Field label="Sort order"><input type="number" min="0" value={f.sortOrder} onChange={setNum('sortOrder')} /></Field>
        </div>
        <label className="check"><input type="checkbox" checked={f.ac} onChange={(e) => setF({ ...f, ac: e.target.checked })} /> Air conditioned</label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Available for booking on the website</label>

        <h4>Pricing (₹)</h4>
        <div className="grid3">
          <fieldset><legend>Local</legend>
            <Field label="Base fare"><input type="number" min="0" value={P.local.baseFare} onChange={setPrice('local', 'baseFare')} /></Field>
            <Field label="Per km"><input type="number" min="0" step="0.5" value={P.local.perKm} onChange={setPrice('local', 'perKm')} /></Field>
          </fieldset>
          <fieldset><legend>Outstation</legend>
            <Field label="Minimum fare"><input type="number" min="0" value={P.outstation.minimumFare} onChange={setPrice('outstation', 'minimumFare')} /></Field>
            <Field label="Per km"><input type="number" min="0" step="0.5" value={P.outstation.perKm} onChange={setPrice('outstation', 'perKm')} /></Field>
            <Field label="Driver allowance"><input type="number" min="0" value={P.outstation.driverAllowance} onChange={setPrice('outstation', 'driverAllowance')} /></Field>
          </fieldset>
          <fieldset><legend>Airport</legend>
            <Field label="Base fare"><input type="number" min="0" value={P.airport.baseFare} onChange={setPrice('airport', 'baseFare')} /></Field>
            <Field label="Per km"><input type="number" min="0" step="0.5" value={P.airport.perKm} onChange={setPrice('airport', 'perKm')} /></Field>
          </fieldset>
        </div>
        <ErrorText>{err}</ErrorText>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save cab'}</button>
      </form>
    </Modal>
  );
}

export default function Cabs() {
  const { data, error, loading, reload } = useFetch(() => api.get('/admin/cabs'));
  const [form, setForm] = useState(null); // null | 'new' | cab
  const [msg, setMsg] = useState('');

  async function toggle(c) {
    try { await api.patch(`/admin/cabs/${c._id}/active`, { active: !c.active }); reload(); } catch (e) { setMsg(e.message); }
  }
  async function remove(c) {
    if (!window.confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    try { await api.del(`/admin/cabs/${c._id}`); reload(); } catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <div className="row-between"><h1>Cabs &amp; pricing</h1><button className="btn primary" onClick={() => setForm('new')}>+ Add cab</button></div>
      <ErrorText>{error || msg}</ErrorText>
      {loading && !data ? <Loading /> : data && (
        <div className="card scroll">
          <table>
            <thead><tr><th>Cab</th><th>Category</th><th>Seats</th><th>Local</th><th>Outstation</th><th>Airport</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.cabs.map((c) => (
                <tr key={c._id}>
                  <td><b>{c.name}</b><br /><small>{c.key}</small></td>
                  <td>{c.category}</td><td>{c.seats}</td>
                  <td>{inr(c.pricing.local.baseFare)} + {c.pricing.local.perKm}/km</td>
                  <td>min {inr(c.pricing.outstation.minimumFare)}, {c.pricing.outstation.perKm}/km, allowance {inr(c.pricing.outstation.driverAllowance)}</td>
                  <td>{inr(c.pricing.airport.baseFare)} + {c.pricing.airport.perKm}/km</td>
                  <td>{c.active ? <span className="badge ok">Enabled</span> : <span className="badge muted">Disabled</span>}</td>
                  <td className="nowrap">
                    <button className="btn" onClick={() => setForm(c)}>Edit</button>{' '}
                    <button className="btn" onClick={() => toggle(c)}>{c.active ? 'Disable' : 'Enable'}</button>{' '}
                    <button className="btn danger" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form && <CabForm cab={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={() => { setForm(null); reload(); }} />}
    </>
  );
}
