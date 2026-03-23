import { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface Props {
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Desktop sidebar — always visible */}
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar onLinkClick={() => setMobileMenuOpen(false)} />
        </div>

        {/* Mobile sidebar — slides in from left */}
        <div
          className={`fixed inset-y-0 left-0 z-50 mt-14 transform transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onLinkClick={() => setMobileMenuOpen(false)} />
        </div>

        {/**
         * Backdrop — blurred overlay behind the mobile sidebar.
         *
         * backdrop-blur-sm: blurs the page content behind it
         * bg-black/40: semi-transparent dark tint on top of the blur
         * Both together give a frosted glass effect.
         */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden mt-14 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
