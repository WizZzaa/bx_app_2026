import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import AuthGate from './components/auth/AuthGate';
import { ToastProvider } from './lib/ui/ToastContext';
import './styles/globals.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>
);
