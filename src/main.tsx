import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { installPrintIsolation } from './utils/printIsolation'

// Register Service Worker for PWA (Production)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Invoix PWA Service Worker active:', reg.scope);
      })
      .catch((err) => {
        console.log('SW registration failed:', err);
      });
  });
}

// Hook the browser's print lifecycle once, globally. Registering here rather
// than inside a click handler is what makes Ctrl+P and the browser's own print
// menu produce the document instead of the editor UI.
installPrintIsolation();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="root">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
