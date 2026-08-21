import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { LayoutDashboard, Package, Network, GitBranch, Moon, Sun, LogOut, Users, ShieldAlert, Settings, X, CircleDollarSign, CheckSquare, Menu, TrendingUp, RefreshCw, MapPin, Sparkles, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Input } from '@/components/ui';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Geolocation } from '@capacitor/geolocation';
import { LogoIcon } from '@/components/LogoIcon';
import { useEffect } from 'react';

const AVATAR_OPTIONS = [
  'Aneka', 'Surchand', 'Tomas', 'Elena', 'Raj', 
  'Sarah', 'David', 'Maya', 'Leo', 'Zoe',
  'Kofi', 'Chloe', 'Amir', 'Nina', 'Marcus', 'Priya'
];

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/products', label: 'Products', icon: Package },
  { to: '/dashboard/channels', label: 'Channels', icon: Network },
  { to: '/dashboard/branches', label: 'Branches', icon: GitBranch },
  { to: '/dashboard/organigram', label: 'Organigram', icon: Users, adminOnly: true },
  { to: '/dashboard/audit', label: 'Audit Logs', icon: ShieldAlert, adminOnly: true },
];

const AnimatedMobileIcon = ({ icon: LucideIcon, isActive }: { label?: string, icon: any, isActive: boolean, isNative?: boolean }) => {
  return (
    <div className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100 opacity-70'}`}>
      <LucideIcon className="w-[clamp(18px,4.8vw,22px)] h-[clamp(18px,4.8vw,22px)]" strokeWidth={isActive ? 2.5 : 2} />
    </div>
  );
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileModal, setProfileModal] = useState<{
      isOpen: boolean;
      displayName: string;
      avatarSeed: string;
  } | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'latest' | 'downloading' | 'ready' | 'error'>('idle');
  const [currentVersion, setCurrentVersion] = useState<string>('1.1.6');
  const [latestVersion, setLatestVersion] = useState<string>('1.1.6');
  const [updateUrl, setUpdateUrl] = useState<string>('');
  const [updateProgressText, setUpdateProgressText] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{
    city?: string;
    state?: string;
    coords?: string;
    loading: boolean;
    error?: string;
  }>({ loading: false });
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
      navigate(isNative ? '/' : '/login');
    }
  };

  // Load current local version
  useEffect(() => {
    const saved = localStorage.getItem('ota_version');
    if (saved) {
      setCurrentVersion(saved);
    }
  }, []);

  const fetchUserLocation = async () => {
    setUserLocation({ loading: true });
    try {
      if (!Capacitor.isNativePlatform()) {
        setUserLocation({
          city: 'Web Browser',
          state: 'Local Dev',
          coords: '24.8170°, 93.9368°',
          loading: false
        });
        return;
      }

      const position = await Geolocation.getCurrentPosition({
        timeout: 8000,
        enableHighAccuracy: true
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const coords = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: { 'Accept-Language': 'en' }
        });
        if (response.ok) {
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || data.address?.county || 'Current Location';
          const state = data.address?.state || '';
          setUserLocation({ city, state, coords, loading: false });
        } else {
          setUserLocation({ coords, loading: false });
        }
      } catch {
        setUserLocation({ coords, loading: false });
      }
    } catch (err: any) {
      setUserLocation({
        loading: false,
        error: err?.message || 'Location permission not granted'
      });
    }
  };

  const handleUpdateApp = async () => {
    setIsMobileSidebarOpen(false);
    setShowUpdateModal(true);
    setUpdateStatus('checking');
    setUpdateProgressText('Checking server for updates...');

    // Fetch location in parallel
    fetchUserLocation();

    try {
      const response = await CapacitorHttp.get({
        url: 'https://mis.siroiforex.com/dist/version.json?t=' + Date.now()
      });

      if (response.status !== 200 || !response.data?.version) {
        throw new Error('Could not retrieve update details from server.');
      }

      const data = response.data;
      const serverVer = data.version;
      const storedVer = localStorage.getItem('ota_version') || '1.1.6';
      
      setLatestVersion(serverVer);
      setCurrentVersion(storedVer);
      setUpdateUrl(data.url || 'https://mis.siroiforex.com/dist/update.zip');

      if (serverVer !== storedVer) {
        setUpdateStatus('available');
        setUpdateProgressText(`New version ${serverVer} is available!`);
      } else {
        setUpdateStatus('latest');
        setUpdateProgressText('Your application is completely up to date.');
      }
    } catch (err: any) {
      console.error('Update check failed:', err);
      setUpdateStatus('error');
      setUpdateProgressText(err?.message || 'Unable to connect to update server.');
    }
  };

  const handlePerformUpdate = async () => {
    if (!updateUrl || !latestVersion) return;
    
    setUpdateStatus('downloading');
    setUpdateProgressText(`Downloading v${latestVersion} update package...`);

    try {
      // 1. Download zip
      const bundle = await CapacitorUpdater.download({
        url: updateUrl,
        version: latestVersion,
      });

      // 2. Set bundle & save version
      setUpdateStatus('ready');
      setUpdateProgressText(`Installing version ${latestVersion}...`);
      localStorage.setItem('ota_version', latestVersion);
      setCurrentVersion(latestVersion);

      await new Promise(r => setTimeout(r, 1000));
      await CapacitorUpdater.set(bundle);

      setUpdateProgressText('Update ready! Refreshing app...');
      await new Promise(r => setTimeout(r, 1200));

      // Reload app
      window.location.reload();
    } catch (error: any) {
      console.error('Update download/install error:', error);
      setUpdateStatus('error');
      setUpdateProgressText(error?.message || 'Update failed. Please try again.');
    }
  };

  // Extract display name from email (before @)
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarSeed = user?.avatarSeed || user?.email?.split('@')[0] || displayName;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19]">
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
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] shrink-0 flex flex-col bg-white/85 dark:bg-slate-900/85 border-r border-slate-200/80 dark:border-white/5 backdrop-blur-2xl shadow-xl md:shadow-none transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo / Branding Header */}
        <div 
          className="flex items-center justify-between px-6 pb-5 border-b border-slate-100 dark:border-white/5 pt-[calc(env(safe-area-inset-top,0px)+24px)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-600 dark:to-indigo-900 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-base ring-1 ring-white/20 shrink-0">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                  Siroi Forex
                </h1>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-bold mt-1">
                Admin Terminal
              </p>
            </div>
          </div>
          <button 
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 font-extrabold px-3 mb-2.5">
              Core Platform
            </p>
            <nav className="space-y-1">
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
                      `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                          : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 active:scale-[0.98]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'} />
                          <span>{label}</span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Finances section */}
          {user?.email?.toLowerCase() === 'sharjuthoudam@siroiforex.com' && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 font-extrabold px-3 mb-2.5">
                Financial Operations
              </p>
              <nav className="space-y-1">
                <NavLink
                  to="/dashboard/consultant-approval"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                        : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 active:scale-[0.98]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <CheckSquare size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'} />
                        <span>Consultant Approval</span>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/dashboard/consultant-payouts"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                        : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 active:scale-[0.98]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <CircleDollarSign size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'} />
                        <span>Consultant Payouts</span>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                    </>
                  )}
                </NavLink>
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div 
          className="mt-auto px-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3 bg-slate-50/50 dark:bg-black/20 pb-[calc(env(safe-area-inset-bottom,0px)+120px)] md:pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
        >
          {/* Theme Toggle (Light / Dark) */}
          <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-800/80 rounded-xl p-2 border border-slate-200/80 dark:border-white/5 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 px-1">
              Theme Mode
            </span>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-black/40 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Light Mode"
              >
                <Sun size={13} className={theme === 'light' ? 'text-amber-500' : ''} />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Dark Mode"
              >
                <Moon size={13} className={theme === 'dark' ? 'text-indigo-200' : ''} />
                Dark
              </button>
            </div>
          </div>

          {/* User Profile Card with Animated Dropdown Menu */}
          <DropdownMenuTrigger className="w-full">
            <div className="w-full flex items-center gap-3 p-2 bg-white/90 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-xs cursor-pointer transition-all duration-200 select-none group">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`} 
                alt="Avatar" 
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 object-cover ring-2 ring-indigo-500/20 group-hover:scale-105 transition-transform" 
              />
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Super Admin' : 'State Head'}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="p-1 rounded-lg text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <Settings size={14} />
                </div>
              </div>
            </div>

            <DropdownMenu align="end" className="w-56 mb-2 bottom-full top-auto origin-bottom-left">
              <DropdownMenuItem onClick={() => {
                if (user?.role === 'admin') {
                  setProfileModal({
                    isOpen: true,
                    displayName: user.displayName || user.email.split('@')[0],
                    avatarSeed: user.avatarSeed || user.email.split('@')[0]
                  });
                }
              }}>
                <Users className="w-3.5 h-3.5" />
                Profile: {displayName}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                <CircleDollarSign className="w-3.5 h-3.5" />
                Executive Command Center
              </DropdownMenuItem>

              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => {
                  setProfileModal({
                    isOpen: true,
                    displayName: user.displayName || user.email.split('@')[0],
                    avatarSeed: user.avatarSeed || user.email.split('@')[0]
                  });
                }}>
                  <Settings className="w-3.5 h-3.5" />
                  Settings & Avatar
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {isNative && (
                <>
                  <DropdownMenuItem onClick={handleUpdateApp} disabled={updateStatus === 'checking' || updateStatus === 'downloading'}>
                    <RefreshCw className={`w-3.5 h-3.5 ${updateStatus === 'checking' || updateStatus === 'downloading' ? 'animate-spin' : ''}`} />
                    {updateStatus === 'checking' ? 'Checking...' : updateStatus === 'downloading' ? 'Updating...' : 'Update App'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </DropdownMenuItem>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </div>
      </aside>

      <main 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 pt-[90px] md:p-8 md:pt-6 pb-24 md:pb-8" 
        style={isNative ? { 
          WebkitOverflowScrolling: 'touch',
          paddingTop: 'calc(env(safe-area-inset-top) + 90px)'
        } : {
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="w-full max-w-[1680px] mx-auto space-y-6">
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

      {/* Enhanced OTA Update Modal Overlay */}
      {showUpdateModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => {
            // Dismiss modal when user touches outside the card
            if (updateStatus !== 'downloading' && updateStatus !== 'ready') {
              setShowUpdateModal(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent touches inside from closing
          >
            {/* Close X Button (Disabled during active installation) */}
            {updateStatus !== 'downloading' && updateStatus !== 'ready' && (
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Header / Title */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-600 dark:to-indigo-800 shadow-md shadow-indigo-500/25 flex items-center justify-center shrink-0 ring-1 ring-white/20 p-2.5">
                <LogoIcon className="w-full h-full text-white" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  System Updates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Siroi Forex Over-The-Air Service
                </p>
              </div>
            </div>

            {/* Location Info Pill */}
            <div className="mb-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                    Detected Location
                  </p>
                  {userLocation.loading ? (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Detecting GPS location...
                    </p>
                  ) : userLocation.error ? (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate mt-0.5">
                      {userLocation.error}
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {userLocation.city ? `${userLocation.city}${userLocation.state ? `, ${userLocation.state}` : ''}` : userLocation.coords || 'Location Detected'}
                    </p>
                  )}
                </div>
              </div>
              {userLocation.coords && !userLocation.loading && (
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                  {userLocation.coords}
                </span>
              )}
            </div>

            {/* Version Comparison Card */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Installed
                </span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                  v{currentVersion}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {updateStatus === 'available' && (
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                    New
                  </span>
                )}
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Latest Server
                </span>
                <span className={`text-sm font-black ${updateStatus === 'available' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  v{latestVersion}
                </span>
              </div>
            </div>

            {/* Status Message */}
            <div className="mb-6 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 text-center">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {updateProgressText}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              {updateStatus === 'available' && (
                <button
                  onClick={handlePerformUpdate}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Update to v{latestVersion} Now</span>
                </button>
              )}

              {updateStatus === 'downloading' && (
                <div className="w-full py-3.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center gap-3">
                  <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Downloading & Applying Update...
                  </span>
                </div>
              )}

              {updateStatus === 'ready' && (
                <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Update Complete! Reloading...
                  </span>
                </div>
              )}

              {updateStatus === 'latest' && (
                <button
                  onClick={handleUpdateApp}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.99] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Again</span>
                </button>
              )}

              {updateStatus === 'error' && (
                <button
                  onClick={handleUpdateApp}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Update Check</span>
                </button>
              )}

              {updateStatus !== 'downloading' && updateStatus !== 'ready' && (
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
