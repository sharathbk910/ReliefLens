import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import { App } from './App.tsx';
import { z } from 'zod';
import './index.css';

// Ensure backward compatibility with any resolvers or libraries expecting Zod 3 ZodError.errors
if (typeof z.ZodError !== 'undefined' && !('errors' in z.ZodError.prototype)) {
  Object.defineProperty(z.ZodError.prototype, 'errors', {
    get() {
      return this.issues || [];
    },
    configurable: true,
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
