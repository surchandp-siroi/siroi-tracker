import { useEffect, useState } from 'react';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
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
import CustomerDataEntryPage from '@/pages/CustomerDataEntryPage';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';

import { SessionTimer } from '@/components/SessionTimer';
import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { requestAppPermissions } from '@/utils/PermissionsHelper';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export default function App() {
  const [showSplash, setShowSplash] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    requestAppPermissions();
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady();
      
      // Self-Hosted OTA Check
      const checkUpdate = async () => {
        try {
          // IMPORTANT: Replace this URL with your actual hosted version.json URL
          const response = await CapacitorHttp.get({ 
            url: 'https://mis.siroiforex.com/version.json?t=' + Date.now() 
          });
          
          if (response.status !== 200) return;
          
          const data = response.data;
          const currentVersion = localStorage.getItem('ota_version') || '1.0.0';
          
          if (data && data.version && data.version !== currentVersion) {
            console.log('New update found:', data.version);
            
            // Download the zip directly from your web host
            const bundle = await CapacitorUpdater.download({
              url: data.url,
              version: data.version,
            });
            
            // Save the new version so we don't redownload it
            localStorage.setItem('ota_version', data.version);
            
            // Apply the update and restart the app
            await CapacitorUpdater.set(bundle);
          }
        } catch (err) {
          console.error('Self-Hosted OTA failed:', err);
        }
      };
      
      checkUpdate();
    }
  }, []);

  return (
    <ThemeProvider>
      <InitProvider>
        {showSplash && <AnimatedSplashScreen onComplete={() => setShowSplash(false)} />}
        <SessionTimer />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/customer-data" element={<CustomerDataEntryPage />} />
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
