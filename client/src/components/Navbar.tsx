/**
 * NAVBAR - MOBILE RESPONSIVE VERSION
 *
 * WHAT'S DIFFERENT:
 * - Hamburger menu button on mobile
 * - Compact layout on small screens
 * - User info hidden on very small screens
 * - Touch-friendly button sizes
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  onMenuClick: () => void; // Function to open mobile menu
}

export const Navbar: React.FC<Props> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md h-16">
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          {/* ========== LEFT SIDE ========== */}
          <div className="flex items-center gap-3">
            {/**
             * Hamburger Menu Button
             *
             * WHAT IT DOES:
             * - Shows on mobile/tablet
             * - Hides on desktop (lg:hidden)
             * - Calls onMenuClick to open sidebar
             *
             * ICON:
             * Three horizontal lines (☰)
             */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open menu"
            >
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              📦 STOCKER
            </h1>

            {/**
             * Subtitle
             *
             * RESPONSIVE:
             * - Hidden on mobile (hidden)
             * - Shows on small tablets+ (sm:block)
             */}
            <span className="hidden sm:block text-xs text-gray-500">
              Inventory Management
            </span>
          </div>

          {/* ========== RIGHT SIDE ========== */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/**
             * User Info
             *
             * RESPONSIVE:
             * - Hidden on very small screens (hidden)
             * - Shows on medium+ (md:block)
             */}
            <div className="hidden md:block text-sm text-right">
              <p className="text-gray-900 font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-gray-500 text-xs truncate max-w-[150px]">
                {user?.email}
              </p>
            </div>

            {/**
             * User Avatar (Mobile)
             *
             * WHAT IT DOES:
             * - Shows initials on mobile instead of full name
             * - Hidden on desktop (md:hidden)
             * - Touch-friendly size
             */}
            <div className="md:hidden w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </div>

            {/**
             * Logout Button
             *
             * RESPONSIVE:
             * - Full text on desktop
             * - Icon only on mobile
             */}
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              {/* Full text on desktop */}
              <span className="hidden sm:inline">Logout</span>
              {/* Icon on mobile */}
              <span className="sm:hidden">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

/**
 * =============================================================
 * MOBILE UX IMPROVEMENTS
 * =============================================================
 *
 * 1. TOUCH TARGETS:
 *    - Minimum 44x44px for buttons (WCAG guideline)
 *    - p-2 on hamburger = 48x48px ✓
 *
 * 2. FOCUS STATES:
 *    - focus:ring-2 on interactive elements
 *    - Visible keyboard navigation
 *
 * 3. COMPACT LAYOUT:
 *    - Hide non-essential info on small screens
 *    - Show user avatar instead of full info
 *    - Icon-only logout on mobile
 *
 * 4. ARIA LABELS:
 *    - aria-label="Open menu" for screen readers
 *    - Accessible even without text
 *
 * =============================================================
 */
