import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar, { initialSidebarCollapsed } from './components/layout/Sidebar';
import MobileNavigation from './components/layout/MobileNavigation';
import Titlebar from './components/layout/Titlebar';
import Topbar from './components/layout/Topbar';
import RouteFocusManager from './components/layout/RouteFocusManager';
import CommandPalette from './components/CommandPalette';
import OnboardingWizard from './components/OnboardingWizard';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';
import { applyTheme, currentTheme } from './lib/theme';
import { CompanyProvider } from './lib/CompanyContext';
import { PlanPreviewProvider, PlanProvider, type Plan } from './lib/plan';
import { logger } from './lib/logger';
import { reportError } from './lib/errorReporter';
import Icon from './lib/ui/Icon';
import './styles/app-shell-d1.css';
import './styles/workspace-pages-d1.css';
import './styles/a6-business-workspaces.css';

const Tools = lazy(() => import('./pages/Tools'));
const Library = lazy(() => import('./pages/library/Library'));
const ReferenceView = lazy(() => import('./pages/library/ReferenceView'));
const Calc = lazy(() => import('./pages/Calc'));
const Planner = lazy(() => import('./pages/Planner'));
const Templates = lazy(() => import('./pages/Templates'));
const Ai = lazy(() => import('./pages/Ai'));
const Support = lazy(() => import('./pages/Support'));
const Finance = lazy(() => import('./pages/Finance'));
const Currency = lazy(() => import('./pages/Currency'));
const Services = lazy(() => import('./pages/Services'));
const News = lazy(() => import('./pages/News'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Counterparties = lazy(() => import('./pages/Counterparties'));
const BixWidget = lazy(() => import('./pages/BixWidget'));
const Documents = lazy(() => import('./pages/Documents'));
const Translator = lazy(() => import('./pages/Translator'));
const FunctionCatalog = lazy(() => import('./pages/FunctionCatalog'));

function RouteLoadingFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-1 items-center justify-center ${compact ? 'bg-transparent' : 'bg-bx-bg'}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm text-bx-muted">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-bx-border border-t-bx-accent" aria-hidden="true" />
        <span>Загрузка раздела…</span>
      </div>
    </div>
  );
}

interface RouteChunkErrorBoundaryProps {
  children: React.ReactNode;
  compact?: boolean;
}

interface RouteChunkErrorBoundaryState {
  error: Error | null;
}

class RouteChunkErrorBoundary extends React.Component<RouteChunkErrorBoundaryProps, RouteChunkErrorBoundaryState> {
  state: RouteChunkErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteChunkErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('route-chunk', 'Не удалось загрузить раздел', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
    reportError(error.message, `${error.stack ?? ''}\n--- route component stack ---${info.componentStack ?? ''}`);
  }

  private handleGoHome = () => {
    window.location.hash = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className={`flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center ${this.props.compact ? 'bg-transparent' : 'bg-bx-bg'}`}>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--bx-accent-rgb)/0.12)] text-bx-accent" aria-hidden="true"><Icon name="alert" className="h-6 w-6" /></span>
        <h2 className="text-base font-semibold text-bx-text">Не удалось загрузить раздел</h2>
        <p className="max-w-md text-sm text-bx-muted">
          Файл раздела временно недоступен. Можно вернуться на главную или повторить загрузку вручную.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {!this.props.compact && (
            <button type="button" className="rounded-xl border border-bx-border px-4 py-2 text-sm text-bx-text" onClick={this.handleGoHome}>
              На главную
            </button>
          )}
          <button type="button" className="rounded-xl bg-bx-accent px-4 py-2 text-sm font-medium text-white" onClick={this.handleReload}>
            Повторить загрузку
          </button>
        </div>
      </div>
    );
  }
}

function LazyRouteBoundary({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const location = useLocation();

  return (
    <RouteChunkErrorBoundary key={location.pathname} compact={compact}>
      <Suspense fallback={<RouteLoadingFallback compact={compact} />}>
        {children}
      </Suspense>
    </RouteChunkErrorBoundary>
  );
}

// Обработчик события из трея для Electron
function TrayNavigateListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleTrayNav = (path: string) => {
      // Имитируем переход
      window.location.hash = path;
    };
    return window.bx?.tray?.onNavigate(handleTrayNav);
  }, []);
  return null;
}

// Редирект со старой ссылки ЭЦП
function EcpRedirect() {
  useEffect(() => {
    localStorage.setItem('bx_tools_last', 'ecp');
    // Оповестим другие вкладки/компоненты
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'bx_tools_last',
      newValue: 'ecp'
    }));
  }, []);
  return <Navigate to="/tools" replace />;
}

