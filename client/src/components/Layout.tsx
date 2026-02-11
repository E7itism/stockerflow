/**
 * Layout - Main layout with Navbar, Sidebar, and content area
 */

import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface Props {
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container with Sidebar */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
