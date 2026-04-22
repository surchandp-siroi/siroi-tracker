import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { InitProvider } from '@/components/InitProvider';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage';
import ChannelsPage from '@/pages/ChannelsPage';
import BranchesPage from '@/pages/BranchesPage';
import OrganigramPage from '@/pages/OrganigramPage';
import EntryPage from '@/pages/EntryPage';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function SessionTimeoutHandler() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    let timeoutId: number;

    const resetTimeout = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });

    // Initialize timeout
    resetTimeout();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [user, logout, navigate]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <InitProvider>
        <SessionTimeoutHandler />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/entry" element={<EntryPage />} />
          {/* Dashboard routes wrapped in sidebar layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="channels" element={<ChannelsPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="organigram" element={<OrganigramPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </InitProvider>
    </ThemeProvider>
  );
}
