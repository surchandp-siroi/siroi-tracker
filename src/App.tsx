import { useEffect, useState } from 'react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { InitProvider } from '@/components/InitProvider';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import BranchesPage from './pages/BranchesPage';
import OrganigramPage from '@/pages/OrganigramPage';
import EntryPage from '@/pages/EntryPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import ConsultantPayoutsPage from '@/pages/ConsultantPayoutsPage';
import ConsultantApprovalPage from '@/pages/ConsultantApprovalPage';
import OnboardingPage from '@/pages/OnboardingPage';
import CustomerDataEntryPage from '@/pages/CustomerDataEntryPage';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';

import { SessionTimer } from '@/components/SessionTimer';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { requestAppPermissions } from '@/utils/PermissionsHelper';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { MobileWebBlocker } from '@/components/MobileWebBlocker';

export default function App() {
  const [showSplash, setShowSplash] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    requestAppPermissions();
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady().catch(e => console.warn('Notify ready error:', e));
    }
  }, []);

  return (
    <ThemeProvider>
      <InitProvider>
        <MobileWebBlocker />
        {showSplash && <AnimatedSplashScreen onComplete={() => setShowSplash(false)} />}
        <SessionTimer />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/" element={<Navigate to="/" replace />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/customer-data" element={<CustomerDataEntryPage />} />
          <Route path="/entry" element={<EntryPage />} />
          {/* Dashboard routes wrapped in sidebar layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="organigram" element={<OrganigramPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="consultant-approval" element={<ConsultantApprovalPage />} />
            <Route path="consultant-payouts" element={<ConsultantPayoutsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InitProvider>
    </ThemeProvider>
  );
}
