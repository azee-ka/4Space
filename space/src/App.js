// App.js
import React from 'react';
import './App.css'
import { Provider } from 'react-redux';
import store from './state/store';
import AppRouter from './routing/AppRouter';
import ErrorBoundary from './ErrorBoundary';
import { PostProvider } from './context/PostContext';

const App = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
          <div className="App">
            <AppRouter />
          </div>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
