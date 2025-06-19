import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const EVENT_MAP = {
  userHandleChanged: 'user-handle-changed',
  // add more events if needed
};

const REFRESH_QUERIES_FOR_EVENT = {
  userHandleChanged: [
    ['profileVisibility'],
    ['userProfile'],
    ['basicInfo'],
    // add any other keys you want to invalidate on handle switch
  ],
  // add more event-query mappings as needed
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
