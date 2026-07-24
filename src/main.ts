import './styles/main.css';
import { App } from './app/App';
import { registerServiceWorker } from './pwa/registerServiceWorker';

// Launch the application when the DOM is fully interactive
document.addEventListener('DOMContentLoaded', () => {
  new App();
  registerServiceWorker();
});
