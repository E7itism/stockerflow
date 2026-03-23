import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          fontSize: '14px',
          borderRadius: '8px',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#f8fafc' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
        },
      }}
    />
  </StrictMode>,
);
