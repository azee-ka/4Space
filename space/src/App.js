// App.js
import React from 'react';
import './App.css'
import { Provider } from 'react-redux';
import store from './state/store';
import AppRouter from './routing/AppRouter';
import ErrorBoundary from './ErrorBoundary';
import { DeviceProvider } from './context/DeviceContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import NetworkStatusBanner from './utils/NetworkStatusBanner';

const App = () => {
  const queryClient = new QueryClient();

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <DeviceProvider>
              <div className="App">
                <NetworkStatusBanner />
                <AppRouter />
                <Analytics />
                <SpeedInsights />
                <ReactQueryDevtools initialIsOpen={false} />
              </div>
            </DeviceProvider>
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
