import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { createLogger } from '@/utils/logger';
import './styles.css';

/**
 * Renderer bootstrap.
 *
 * Entry point referenced from `index.html`. Wraps the app in an
 * ErrorBoundary so any uncaught render exception is presented as a
 * player-friendly crash overlay instead of a blank page (todo#20).
 *
 * We also install global handlers for window-level errors and
 * unhandled promise rejections so async failures land in the in-app
 * log buffer (and therefore in any downloaded crash report).
 */
const log = createLogger('bootstrap');
window.addEventListener('error', (e) => {
  log.error('window.onerror', e.error ?? e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  log.error('unhandledrejection', e.reason);
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Renderer bootstrap: #root element not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
