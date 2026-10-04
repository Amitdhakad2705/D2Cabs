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
        // Final common scroll rules.
    // This is intentionally loaded AFTER each legacy page CSS so
    // About/Services/Contact/FAQ/etc. cannot override page scrolling.
    const scrollStyle = document.createElement('style');
    scrollStyle.dataset.legacyScrollFix = 'true';
    scrollStyle.textContent = `
      html {
        width: 100%;
        max-width: 100%;
        min-height: 100%;
        height: auto !important;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior-y: auto;
        scroll-behavior: auto;
      }

      body {
        width: 100%;
        max-width: 100%;
        min-height: 100%;
        height: auto !important;
        margin: 0;
        overflow-x: hidden;
        overflow-y: visible;
        overscroll-behavior-y: auto;
        scroll-behavior: auto;
      }

      #root {
        min-height: 100vh;
        height: auto !important;
        overflow: visible;
      }
          /* =========================================================
       FINAL DESKTOP HEADER - FULL VIEWPORT
       Loaded after every legacy page CSS so page CSS
       cannot constrain the header.
       ========================================================= */

     @media (min-width: 768px) {

      .faq-header {
        width: 100vw !important;
        max-width: none !important;
        margin-left: calc(50% - 50vw) !important;
        margin-right: calc(50% - 50vw) !important;

        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;

        padding-left: 24px !important;
        padding-right: 24px !important;

        box-sizing: border-box !important;
      }

      .faq-header-menu {
        position: relative !important;
        left: auto !important;
        right: auto !important;
        margin: 0 !important;
        flex: 0 0 40px !important;
      }

      .faq-header-brand {
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        margin: 0 !important;
      }

      .faq-header-cta-right {
        position: relative !important;
        left: auto !important;
        right: auto !important;
        margin: 0 0 0 auto !important;
        flex: 0 0 auto !important;
      }
     }
    `;
    document.head.appendChild(scrollStyle);
  
    // Remove a stale copy if a previous route transition left one behind.
    document.querySelectorAll(`script[data-legacy-page="${jsSrc}"]`).forEach((oldScript) => oldScript.remove());

    // Shared scripts first (API client, then login popup), then the page's own script.
    // The API base URL comes from VITE_API_BASE_URL (default '/api' = Vite dev proxy).
    const apiBase = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
    window.__D2_API_BASE__ = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;
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
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowY = '';
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      scrollStyle.remove();
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
