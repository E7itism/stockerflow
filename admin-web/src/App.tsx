/**
 * APP.TSX - ROUTING SETUP
 *
 * WHAT THIS DOES:
 * - Defines all the routes (URLs) for your app
 * - Protects routes that need authentication
 * - Wraps everything in AuthProvider for login state
 *
 * HOW ROUTING WORKS:
 * User types URL → React Router matches route → Shows component
 *
 * EXAMPLE:
 * User goes to /products → Shows ProductsPage
 * User goes to /login → Shows LoginPage
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import all pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SuppliersPage } from './pages/SupplierPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesReportsPage } from './pages/SalesReportsPage';

/**
 * App Component
 *
 * STRUCTURE:
 * 1. AuthProvider - Provides login state to all components
 * 2. BrowserRouter - Enables routing
 * 3. Routes - Container for all route definitions
 * 4. Route - Individual route definitions
 */

function App() {
  return (
    /**
     * AuthProvider Wrapper
     *
     * WHAT IT DOES:
     * Makes user login state available everywhere
     * Any component can use useAuth() to get user info
     */
    <AuthProvider>
      {/**
       * BrowserRouter
       *
       * WHAT IT DOES:
       * Enables URL-based routing
       * Listens to URL changes and updates the page
       */}
      <BrowserRouter>
        {/**
         * Routes Container
         *
         * WHAT IT DOES:
         * Holds all individual routes
         * Only ONE route matches at a time
         */}
        <Routes>
          {/* ========== PUBLIC ROUTES (No login required) ========== */}

          {/**
           * Login Route
           * URL: /login
           * Component: LoginPage
           * Public: Anyone can access
           */}
          <Route path="/login" element={<LoginPage />} />

          {/**
           * Register Route
           * URL: /register
           * Component: RegisterPage
           * Public: Anyone can access
           */}
          <Route path="/register" element={<RegisterPage />} />

          {/* ========== PROTECTED ROUTES (Login required) ========== */}

          {/**
           * Dashboard Route
           * URL: /dashboard
           * Component: DashboardPage
           * Protected: Must be logged in
           *
           * HOW ProtectedRoute WORKS:
           * 1. Checks if user is logged in
           * 2. If yes → Show DashboardPage
           * 3. If no → Redirect to /login
           */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/**
           * Products Route
           * URL: /products
           * Component: ProductsPage
           * Protected: Must be logged in
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
           * Categories Route
           * URL: /categories
           * Component: CategoriesPage
           * Protected: Must be logged in
           */}
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />

          {/**
           * Suppliers Route
           * URL: /suppliers
           * Component: SuppliersPage
           * Protected: Must be logged in
           */}
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <SuppliersPage />
              </ProtectedRoute>
            }
          />

          {/**
           * Inventory Route
           * URL: /inventory
           * Component: InventoryPage
           * Protected: Must be logged in
           */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          {/* ========== DEFAULT ROUTE ========== */}

          {/**
           * Root/Home Route
           * URL: /
           * Action: Redirect to /dashboard
           *
           * WHY:
           * When user goes to homepage (/), send them to dashboard
           * If not logged in, ProtectedRoute will send to login
           */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <SalesReportsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

/**
 * ROUTE FLOW EXAMPLE:
 *
 * User types: https://yourapp.com/products
 *
 * 1. BrowserRouter sees URL = "/products"
 * 2. Routes checks all routes for match
 * 3. Finds: <Route path="/products" ...>
 * 4. ProtectedRoute checks login:
 *    - Logged in? → Show ProductsPage ✓
 *    - Not logged in? → Redirect to /login ✗
 * 5. ProductsPage renders
 */
