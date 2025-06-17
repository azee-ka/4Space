// File: src/hooks/useRedirector.js
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';

export default function useRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1️⃣ Capture the very first `location.search` (so we get ?next=… before anything strips it)
  const [initialSearch] = useState(location.search);

  // 2️⃣ Parse out `next` from that initial search
  const nextRef = useRef(null);
  if (nextRef.current === null) {
    const params = new URLSearchParams(initialSearch);
    nextRef.current = params.get('next');
  }

  /**
   * buildLink(to):
   *   "/login" → "/login?next=%2Fcurrent%2Fpath"
   */
  function buildLink(to) {
    const encoded = encodeURIComponent(location.pathname + location.search);
    const sep     = to.includes('?') ? '&' : '?';
    return `${to}${sep}next=${encoded}`;
  }

  /**
   * goBack(fallback='/timeline'):
   *   1) If we captured a `next`, go there
   *   2) Otherwise go to the fallback
   */
  function goBack(fallback = '/timeline') {
    if (nextRef.current) {
      navigate(decodeURIComponent(nextRef.current), { replace: true });
    } else {
      navigate(fallback, { replace: true });
    }
  }

  return { buildLink, goBack };
}
