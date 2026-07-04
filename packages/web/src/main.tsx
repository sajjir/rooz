import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '../../../src/i18n.ts';
import App from '../../../src/App.tsx';
import '../../../src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
