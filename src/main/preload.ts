// Preload script for Electron
// Note: All data operations are now handled in the browser using IndexedDB
// The browser-based API (src/renderer/utils/api.ts) initializes window.electronAPI
// This preload script is minimal - just for Electron-specific features if needed

import { contextBridge } from 'electron';

// Expose minimal API - the browser API handles everything else
contextBridge.exposeInMainWorld('isElectron', true);

// Type definitions
declare global {
  interface Window {
    isElectron?: boolean;
  }
}
