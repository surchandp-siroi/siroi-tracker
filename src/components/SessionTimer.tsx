import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useSessionStore } from '@/store/useSessionStore';
import { Clock } from 'lucide-react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function SessionTimer() {
  const { user, logout } = useAuthStore();
  const { lastActivity, updateActivity } = useSessionStore();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number>(INACTIVITY_TIMEOUT);

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

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
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
      const remaining = Math.max(0, INACTIVITY_TIMEOUT - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0) {
        window.clearInterval(intervalId);
        await logout();
        navigate('/login', { replace: true });
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [user, lastActivity, logout, navigate]);

  if (!user) return null;

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

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md border text-xs font-medium transition-colors duration-300 ${colorClass}`}>
      <Clock size={14} className={timeLeft < 60000 ? "animate-bounce" : ""} />
      <span>{timeString}</span>
    </div>
  );
}
