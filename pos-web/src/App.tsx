import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import SalesHistoryPage from './pages/SalesHistoryPage';

/**
 * App — top-level routing
 *
 * Route structure:
 *   /login          → LoginPage (public)
 *   /               → POSPage (protected — main cashier screen)
 *   /history        → SalesHistoryPage (protected)
 */
export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          isAuthenticated ? <POSPage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/history"
        element={
          isAuthenticated ? (
            <SalesHistoryPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Catch-all: redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
