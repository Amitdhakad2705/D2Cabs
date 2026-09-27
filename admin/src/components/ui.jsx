import { useCallback, useEffect, useState } from 'react';

export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—');
export const label = (s) => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** Loads data when the page opens (and again when `deps` change). */
export function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: '', loading: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    loader()
      .then((data) => setState({ data, error: '', loading: false }))
      .catch((e) => setState({ data: null, error: e.message, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { ...state, reload: run };
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' wide' : ''}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn ghost" type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label: text, children, hint }) {
  return (
    <label className="field">
      <span>{text}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

const BADGE = {
  PENDING: 'warn', CONFIRMED: 'info', DRIVER_ASSIGNED: 'info', DRIVER_ON_THE_WAY: 'info', TRIP_STARTED: 'info',
  COMPLETED: 'ok', REJECTED: 'bad', CANCELLED: 'bad', NOT_REQUESTED: 'muted', PARTIALLY_PAID: 'warn',
  PAID: 'ok', FAILED: 'bad', REFUNDED: 'muted', AVAILABLE: 'ok', ON_TRIP: 'info', OFF_DUTY: 'muted',
};
export const Badge = ({ status }) => <span className={`badge ${BADGE[status] || 'muted'}`}>{label(status)}</span>;

export function Pager({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="pager">
      <button className="btn" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</button>
      <span>Page {page} of {pages}</span>
      <button className="btn" type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next ›</button>
    </div>
  );
}

export const ErrorText = ({ children }) => (children ? <p className="error">{children}</p> : null);
export const Loading = () => <p className="muted-text">Loading…</p>;
