import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  FolderOpen,
  Truck,
  BarChart3,
  Users,
  Boxes,
  ShoppingCart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  onLinkClick?: () => void;
}

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
  roles?: string[];
}

const allMenuItems: MenuItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/inventory', icon: ClipboardList, label: 'Inventory' },
  { path: '/pos', icon: ShoppingCart, label: 'POS' },
  {
    path: '/categories',
    icon: FolderOpen,
    label: 'Categories',
    roles: ['admin', 'manager'],
  },
  {
    path: '/suppliers',
    icon: Truck,
    label: 'Suppliers',
    roles: ['admin', 'manager'],
  },
  {
    path: '/reports',
    icon: BarChart3,
    label: 'Sales Reports',
    roles: ['admin', 'manager'],
  },
  { path: '/users', icon: Users, label: 'User Management', roles: ['admin'] },
];

export const Sidebar: React.FC<Props> = ({ onLinkClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole, role } = useRole();

  const isActive = (path: string) =>
    path === '/pos'
      ? location.pathname.startsWith('/pos')
      : location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    onLinkClick?.();
  };

  const visibleMenuItems = allMenuItems.filter(
    (item) => !item.roles || hasRole(...(item.roles as string[])),
  );

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">
              StockerFlow
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Inventory System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {/* Green dot on POS link so cashiers can spot it quickly */}
              {item.path === '/pos' && !active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
            {role?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 capitalize">
              {role}
            </p>
            <p className="text-xs text-slate-400">StockerFlow v1.0</p>
          </div>
          <Badge
            variant="outline"
            className="ml-auto text-xs capitalize flex-shrink-0"
          >
            {role}
          </Badge>
        </div>
      </div>
    </div>
  );
};
