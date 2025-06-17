// src/hooks/useAppTriggers.js
import { useEffect } from 'react';

const EVENT_MAP = {
  userHandleChanged: 'user-handle-changed',
  // add more: themeChanged: 'theme-changed', etc
};

export default function useAppTriggers(triggers = {}) {
  useEffect(() => {
    const listeners = Object.entries(triggers).map(([triggerKey, handler]) => {
      const eventName = EVENT_MAP[triggerKey];
      if (!eventName || !handler) return;

      const listener = (e) => handler(e?.detail);
      window.addEventListener(eventName, listener);
      return { eventName, listener };
    });

    return () => {
      listeners.forEach(({ eventName, listener }) => {
        if (eventName && listener) window.removeEventListener(eventName, listener);
      });
    };
  }, [triggers]);
}
