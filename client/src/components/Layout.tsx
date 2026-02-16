/**
 * LAYOUT - MOBILE RESPONSIVE VERSION
 *
 * WHAT'S DIFFERENT:
 * - Sidebar hidden on mobile, shown on desktop
 * - Hamburger menu button on mobile
 * - Sidebar slides in/out on mobile
 * - Touch-friendly close button
 * - Proper spacing for all screen sizes
 *
 * HOW IT WORKS:
 * - Mobile: Hamburger button → Sidebar slides over content
 * - Desktop: Sidebar always visible on left
 */

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface Props {
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ children }) => {
  /**
   * Mobile Sidebar State
   *
   * WHAT IT DOES:
   * Controls whether sidebar is open on mobile
   *
   * Desktop: Always shown (this state ignored)
   * Mobile: Opens when hamburger clicked
   */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * Toggle Mobile Menu
   */
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  /**
   * Close Mobile Menu
   * Called when user clicks outside or on a link
   */
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== NAVBAR (Top bar) ========== */}
      <Navbar onMenuClick={toggleMobileMenu} />

      {/* ========== MAIN CONTAINER ========== */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* ========== SIDEBAR ========== */}

        {/**
         * Desktop Sidebar (hidden on mobile)
         *
         * CLASSES:
         * - hidden: Hide on mobile
         * - lg:block: Show on large screens (1024px+)
         */}
        <div className="hidden lg:block">
          <Sidebar onLinkClick={closeMobileMenu} />
        </div>

        {/**
         * Mobile Sidebar (slides in from left)
         *
         * CLASSES:
         * - fixed: Positioned over content
         * - inset-y-0: Full height
         * - left-0: Aligned to left
         * - z-50: Above everything
         * - transform: Enable animations
         * - -translate-x-full: Start off-screen (hidden)
         * - translate-x-0: Slide in (visible)
         * - transition-transform: Smooth animation
         * - lg:hidden: Hide on desktop
         *
         * HOW ANIMATION WORKS:
         * mobileMenuOpen = false → -translate-x-full (off-screen)
         * mobileMenuOpen = true → translate-x-0 (on-screen)
         */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out lg:hidden mt-16`}
        >
          <Sidebar onLinkClick={closeMobileMenu} />
        </div>

        {/**
         * Mobile Backdrop (dark overlay)
         *
         * WHAT IT DOES:
         * - Shows dark overlay when sidebar is open
         * - Clicking it closes the sidebar
         * - Only on mobile
         *
         * CLASSES:
         * - fixed inset-0: Covers entire screen
         * - bg-black bg-opacity-50: Semi-transparent black
         * - z-40: Below sidebar (z-50) but above content
         */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden mt-16"
            onClick={closeMobileMenu}
          />
        )}

        {/* ========== MAIN CONTENT AREA ========== */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

/**
 * =============================================================
 * RESPONSIVE BREAKPOINTS (Tailwind)
 * =============================================================
 *
 * sm: 640px   (Small tablets)
 * md: 768px   (Tablets)
 * lg: 1024px  (Laptops)
 * xl: 1280px  (Desktops)
 *
 * EXAMPLES:
 * - hidden lg:block  = Hide on mobile, show on laptop+
 * - text-sm md:text-base = Small text on mobile, normal on tablet+
 * - px-4 lg:px-8 = 16px padding on mobile, 32px on laptop+
 *
 * =============================================================
 */
