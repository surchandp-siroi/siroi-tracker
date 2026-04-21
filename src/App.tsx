import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { InitProvider } from '@/components/InitProvider';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EntryPage from '@/pages/EntryPage';

export default function App() {
  return (
    <ThemeProvider>
      <InitProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/entry" element={<EntryPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </InitProvider>
    </ThemeProvider>
  );
}
