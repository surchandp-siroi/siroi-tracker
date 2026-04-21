'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, Building2, Workflow, LogOut, TrendingUp, Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';

function ThemeToggle() {
    const { theme } = useTheme();
    return (
        <button 
            disabled
            className="flex items-center gap-2 px-2 py-1 rounded bg-black/10 dark:bg-white/10 opacity-50 cursor-not-allowed transition-colors"
        >
            <Moon size={14} className="text-indigo-300" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{theme}</span>
        </button>
    );
}

const sidebarLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/channels', label: 'Channels', icon: Workflow },
  { href: '/dashboard/branches', label: 'Branches', icon: Building2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden flex lg:p-6 lg:gap-6">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-4 rounded-none border-t-0 border-l-0 border-r-0">
          <div className="flex items-center gap-2 font-bold text-lg dark:text-white text-slate-900">
             <TrendingUp className="text-emerald-400" /> SIROI FOREX
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white">
              {mobileMenuOpen ? <X /> : <Menu />}
          </button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 glass flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0 mt-16 rounded-none border-t-0 border-l-0 border-b-0" : "-translate-x-full lg:translate-x-0 lg:mt-0",
          "h-full lg:h-auto"
      )}>
        <div className="space-y-8 p-6">
            <div className="hidden lg:block mb-8">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">SIROI FOREX</h1>
                <p className="text-xs dark:text-slate-400 text-slate-500 uppercase tracking-widest">Admin Terminal</p>
            </div>
          
            <nav className="space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2">Management</p>
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                        <Link 
                            key={link.href} 
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg border border-transparent",
                            isActive 
                                ? "active-tab text-slate-900 dark:text-white font-medium" 
                                : "text-slate-500 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <Icon size={18} />
                            {link.label}
                        </Link>
                        )
                    })}
                </div>
            </nav>
        </div>

        <div className="p-3 m-3 glass flex flex-col gap-3">
             <div className="flex items-center justify-between w-full pb-3 border-b border-slate-900/10 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Theme</span>
                <ThemeToggle />
             </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        OP
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-medium truncate text-slate-900 dark:text-white">{user.email.split('@')[0]}</p>
                        <p className="text-[10px] text-slate-500">Administrator</p>
                    </div>
                </div>
                <button 
                    onClick={() => { logout(); router.push('/login'); }}
                    className="p-2 rounded-md text-slate-500 hover:bg-slate-900/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Logout"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col gap-6 pt-16 lg:pt-0 h-screen lg:h-auto overflow-y-auto">
         {children}
      </main>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
          <div 
             className="fixed inset-0 bg-black/50 z-30 lg:hidden top-16"
             onClick={() => setMobileMenuOpen(false)}
          />
      )}
    </div>
  );
}
