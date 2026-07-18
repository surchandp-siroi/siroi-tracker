import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { InitProvider } from '@/components/InitProvider';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProductsPage from '@/pages/ProductsPage';
import ChannelsPage from '@/pages/ChannelsPage';
import BranchesPage from '@/pages/BranchesPage';
import OrganigramPage from '@/pages/OrganigramPage';
import EntryPage from '@/pages/EntryPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import ConsultantPayoutsPage from '@/pages/ConsultantPayoutsPage';
import ConsultantApprovalPage from '@/pages/ConsultantApprovalPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';

import { SessionTimer } from '@/components/SessionTimer';
export default function App() {
  return (
    <ThemeProvider>
      <InitProvider>
        <SessionTimer />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/entry" element={<EntryPage />} />
          {/* Dashboard routes wrapped in sidebar layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="channels" element={<ChannelsPage />} />
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
