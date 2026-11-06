import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useSessionStore } from '@/store/useSessionStore';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';

const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const RESTRICTED_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function SessionTimer() {
  const { user, logout } = useAuthStore();
  const { lastActivity, updateActivity } = useSessionStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const timeoutMs = user?.email === 'sharjuthoudam@siroiforex.com' ? RESTRICTED_TIMEOUT : DEFAULT_TIMEOUT;
  const [timeLeft, setTimeLeft] = useState<number>(timeoutMs);

  // Handle user activity events with throttling (max once per second)
  useEffect(() => {
    if (!user) return;

    let throttleTimeout: number | null = null;

    const handleActivity = () => {
      if (!throttleTimeout) {
        updateActivity();
        throttleTimeout = window.setTimeout(() => {
          throttleTimeout = null;
        }, 1000);
      }
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'input', 'change', 'focus'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (throttleTimeout) window.clearTimeout(throttleTimeout);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, updateActivity]);

  // Tick timer every second
  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(async () => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      const remaining = Math.max(0, timeoutMs - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0) {
        window.clearInterval(intervalId);
        await logout();
        navigate('/', { replace: true });
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [user, lastActivity, logout, navigate, timeoutMs]);

  const isAuthPage = ['/', '/login', '/onboarding'].includes(location.pathname);
  if (!user || isAuthPage) return null;

  // Formatting time (MM:SS)
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Subtle styling depending on time left (turns amber/red when low)
  let colorClass = "text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-black/30 border-slate-200 dark:border-white/5";
  if (timeLeft < 60000) { // last minute
    colorClass = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 font-bold animate-pulse";
  } else if (timeLeft < 300000) { // last 5 minutes
    colorClass = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
  }

  const showWarningModal = timeLeft > 0 && timeLeft <= 120000; // last 2 minutes warning

  return (
    <>
      <div 
        onClick={() => updateActivity()}
        title="Session active. Click to refresh timer."
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md border text-xs font-medium cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 ${colorClass}`}
      >
        <Clock size={14} className={timeLeft < 60000 ? "animate-bounce" : ""} />
        <span>{timeString}</span>
      </div>

      {showWarningModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-amber-300 dark:border-amber-600/50">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Session Expiring Soon
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Your session will expire in <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">{timeString}</span> due to inactivity. Click below to continue working without losing your entered data.
            </p>
            <Button
              onClick={() => updateActivity()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Stay Logged In
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
