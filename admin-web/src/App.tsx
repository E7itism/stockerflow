import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';

// Admin pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SuppliersPage } from './pages/SupplierPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesReportsPage } from './pages/SalesReportsPage';
import { UsersPage } from './pages/UsersPage';

// POS pages
import { POSPage } from './pages/pos/POSPage';
import { SalesHistoryPage } from './pages/pos/SalesHistoryPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── All roles ─────────────────────────────── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          {/* ── POS — all roles (full-screen layout) ──── */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos/history"
            element={
              <ProtectedRoute>
                <SalesHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin + Manager ───────────────────────── */}
          <Route
            path="/categories"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                <CategoriesPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                <SuppliersPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                <SalesReportsPage />
              </RoleProtectedRoute>
            }
          />

          {/* ── Admin only ────────────────────────────── */}
          <Route
            path="/users"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </RoleProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
