import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

/**
 * Renderer bootstrap.
 *
 * Entry point referenced from `index.html`. The app is intentionally thin
 * while the gameplay shell is still being built — it mounts a placeholder
 * screen and nothing else. See `docs/ROADMAP.md` for screen order.
 */
const container = document.getElementById('root');
if (!container) {
  throw new Error('Renderer bootstrap: #root element not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
