import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { LayoutDashboard, Package, Network, GitBranch, Moon, Sun, LogOut, Users, ShieldAlert, Settings, X, CircleDollarSign, CheckSquare, Menu, TrendingUp } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Input } from '@/components/ui';
import { Capacitor } from '@capacitor/core';
import Lottie from 'lottie-react';
import { useEffect } from 'react';

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

// Placeholder Lottie URLs (Replace these with your actual Lottie JSON URLs)
const LOTTIE_URLS: Record<string, string> = {
  Overview: 'https://raw.githubusercontent.com/LottieFiles/lottie-react/master/example/src/animation.json', 
  Products: 'https://raw.githubusercontent.com/LottieFiles/lottie-react/master/example/src/animation.json', 
  Channels: 'https://raw.githubusercontent.com/LottieFiles/lottie-react/master/example/src/animation.json', 
  Branches: 'https://raw.githubusercontent.com/LottieFiles/lottie-react/master/example/src/animation.json', 
  Menu: 'https://raw.githubusercontent.com/LottieFiles/lottie-react/master/example/src/animation.json', 
};

const AnimatedMobileIcon = ({ label, icon: LucideIcon, isActive, isNative }: { label: string, icon: any, isActive: boolean, isNative: boolean }) => {
  const [animationData, setAnimationData] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  const url = LOTTIE_URLS[label];

  useEffect(() => {
    if (!isNative || !url) { 
      setFailed(true); 
      return; 
    }
    fetch(url)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(() => setFailed(true));
  }, [url, isNative]);

  if (failed || !animationData) {
    // Fallback to static Lucide icon if Lottie fails to load or not native
    return <LucideIcon className="w-[clamp(16px,4.5vw,20px)] h-[clamp(16px,4.5vw,20px)]" strokeWidth={2.5} />;
  }

  return (
    <div className="w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] flex items-center justify-center">
      <Lottie 
        animationData={animationData} 
        loop={isActive} 
        autoplay={isActive} 
        style={{ width: '100%', height: '100%' }} 
      />
    </div>
  );
};

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };
  
  const isScrolled = scrollY > 20;
  const isNative = Capacitor.isNativePlatform();

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
      {/* Mobile Top Bar */}
      <div 
        className={`md:hidden fixed left-3 right-3 h-14 rounded-2xl flex items-center px-4 z-40 shadow-xl justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-indigo-600 top-[calc(env(safe-area-inset-top)+16px)] ${
          isScrolled 
            ? '-translate-y-12 opacity-0 pointer-events-none scale-95' 
            : 'translate-y-0 opacity-100 scale-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8">
            <img src="/logo-transparent.svg" alt="Siroi Forex Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <span className="text-[17px] font-semibold tracking-wide text-white uppercase">
            SIROI FOREX
          </span>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[220px] shrink-0 flex flex-col bg-white/95 dark:bg-slate-900/95 border-r border-slate-200 dark:border-white/5 backdrop-blur-xl transform transition-transform duration-200 ease-in-out md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo / Branding */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5 md:block">
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Siroi Forex
            </h1>
            <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-500 font-semibold mt-0.5">
              Admin Terminal
            </p>
          </div>
          <button 
            className="md:hidden p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto mt-2 pb-4">
          {/* Navigation */}
          <nav className="px-3">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 font-bold px-3 mb-2">
            Management
          </p>
          <div className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon, adminOnly }) => {
              const isSuperAdmin = user?.email === 'tomas@siroiforex.com' || user?.email === 'surchanddsingh@siroiforex.com' || user?.email?.toLowerCase() === 'sharjuthoudam@siroiforex.com';
              if (adminOnly && user?.role !== 'admin' && !isSuperAdmin) return null;
              
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/dashboard'}
                  onClick={() => setIsMobileSidebarOpen(false)}
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
        {user?.email?.toLowerCase() === 'sharjuthoudam@siroiforex.com' && (
        <nav className="px-3 mt-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 font-bold px-3 mb-2">
            Finances
          </p>
            <div className="space-y-0.5">
              <NavLink
                to="/dashboard/consultant-approval"
                onClick={() => setIsMobileSidebarOpen(false)}
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
                    <CheckSquare size={16} strokeWidth={isActive ? 2.5 : 2} />
                    Consultant Approval
                  </>
                )}
              </NavLink>
              <NavLink
                to="/dashboard/consultant-payouts"
                onClick={() => setIsMobileSidebarOpen(false)}
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
        )}
        </div>

        {/* Bottom section */}
        <div className="mt-auto px-3 pb-24 md:pb-4 space-y-3">
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
      <main 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          paddingTop: isNative ? 'calc(env(safe-area-inset-top) + 90px)' : '90px',
          maskImage: isNative ? 'linear-gradient(to bottom, transparent 0px, black calc(env(safe-area-inset-top) + 80px), black 100%)' : 'none',
          WebkitMaskImage: isNative ? 'linear-gradient(to bottom, transparent 0px, black calc(env(safe-area-inset-top) + 80px), black 100%)' : 'none'
        }}
      >
        <div className="w-full space-y-5">
          <Outlet />
        </div>
      </main>

      {/* Floating Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg rounded-2xl border border-slate-200/50 dark:border-white/10 p-2 flex items-center justify-around">
          {navItems.slice(0, 4).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setIsMobileSidebarOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-1 sm:p-2 min-w-[50px] flex-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <AnimatedMobileIcon label={label} icon={Icon} isActive={isActive} isNative={isNative} />
                  <span className="text-[clamp(8px,2vw,9px)] font-bold uppercase tracking-wider mt-1 line-clamp-1 text-center">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className={`flex flex-col items-center justify-center p-1 sm:p-2 min-w-[50px] flex-1 rounded-xl transition-all ${
              isMobileSidebarOpen
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <AnimatedMobileIcon label="Menu" icon={Menu} isActive={isMobileSidebarOpen} isNative={isNative} />
            <span className="text-[clamp(8px,2vw,9px)] font-bold uppercase tracking-wider mt-1 line-clamp-1 text-center">Menu</span>
          </button>
        </div>
      </div>

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
