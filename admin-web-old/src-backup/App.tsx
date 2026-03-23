/**
 * APP.TSX - ROUTING SETUP
 *
 * WHAT THIS DOES:
 * - Defines all the routes (URLs) for your app
 * - Protects routes that need authentication
 * - Restricts routes by role using RoleProtectedRoute
 * - Wraps everything in AuthProvider for login state
 *
 * ROUTE PROTECTION LEVELS:
 * - Public          → anyone (login, register)
 * - ProtectedRoute  → must be logged in (dashboard, inventory, products)
 * - RoleProtectedRoute → must be logged in AND have the right role
 *
 * ROLE PERMISSIONS:
 * - /reports    → admin, manager
 * - /categories → admin, manager
 * - /suppliers  → admin, manager
 * - /users      → admin only (future)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';

// Import all pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SuppliersPage } from './pages/SupplierPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesReportsPage } from './pages/SalesReportsPage';
import { UsersPage } from './pages/UsersPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ========== PUBLIC ROUTES ========== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ========== PROTECTED ROUTES (login required, any role) ========== */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/**
           * Products — all roles can VIEW
           * Edit/Delete buttons inside are hidden by role (see ProductsPage)
           */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />

          {/**
           * Inventory — all roles can add transactions and view stock
           */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          {/* ========== ROLE-PROTECTED ROUTES ========== */}

          {/**
           * Categories — admin and manager only
           * Staff don't need to create/edit categories
           */}
          <Route
            path="/categories"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                <CategoriesPage />
              </RoleProtectedRoute>
            }
          />

          {/**
           * Suppliers — admin and manager only
           * Supplier relationships are a management concern, not staff
           */}
          <Route
            path="/suppliers"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                <SuppliersPage />
              </RoleProtectedRoute>
            }
          />

          {/**
           * Sales Reports — admin and manager only
           * Revenue data is sensitive — staff don't need to see it
           */}
          <Route
            path="/reports"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                <SalesReportsPage />
              </RoleProtectedRoute>
            }
          />

          {/**
           * User Management — admin only
           * Creating/deactivating accounts is the highest privilege
           */}
          <Route
            path="/users"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </RoleProtectedRoute>
            }
          />

          {/* ========== DEFAULT ROUTE ========== */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
