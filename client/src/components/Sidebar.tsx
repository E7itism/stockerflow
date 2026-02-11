/**
 * Sidebar - Navigation menu
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/products', icon: '📦', label: 'Products' },
    { path: '/categories', icon: '📁', label: 'Categories' },
    { path: '/suppliers', icon: '🏢', label: 'Suppliers' },
    { path: '/inventory', icon: '📋', label: 'Inventory' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="py-6 px-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Menu
        </h2>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 w-64 p-4 border-t">
        <div className="text-xs text-gray-500 text-center">
          <p className="font-semibold">STOCKER v1.0</p>
          <p className="mt-1">Inventory Management System</p>
        </div>
      </div>
    </div>
  );
};
