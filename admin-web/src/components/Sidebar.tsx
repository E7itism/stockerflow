/**
 * SIDEBAR - WITH ROLE-BASED NAV FILTERING
 *
 * WHAT'S DIFFERENT:
 * - Each menu item has an optional `roles` array
 * - Items without `roles` are visible to everyone
 * - Items with `roles` only show if the current user's role is in that list
 *
 * WHY filter the sidebar AND use RoleProtectedRoute?
 * Hiding nav links = good UX (staff don't see things they can't use)
 * RoleProtectedRoute = actual security (blocks direct URL access)
 * You need both — one without the other is incomplete.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

interface Props {
  onLinkClick?: () => void;
}

interface MenuItem {
  path: string;
  icon: string;
  label: string;
  roles?: string[]; // If defined, only these roles see this item
}

export const Sidebar: React.FC<Props> = ({ onLinkClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useRole();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onLinkClick) onLinkClick();
  };

  /**
   * Menu items with optional role restrictions.
   *
   * No `roles` property → visible to all authenticated users
   * Has `roles` property → only visible to users whose role is in the array
   *
   * WHY define roles here instead of in a separate config file?
   * For a project this size, keeping it inline is simpler and easier
   * to read — you can see exactly who sees what in one glance.
   */
  const allMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/products', icon: '📦', label: 'Products' },
    { path: '/inventory', icon: '📋', label: 'Inventory' },
    {
      path: '/categories',
      icon: '📁',
      label: 'Categories',
      roles: ['admin', 'manager'],
    },
    {
      path: '/suppliers',
      icon: '🏢',
      label: 'Suppliers',
      roles: ['admin', 'manager'],
    },
    {
      path: '/reports',
      icon: '📈',
      label: 'Sales Reports',
      roles: ['admin', 'manager'],
    },
    {
      path: '/users',
      icon: '👥',
      label: 'User Management',
      roles: ['admin'],
    },
  ];

  /**
   * Filter menu items based on current user's role.
   *
   * Items with no `roles` → always included
   * Items with `roles`    → included only if user has one of those roles
   */
  const visibleMenuItems = allMenuItems.filter(
    (item) => !item.roles || hasRole(...(item.roles as string[])),
  );

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col overflow-y-auto">
      {/* ========== MENU SECTION ========== */}
      <div className="py-6 px-4 flex-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Menu
        </h2>

        <nav className="space-y-1">
          {visibleMenuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <span className="text-2xl mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ========== FOOTER ========== */}
      <div className="p-4 border-t">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-semibold">STOCKER v1.0</p>
          <p className="mt-1">Inventory Management</p>
        </div>
      </div>
    </div>
  );
};
