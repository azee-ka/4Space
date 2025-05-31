// App.js
import React from 'react';
import './App.scss'
import { Provider } from 'react-redux';
import store from './state/store';
import AppRouter from './routing/AppRouter';
import ErrorBoundary from './ErrorBoundary';
import { DeviceProvider } from './context/DeviceContext';

const App = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <DeviceProvider>
          <div className="App">
            <AppRouter />
          </div>
        </DeviceProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
