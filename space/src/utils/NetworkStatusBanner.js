// NetworkStatusBanner.js
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';

const BANNER_DURATION = 1800;

export default function NetworkStatusBanner() {
  const queryClient = useQueryClient();

  const [online, setOnline] = React.useState(window.navigator.onLine);
  const [serverDown, setServerDown] = React.useState(false);

  const [showBanner, setShowBanner] = React.useState(false);
  const [bannerText, setBannerText] = React.useState('');
  const [bannerStyle, setBannerStyle] = React.useState({});
  const reconnectingRef = React.useRef(false);

  // Browser events
  React.useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => setOnline(true);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // Query server/network error
  React.useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(event => {
      if (
        event?.type === 'query' &&
        event?.query.state.status === 'error' &&
        event?.query.state.error
      ) {
        const error = event.query.state.error;
        if (
          typeof error === "object" &&
          (
            (error.message && (
              error.message.includes('Network Error') ||
              error.message.includes('Failed to fetch')
            )) ||
            error.code === 'ERR_NETWORK' ||
            (error.response && [502, 503, 504, 0].includes(error.response.status))
          )
        ) {
          setServerDown(true);
        }
      }
      if (
        event?.type === 'query' &&
        event?.query.state.status === 'success'
      ) {
        setServerDown(false);
      }
    });
    return unsub;
  }, [queryClient]);

  // Banner display logic
  React.useEffect(() => {
    if (!online) {
      setBannerText('No internet connection');
      setBannerStyle({ background: '#eeeeee', color: '#222', border: '1px solid #bbb' });
      setShowBanner(true);
      reconnectingRef.current = false;
    } else if (serverDown) {
      setBannerText('Cannot reach the server');
      setBannerStyle({ background: '#f5f5f5', color: '#555', border: '1px solid #bbb' });
      setShowBanner(true);
      reconnectingRef.current = false;
    } else if (showBanner) {
      // Show reconnecting & back online
      if (!reconnectingRef.current) {
        setBannerText('Reconnecting…');
        setBannerStyle({ background: '#e3f2fd', color: '#1976d2', border: '1px solid #b3c6e4' });
        setShowBanner(true);
        reconnectingRef.current = true;
        setTimeout(() => {
          setBannerText('Back online!');
          setBannerStyle({ background: '#e6faed', color: '#157347', border: '1px solid #a2d9b1' });
        }, 700);
        setTimeout(() => {
          setShowBanner(false);
          reconnectingRef.current = false;
        }, BANNER_DURATION);
      }
    }
    // eslint-disable-next-line
  }, [online, serverDown]);

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        color: bannerStyle.color || '#222',
        background: bannerStyle.background || '#f5f5f5',
        border: bannerStyle.border || '1px solid #bbb',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        borderRadius: '24px',
        padding: '8px 18px',
        fontSize: '1rem',
        fontWeight: 500,
        letterSpacing: 0.2,
        minWidth: 0,
        width: 'auto',
        maxWidth: '90vw',
        textAlign: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
        transition: 'all 0.3s',
        ...bannerStyle,
      }}
    >
      {bannerText}
    </div>
  );
}
