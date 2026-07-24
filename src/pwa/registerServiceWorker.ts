/**
 * Registers the Service Worker for offline asset caching.
 * Resolves the registration scope based on the Vite base path.
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const base = import.meta.env.BASE_URL || '/p-maze/';
      navigator.serviceWorker
        .register(`${base}sw.js`, { scope: base })
        .then((registration) => {
          console.info('Service Worker registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}
