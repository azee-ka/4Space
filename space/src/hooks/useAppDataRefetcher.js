import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ALL_QUERY_KEYS } from '../services/queryKeys';

const EVENT_MAP = {
  userHandleChanged: 'user-handle-changed',
  // add more events if needed
};

const REFRESH_QUERIES_FOR_EVENT = {
  userHandleChanged: ALL_QUERY_KEYS
};

/**
 * Listens for global app events and invalidates relevant queries.
 * Call once at app root (e.g., in App.js).
 */
export default function useAppDataRefetcher() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventListeners = Object.entries(EVENT_MAP).map(([triggerKey, eventName]) => {
      const handler = () => {
        const queries = REFRESH_QUERIES_FOR_EVENT[triggerKey] || [];
        queries.forEach(key => queryClient.invalidateQueries(key));
      };
      window.addEventListener(eventName, handler);
      return { eventName, handler };
    });

    return () => {
      eventListeners.forEach(({ eventName, handler }) =>
        window.removeEventListener(eventName, handler)
      );
    };
  }, [queryClient]);
}
