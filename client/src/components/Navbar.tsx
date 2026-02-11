/**
 * Navbar - Top bar with logo, user info, and logout
 * (Navigation links moved to Sidebar)
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
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
          {/* Left side - Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">📦 STOCKER</h1>
            <span className="ml-3 text-xs text-gray-500 hidden sm:block">
              Inventory Management System
            </span>
          </div>

          {/* Right side - User info and Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-right">
              <p className="text-gray-900 font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-gray-500 text-xs">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
