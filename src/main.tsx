import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';

try {
  if (window.self !== window.top) {
    window.top!.location.replace(window.location.href);
  }
} catch {
  /* Cross-origin parent — Vercel headers refuse the frame on the next load. */
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
