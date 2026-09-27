import { resetPageScrollLock } from './utils/scrollGuard';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// NOTE: intentionally NOT using <React.StrictMode> here.
// StrictMode makes React run effects twice on every page load (a dev-only
// safety check). That's fine for normal React code, but this project wraps
// old-style plain-JavaScript pages (public/js/*.js) that attach event
// listeners with document.getElementById + addEventListener. Those scripts
// were never written to run twice safely, so StrictMode caused every button
// to get duplicate click handlers - which is what was breaking page
// scrolling (the payment popup's scroll-lock toggle fired twice and got out
// of sync) and could cause other odd double-firing behavior across the app.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);

resetPageScrollLock();
