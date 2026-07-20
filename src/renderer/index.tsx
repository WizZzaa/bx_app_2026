import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import AuthGate from './components/auth/AuthGate';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './lib/ui/ToastContext';
import { installGlobalErrorReporting } from './lib/errorReporter';
import { applyFontScale, currentFontScale } from './lib/uiScale';
import { applyUiDensity, currentUiDensity } from './lib/uiDensity';
import { applyTheme, currentTheme } from './lib/theme';
import { CalculatorRegulatoryProvider } from './lib/calculatorRegulatory';
import {
  applyBxDesignFeature,
  loadBxDesignFont,
  resolveBxDesignFeatureFlag,
} from '../shared/design/feature';
import '../shared/design/tokens.css';
import './styles/globals.css';

installGlobalErrorReporting();
const isD1DesignEnabled = resolveBxDesignFeatureFlag(import.meta.env.VITE_BX_D1_UI);
applyBxDesignFeature(document.documentElement, isD1DesignEnabled);
void loadBxDesignFont(isD1DesignEnabled);
applyFontScale(currentFontScale());
applyUiDensity(currentUiDensity());
applyTheme(currentTheme());

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
          {isBixWidget ? <App /> : <AuthGate><CalculatorRegulatoryProvider><App /></CalculatorRegulatoryProvider></AuthGate>}
        </ToastProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
