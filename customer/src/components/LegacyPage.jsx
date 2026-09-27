import { useEffect, useRef } from 'react';

/**
 * LegacyPage wraps one of the original static D2Cabs pages so it can be
 * dropped into a React Router route with minimal risk of breaking the
 * existing (vanilla JS) booking / FAQ-tab / carousel logic.
 *
 * How it works:
 *  - `html`   is the page's original <body> markup, imported as a raw string
 *             (see src/pages/*.jsx for the `?raw` imports).
 *  - `cssHref` / `jsSrc` point at the page's CSS/JS files, which still live
 *             in /public/css and /public/js exactly as they did in the
 *             plain-HTML version.
 *
 * On mount we inject a <link> for the CSS and a <script> for the JS (in that
 * order, appended to <head>/<body> the same way the original static page
 * loaded them), then remove both on unmount so switching routes doesn't pile
 * up duplicate stylesheets/scripts or leave old event listeners registered
 * twice.
 *
 * This intentionally does NOT rewrite the legacy DOM-manipulation script
 * (getElementById, addEventListener, etc.) into React state/hooks — that
 * script is large (booking flow, date pickers, FAQ category filter, image
 * carousel) and rewriting it natively in React is a separate, bigger project.
 * Wrapping it like this gets you a real React + Router app today without
 * risking regressions in that logic; refactor page-by-page into real React
 * components whenever you have time to test each one carefully.
 */
export default function LegacyPage({ html, cssHref, jsSrc }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.dataset.legacyPage = jsSrc;
    document.head.appendChild(link);

  
    // Remove a stale copy if a previous route transition left one behind.
    document.querySelectorAll(`script[data-legacy-page="${jsSrc}"]`).forEach((oldScript) => oldScript.remove());

    // Shared scripts first (API client, then login popup), then the page's own script.
    // The API base URL comes from VITE_API_BASE_URL (default '/api' = Vite dev proxy).
    window.__D2_API_BASE__ = import.meta.env.VITE_API_BASE_URL || '/api';
    const sharedScripts = ['/js/d2api.js', '/js/d2auth.js'].map((src) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = false;
      el.dataset.legacyPage = jsSrc;
      document.body.appendChild(el);
      return el;
    });

    const script = document.createElement('script');
    script.src = jsSrc;
    script.async = false;
    script.dataset.legacyPage = jsSrc;
    // Original pages loaded this script inline at the bottom of <body>,
    // after the markup existed, so keep that same ordering guarantee:
    // markup is already in the DOM (dangerouslySetInnerHTML below) by the
    // time this effect runs.
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
      sharedScripts.forEach((el) => el.remove());

      // Some legacy page scripts (payment overlay, demo checkout modal,
      // date-time picker) set document.body.style.overflow = 'hidden'
      // while an on-page popup is open, and only clear it again when that
      // popup's own close button/handler runs. In the original static
      // site every page was a fresh load, so that was safe. Here, if the
      // user navigates to another route (clicking Home/FAQ/etc.) while a
      // popup is open, that cleanup line never runs — and the whole site
      // stays scroll-locked forever, even after returning to this page.
      // Force it back to normal every time we leave a legacy page so that
      // never happens.
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cssHref, jsSrc]);

  return (
    <div
      ref={containerRef}
      className="page-shell"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
