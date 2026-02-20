import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        {/* Toast notifications for sale confirmations, errors, etc. */}
        <Toaster
          position="top-center"
          toastOptions={{
            success: { duration: 3000 },
            error: { duration: 4000 },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
