import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Clears only stale page-level scroll locks when the route changes or the
 * document is restored from the browser back/forward cache.
 * It deliberately does not listen to `focus`, because focusing the window
 * while a real payment/date/auth modal is open must not unlock the page.
 */
export default function ScrollGuard() {
  const location = useLocation();

  useEffect(() => {
    const clearStaleLock = () => {
      const hasOpenModal =
        document.querySelector(
          '.modal.show, .modal.open, .d2-auth-overlay.open, #demoPaymentModal.open, [aria-modal="true"][open]'
        );
      if (!hasOpenModal) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };

    clearStaleLock();

    const onPageShow = () => clearStaleLock();
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [location.pathname]);

  return null;
}
