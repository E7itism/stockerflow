/**
 * SIDEBAR - MOBILE RESPONSIVE VERSION
 *
 * WHAT'S DIFFERENT:
 * - Closes automatically when link clicked (mobile)
 * - Touch-friendly button sizes
 * - Proper width for mobile overlay
 * - Close button visible on mobile
 */

import { useNavigate, useLocation } from 'react-router-dom';

interface Props {
  onLinkClick?: () => void; // Called when link is clicked (closes mobile menu)
}

export const Sidebar: React.FC<Props> = ({ onLinkClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  /**
   * handleNavigation
   *
   * WHAT IT DOES:
   * 1. Navigate to the page
   * 2. Close mobile menu (if provided)
   *
   * WHY:
   * On mobile, clicking a link should close the sidebar
   * On desktop, onLinkClick is still called but doesn't do anything
   */
  const handleNavigation = (path: string) => {
    navigate(path);
    if (onLinkClick) {
      onLinkClick(); // Close mobile menu
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/products', icon: '📦', label: 'Products' },
    { path: '/categories', icon: '📁', label: 'Categories' },
    { path: '/suppliers', icon: '🏢', label: 'Suppliers' },
    { path: '/inventory', icon: '📋', label: 'Inventory' },
    { path: '/reports', icon: '📈', label: 'Sales Reports' },
  ];

  return (
    /**
     * Sidebar Container
     *
     * RESPONSIVE:
     * - w-64: Fixed width on all screens
     * - Full height
     * - Scrollable if content overflows
     */
    <div className="w-64 bg-white shadow-lg h-full flex flex-col overflow-y-auto">
      {/* ========== MENU SECTION ========== */}
      <div className="py-6 px-4 flex-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Menu
        </h2>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              /**
               * Touch-Friendly Size
               *
               * IMPORTANT:
               * - py-3: 12px top/bottom padding
               * - With icon (text-2xl) = ~48px height
               * - Meets 44px minimum touch target ✓
               */
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

/**
 * =============================================================
 * MOBILE INTERACTION FLOW
 * =============================================================
 *
 * DESKTOP:
 * 1. User clicks "Products"
 * 2. handleNavigation('/products')
 * 3. navigate('/products')
 * 4. onLinkClick() (does nothing on desktop)
 * 5. Page changes
 *
 * MOBILE:
 * 1. User clicks "Products"
 * 2. handleNavigation('/products')
 * 3. navigate('/products')
 * 4. onLinkClick() → closeMobileMenu() in Layout
 * 5. Sidebar slides out
 * 6. Page changes
 *
 * RESULT:
 * Smooth mobile UX - sidebar doesn't stay open after navigation
 *
 * =============================================================
 */
