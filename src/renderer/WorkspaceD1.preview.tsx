import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource-variable/geist'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { CalculatorRegulatoryProvider } from './lib/calculatorRegulatory'
import { ToastProvider } from './lib/ui/ToastContext'
import '../shared/design/tokens.css'
import './styles/globals.css'

// Local visual-QA entry point. Vite's production build only emits index.html,
// therefore this explicit auth-free preview is never shipped to users.
document.documentElement.setAttribute('data-bx-design', 'd1')
document.documentElement.setAttribute('data-theme', new URLSearchParams(window.location.search).get('theme') || 'light')

const root = document.getElementById('root')
if (!root) throw new Error('Workspace preview root is missing')

createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ToastProvider>
          <CalculatorRegulatoryProvider>
            <App />
          </CalculatorRegulatoryProvider>
        </ToastProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
