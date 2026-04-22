import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { LayoutDashboard, Package, Network, GitBranch, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/products', label: 'Products', icon: Package },
  { to: '/dashboard/channels', label: 'Channels', icon: Network },
  { to: '/dashboard/branches', label: 'Branches', icon: GitBranch },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      navigate('/login');
    }
  };

  // Extract display name from email (before @)
  const displayName = user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-[#0b1120]">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col bg-white/60 dark:bg-slate-900/80 border-r border-slate-200 dark:border-white/5 backdrop-blur-xl">
        {/* Logo / Branding */}
        <div className="px-5 pt-6 pb-5">
          <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Siroi Forex
          </h1>
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-500 font-semibold mt-0.5">
            Admin Terminal
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-2">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 font-bold px-3 mb-2">
            Management
          </p>
          <div className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="mt-auto px-3 pb-4 space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/30 rounded-lg p-1 border border-slate-200 dark:border-white/5">
            <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-600 px-2">
              Theme
            </span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20"
            >
              {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-2 py-2">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || displayName}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 object-cover border border-slate-200 dark:border-white/10" 
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {user?.role === 'admin' ? 'Administrator' : 'State Head'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto space-y-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