function AppPlanBoundary({ children, previewPlan }: { children: React.ReactNode; previewPlan?: Plan }) {
  return previewPlan
    ? <PlanPreviewProvider plan={previewPlan}>{children}</PlanPreviewProvider>
    : <PlanProvider>{children}</PlanProvider>;
}

export default function App({ previewPlan }: { previewPlan?: Plan } = {}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);
  const location = useLocation();
  const shellRef = useRef<HTMLDivElement>(null);

  // Инициализация темы при первом рендере (единый ключ bx_theme + классы .light/.dark)
  useEffect(() => {
    applyTheme(currentTheme());
  }, []);

  useEffect(() => {
    shellRef.current?.scrollTo?.({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  // Если это режим компактного окна (Трей-вид)
  const isCompact = window.location.search.includes('compact=true') || window.location.hash.includes('/tray');
  const isWebRuntime = !window.bx;

  if (isCompact) {
    return (
      <CompanyProvider>
        <AppPlanBoundary previewPlan={previewPlan}>
          <div className="flex flex-col h-screen w-screen bg-transparent text-bx-text overflow-visible font-sans">
            <LazyRouteBoundary compact>
              <Routes>
                <Route path="/tray" element={<BixWidget />} />
                <Route path="*" element={<Navigate to="/tray" replace />} />
              </Routes>
            </LazyRouteBoundary>
          </div>
        </AppPlanBoundary>
      </CompanyProvider>
    );
  }

  return (
    <CompanyProvider>
      <AppPlanBoundary previewPlan={previewPlan}>
        <div ref={shellRef} className="bx-app-shell flex h-screen w-screen flex-col overflow-hidden bg-bx-bg text-bx-text relative">
          <a href="#bx-main-content" className="sr-only fixed left-3 top-3 z-[1000] rounded-xl bg-bx-accent px-4 py-3 font-semibold text-bx-on-accent focus:not-sr-only">
            К основному содержимому
          </a>
          
          <div className="bx-app-shell__aura bx-app-shell__aura--start" aria-hidden="true" />
          <div className="bx-app-shell__aura bx-app-shell__aura--end" aria-hidden="true" />

          <Titlebar />
          <div className="bx-app-shell__body flex flex-1 min-h-0 overflow-hidden relative z-10">
            <TrayNavigateListener />
            <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} webResponsive={isWebRuntime} />
            <div className="bx-app-shell__workspace flex flex-1 flex-col overflow-hidden">
              <Topbar
                onOpenSearch={() => setPaletteOpen(true)}
                onToggleMenu={() => setSidebarCollapsed(value => !value)}
                menuExpanded={!sidebarCollapsed}
                previewMode={Boolean(previewPlan)}
              />
              <main id="bx-main-content" className={`bx-app-shell__content flex flex-1 overflow-hidden ${isWebRuntime ? 'pb-24 md:pb-0' : ''}`} aria-label="Основное содержимое">
                <RouteFocusManager />
                <div className="bx-workspace-route flex min-h-0 min-w-0 flex-1" data-bx-route={location.pathname} key={location.pathname}>
                  <LazyRouteBoundary>
                    <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/translator" element={<Translator />} />
                    <Route path="/reference" element={<ReferenceView />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/functions" element={<FunctionCatalog />} />
                    <Route path="/more" element={<Navigate to="/functions" replace />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/news/:id" element={<NewsDetail />} />
                    <Route path="/knowledge" element={<Library />} />
                    <Route path="/templates" element={<Navigate to="/documents/templates" replace />} />
                    <Route path="/documents" element={<Navigate to="/documents/templates" replace />} />
                    <Route path="/documents/templates" element={<Templates />} />
                    <Route path="/documents/my" element={<Documents />} />
                    <Route path="/hr" element={<Navigate to="/settings" replace />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/finance/:id" element={<Finance />} />
                    <Route path="/currency" element={<Currency />} />
                    <Route path="/planner" element={<Planner />} />
                    <Route path="/calendar" element={<Navigate to="/planner" replace />} />
                    <Route path="/calc" element={<Calc />} />
                    <Route path="/ecp" element={<EcpRedirect />} />
                    <Route path="/ai" element={<Ai />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/account" element={<Settings surface="account" />} />
                    <Route path="/counterparties" element={<Counterparties />} />
                    <Route path="/counterparties/:id" element={<Counterparties />} />
                    <Route path="/companies/:id" element={<Counterparties />} />
                    <Route path="/placeholder" element={<Placeholder icon="tools" title="Страница в разработке" description="Этот раздел временно недоступен или находится на стадии проектирования." />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </LazyRouteBoundary>
                </div>
              </main>
            </div>
          </div>

          {isWebRuntime && <MobileNavigation />}

          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
          <OnboardingWizard />
        </div>
      </AppPlanBoundary>
    </CompanyProvider>
  );
}
