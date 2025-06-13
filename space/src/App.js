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

const App = () => {

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <DeviceProvider>
          <div className="App">
            <AppRouter />
            <Analytics />
            <SpeedInsights />
          </div>
        </DeviceProvider>
        </GoogleOAuthProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
