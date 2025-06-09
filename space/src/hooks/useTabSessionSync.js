// hooks/useTabSessionSync.js
const SESSION_SYNC_KEY = 'pendingAuthSwitch';

const useTabSessionSync = () => {
  const openProjectInNewTab = (href, payload = null) => {
    if (payload) {
      sessionStorage.setItem(SESSION_SYNC_KEY, JSON.stringify(payload));
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const checkAndApplySessionSwitch = (onReceiveSession) => {
    const raw = sessionStorage.getItem(SESSION_SYNC_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.token && parsed?.user) {
        onReceiveSession(parsed);
        sessionStorage.removeItem(SESSION_SYNC_KEY);
      }
    } catch (e) {
      console.warn('Failed to parse session payload', e);
    }
  };

  return { openProjectInNewTab, checkAndApplySessionSwitch };
};

export default useTabSessionSync;
