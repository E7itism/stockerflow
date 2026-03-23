import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';

interface Props {
  onMenuClick: () => void;
}

export const Navbar: React.FC<Props> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 h-14 flex-shrink-0">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">
          {/* User info — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 leading-none">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">
                {user?.email}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </div>
          </div>

          {/* Avatar — mobile */}
          <div className="md:hidden w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
