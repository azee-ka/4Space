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

const App = () => {
  console.log('cli id', process.env.REACT_APP_GOOGLE_CLIENT_ID);
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <GoogleOAuthProvider clientId='730423473719-9iue15ul369sug76897n96nj9msrjici.apps.googleusercontent.com'>
        <DeviceProvider>
          <div className="App">
            <AppRouter />
            <Analytics />
          </div>
        </DeviceProvider>
        </GoogleOAuthProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
