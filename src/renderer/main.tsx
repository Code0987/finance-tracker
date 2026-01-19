import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// Initialize the browser API (IndexedDB-based)
import './utils/api';

// Use HashRouter for Electron (file:// protocol)
const isElectron = typeof window !== 'undefined' && 
  (window.process?.type === 'renderer' || 
   window.navigator.userAgent.toLowerCase().includes('electron'));

const Router = isElectron ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
