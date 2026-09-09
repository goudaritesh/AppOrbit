import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { store } from './store/store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111827',
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '0.75rem',
              fontSize: '0.8125rem',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.65)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#111827',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#111827',
              },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
