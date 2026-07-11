import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { LayoutDashboard, Package, Network, GitBranch, Moon, Sun, LogOut, Users, ShieldAlert, Settings, X, CircleDollarSign } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Input } from '@/components/ui';

const AVATAR_OPTIONS = [
  'Aneka', 'Surchand', 'Tomas', 'Elena', 'Raj', 
  'Sarah', 'David', 'Maya', 'Leo', 'Zoe',
  'Kofi', 'Chloe', 'Amir', 'Nina', 'Marcus', 'Priya'
];

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/products', label: 'Products', icon: Package },
  { to: '/dashboard/channels', label: 'Channels', icon: Network },
  { to: '/dashboard/branches', label: 'Branches', icon: GitBranch },
  { to: '/dashboard/organigram', label: 'Organigram', icon: Users, adminOnly: true },
  { to: '/dashboard/audit', label: 'Audit Logs', icon: ShieldAlert, adminOnly: true },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileModal, setProfileModal] = useState<{
      isOpen: boolean;
      displayName: string;
      avatarSeed: string;
  } | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

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
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarSeed = user?.avatarSeed || user?.email?.split('@')[0] || displayName;
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
            {navItems.map(({ to, label, icon: Icon, adminOnly }) => {
              const isSuperAdmin = user?.email === 'tomas@siroiforex.com' || user?.email === 'surchanddsingh@siroiforex.com';
              if (adminOnly && user?.role !== 'admin' && !isSuperAdmin) return null;
              
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
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
              );
            })}
          </div>
        </nav>

        {/* Finances section */}
        <nav className="px-3 mt-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 font-bold px-3 mb-2">
            Finances
          </p>
            <div className="space-y-0.5">
              <NavLink
                to="/dashboard/consultant-payouts"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <CircleDollarSign size={16} strokeWidth={isActive ? 2.5 : 2} />
                    Consultant Payouts
                  </>
                )}
              </NavLink>
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
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 object-cover border border-slate-200 dark:border-white/10" 
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight break-words" title={displayName}>
                {displayName.length > 30 ? displayName.slice(0, 30) + '...' : displayName}
              </p>
              {user?.role !== 'admin' && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  State Head
                </p>
              )}
            </div>
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setProfileModal({
                    isOpen: true,
                    displayName: user.displayName || user.email.split('@')[0],
                    avatarSeed: user.avatarSeed || user.email.split('@')[0]
                  });
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="Edit Profile Settings"
              >
                <Settings size={14} />
              </button>
            )}
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

      {profileModal && profileModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                              Edit Admin Profile
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Update your display name and custom avatar.
                          </p>
                      </div>
                      <button 
                          onClick={() => setProfileModal(null)}
                          className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Avatar Preview */}
                  <div className="flex flex-col items-center justify-center gap-2 mb-6">
                      <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-2.5 rounded-full border border-indigo-500/20 shadow-inner">
                          <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileModal.avatarSeed || 'admin'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                              alt="Avatar Preview"
                              className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-white/10"
                          />
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Avatar Preview</span>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Display Name</label>
                          <Input 
                              type="text"
                              value={profileModal.displayName}
                              onChange={(e) => setProfileModal(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                              className="h-9 w-full px-3 py-2 text-sm font-semibold bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter display name"
                          />
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Select Avatar</label>
                          <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 rounded-xl max-h-[160px] overflow-y-auto">
                              {AVATAR_OPTIONS.map((seed) => {
                                  const isSelected = profileModal.avatarSeed === seed;
                                  return (
                                      <button
                                          key={seed}
                                          type="button"
                                          onClick={() => setProfileModal(prev => prev ? { ...prev, avatarSeed: seed } : null)}
                                          className={`p-1 rounded-lg border-2 transition-all flex items-center justify-center bg-white dark:bg-slate-900 ${
                                              isSelected 
                                              ? 'border-indigo-600 dark:border-indigo-500 scale-105 shadow-md' 
                                              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                                          }`}
                                      >
                                          <img 
                                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                                              alt={seed}
                                              className="w-10 h-10 rounded-full"
                                          />
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                      <button 
                          onClick={() => setProfileModal(null)}
                          className="flex-1 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={async () => {
                              if (!profileModal.displayName.trim()) {
                                  alert('Display name cannot be empty');
                                  return;
                              }
                              setUpdatingProfile(true);
                              const success = await useAuthStore.getState().updateProfile(
                                  profileModal.displayName.trim(),
                                  profileModal.avatarSeed.trim()
                              );
                              setUpdatingProfile(false);
                              if (success) {
                                  setProfileModal(null);
                                  alert('Profile updated successfully!');
                              } else {
                                  alert('Failed to update profile. Please try again.');
                              }
                          }}
                          disabled={updatingProfile}
                          className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
                      >
                          {updatingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
