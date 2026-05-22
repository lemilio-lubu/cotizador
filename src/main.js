import { initApp } from './ui/app.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Register Service Worker — production only (dev mode would break Vite HMR)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}
