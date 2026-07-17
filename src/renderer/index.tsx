import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import AuthGate from './components/auth/AuthGate';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './lib/ui/ToastContext';
import { installGlobalErrorReporting } from './lib/errorReporter';
import { applyFontScale, currentFontScale } from './lib/uiScale';
import './styles/globals.css';

installGlobalErrorReporting();
applyFontScale(currentFontScale());

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Не найден корневой элемент приложения');
const root = createRoot(rootElement);
// Окно Бикса — самостоятельный прозрачный слой. Оно не должно наследовать
// экран входа или фон основного приложения, иначе Windows покажет чёрный прямоугольник.
const isBixWidget = window.location.hash.startsWith('#/tray');
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ToastProvider>
          {isBixWidget ? <App /> : <AuthGate><App /></AuthGate>}
        </ToastProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
