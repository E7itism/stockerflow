/**
 * SIDEBAR - COMPLETE NAVIGATION
 *
 * WHAT THIS DOES:
 * - Shows navigation menu on the left side
 * - Highlights the current page
 * - Links to all pages in your app
 *
 * HOW IT WORKS:
 * 1. Gets current URL path
 * 2. Compares with each menu item
 * 3. Highlights the matching one
 * 4. Clicking navigates to that page
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  // ===============================================================
  // HOOKS
  // ===============================================================

  /**
   * useNavigate Hook
   *
   * WHAT IT DOES:
   * Gives us a function to change pages programmatically
   *
   * EXAMPLE:
   * navigate('/products') → Goes to products page
   */
  const navigate = useNavigate();

  /**
   * useLocation Hook
   *
   * WHAT IT DOES:
   * Tells us what page we're currently on
   *
   * EXAMPLE:
   * If URL is /products, location.pathname = '/products'
   */
  const location = useLocation();

  // ===============================================================
  // HELPER FUNCTIONS
  // ===============================================================

  /**
   * isActive Function
   *
   * WHAT IT DOES:
   * Checks if a menu item is the current page
   *
   * HOW IT WORKS:
   * Compares current URL with menu item path
   * Returns true if they match
   *
   * EXAMPLE:
   * Current URL: /products
   * isActive('/products') → true ✓
   * isActive('/dashboard') → false ✗
   *
   * @param path - The path to check
   * @returns true if current page, false otherwise
   */
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // ===============================================================
  // MENU ITEMS DATA
  // ===============================================================

  /**
   * menuItems Array
   *
   * WHAT IT IS:
   * List of all pages in the app
   *
   * STRUCTURE:
   * - path: URL to navigate to
   * - icon: Emoji icon to display
   * - label: Text label to show
   *
   * WHY AN ARRAY:
   * Easy to add/remove menu items
   * Can map over it to create menu
   */
  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/products', icon: '📦', label: 'Products' },
    { path: '/categories', icon: '📁', label: 'Categories' },
    { path: '/suppliers', icon: '🏢', label: 'Suppliers' },
    { path: '/inventory', icon: '📋', label: 'Inventory' },
  ];

  // ===============================================================
  // RENDER
  // ===============================================================

  return (
    /**
     * Sidebar Container
     *
     * CLASSES EXPLAINED:
     * - w-64: Width of 256px (64 * 4px)
     * - bg-white: White background
     * - shadow-lg: Large shadow for depth
     * - h-full: Full height
     * - flex flex-col: Vertical layout
     */
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* ========== MENU SECTION ========== */}
      <div className="py-6 px-4 flex-1">
        {/* Section Title */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Menu
        </h2>

        {/* ========== NAVIGATION LINKS ========== */}
        <nav className="space-y-1">
          {/**
           * map() Function
           *
           * WHAT IT DOES:
           * Creates a button for each menu item
           *
           * HOW IT WORKS:
           * menuItems.map((item) => { ... })
           *
           * For each item in menuItems array:
           * 1. Create a button
           * 2. Set onClick to navigate to item.path
           * 3. Style it based on if it's active
           * 4. Show icon and label
           *
           * RESULT:
           * [
           *   <button>📊 Dashboard</button>,
           *   <button>📦 Products</button>,
           *   ...
           * ]
           */}
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              /**
               * Dynamic className
               *
               * WHAT IT DOES:
               * Changes button style based on if it's the current page
               *
               * HOW IT WORKS:
               * isActive(item.path) returns true or false
               * If true → Use active styles (blue background)
               * If false → Use inactive styles (gray text)
               *
               * TEMPLATE LITERAL (backticks):
               * `text ${isActive ? 'active' : 'inactive'}`
               * Allows inserting JavaScript expressions in strings
               *
               * TERNARY OPERATOR (? :):
               * condition ? ifTrue : ifFalse
               * Shorthand for if-else
               *
               * EXAMPLE:
               * If on /products page:
               * isActive('/products') → true
               * className = 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
               *
               * If not on /products:
               * isActive('/products') → false
               * className = 'text-gray-700 hover:bg-gray-50'
               */
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {/* Icon */}
              <span className="text-2xl mr-3">{item.icon}</span>

              {/* Label */}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ========== FOOTER (Version Info) ========== */}
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
 * HOW THE SIDEBAR UPDATES WHEN YOU NAVIGATE
 * =============================================================
 *
 * STEP-BY-STEP:
 *
 * 1. User clicks "Products" button
 *
 * 2. onClick handler fires:
 *    navigate('/products')
 *
 * 3. React Router changes URL to /products
 *
 * 4. location.pathname updates to '/products'
 *
 * 5. Component re-renders (because location changed)
 *
 * 6. isActive('/products') now returns true
 *
 * 7. Products button gets active styling (blue)
 *
 * 8. Other buttons have isActive() = false (gray)
 *
 * =============================================================
 */

/**
 * =============================================================
 * CSS CLASSES BREAKDOWN
 * =============================================================
 *
 * BUTTON CLASSES:
 *
 * Base classes (always applied):
 * - w-full: Full width of container
 * - flex items-center: Horizontal layout, vertically centered
 * - px-4 py-3: Padding (16px left/right, 12px top/bottom)
 * - text-sm: Small text size
 * - font-medium: Medium font weight
 * - rounded-lg: Rounded corners
 * - transition-colors: Smooth color change animation
 *
 * Active state (when isActive = true):
 * - bg-blue-50: Light blue background
 * - text-blue-700: Dark blue text
 * - border-l-4: 4px left border
 * - border-blue-700: Dark blue border
 *
 * Inactive state (when isActive = false):
 * - text-gray-700: Dark gray text
 * - hover:bg-gray-50: Light gray background on hover
 *
 * =============================================================
 */
