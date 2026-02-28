/**
 * RoleProtectedRoute.tsx
 *
 * Extends ProtectedRoute with role-based access control.
 *
 * HOW IT WORKS:
 * 1. Waits for auth to finish loading (same as ProtectedRoute)
 * 2. Redirects to /login if not authenticated
 * 3. Shows an "Access Denied" page if authenticated but wrong role
 * 4. Renders children if both checks pass
 *
 * WHY show an Access Denied page instead of redirecting?
 * Redirecting silently to dashboard is confusing — the user clicked
 * something and nothing happened. Showing a clear message tells them
 * WHY they can't access it, which is better UX.
 *
 * WHY NOT just hide the nav link and call it done?
 * Hiding the nav link is a UX convenience, not a security measure.
 * A user could still manually type /reports in the URL bar.
 * RoleProtectedRoute blocks the route itself — the nav link hiding
 * is just a bonus on top.
 *
 * USAGE:
 *   <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
 *     <SalesReportsPage />
 *   </RoleProtectedRoute>
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleProtectedRoute: React.FC<Props> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  /**
   * Wait for auth state to restore from localStorage.
   * Without this check, the app would flash to /login on every refresh
   * before the session is restored.
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not logged in at all → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → show access denied
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center max-w-md w-full mx-4">
          {/* Lock icon */}
          <div className="text-6xl mb-4">🔒</div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          <p className="text-gray-600 mb-2">
            You don't have permission to view this page.
          </p>

          <p className="text-sm text-gray-400 mb-8">
            Your role:{' '}
            <span className="font-semibold text-gray-600 capitalize">
              {user?.role || 'unknown'}
            </span>{' '}
            · Required:{' '}
            <span className="font-semibold text-gray-600">
              {allowedRoles.join(' or ')}
            </span>
          </p>

          <a
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Authenticated + correct role → render the page
  return <>{children}</>;
};
