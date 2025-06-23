// src/hooks/useAppDataRefetcher.js
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// global DOM event name for a handle swap
const EVENT_NAME = 'user-handle-changed';

// fallback rules for permission-gated fragments/tabs
const FALLBACK_ROUTES = [
  {
    // clear any #settings on a community page
    match: ({ pathname, hash }) =>
      pathname.startsWith('/communities/c/') && hash.startsWith('#settings'),
    getFallback: ({ pathname }) => pathname, // strip hash
  },
  {
    // clear any #members
    match: ({ pathname, hash }) =>
      pathname.startsWith('/communities/c/') && hash.startsWith('#members'),
    getFallback: ({ pathname }) => pathname,
  },
  {
    // force Professional‐profile back to proTab=home
    match: ({ pathname, search }) =>
      pathname.startsWith('/profile/') &&
      new URLSearchParams(search).get('view') === 'professional' &&
      new URLSearchParams(search).get('proTab') !== 'home',
    getFallback: ({ pathname }) => {
      const params = new URLSearchParams();
      params.set('view', 'professional');
      params.set('proTab', 'home');
      return `${pathname}?${params.toString()}`;
    },
  },
];

export default function useAppDataRefetcher() {
  const qc = useQueryClient();

  useEffect(() => {
    const handler = () => {
      // invalidate *all* queries you listed in ALL_QUERY_KEYS
      qc.invalidateQueries(); // clears all active queries

      // then check if we’re on a forbidden fragment/tab
      const { pathname, search, hash } = window.location;
      for (let { match, getFallback } of FALLBACK_ROUTES) {
        if (match({ pathname, search, hash })) {
          const url = getFallback({ pathname, search, hash });
          window.history.replaceState(null, '', url);
          break;
        }
      }
    };

    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [qc]);
}
