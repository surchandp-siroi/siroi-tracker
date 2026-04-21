import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { useNavigate, useLocation } from 'react-router-dom';

export function InitProvider({ children }: { children: React.ReactNode }) {
    const { initAuth, user, isInitialized } = useAuthStore();
    const { initSync, unsubscribeSync } = useDataStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        if (isInitialized && user) {
            // Defer data sync so navigation completes first
            timer = setTimeout(() => {
                initSync(user.role, user.branchId);
            }, 50);
        }

        return () => {
            if (timer) clearTimeout(timer);
            unsubscribeSync();
        };
    }, [user, isInitialized, initSync, unsubscribeSync]);

    // Auth Guard
    useEffect(() => {
        if (isInitialized && !user && location.pathname !== '/login') {
            navigate('/login', { replace: true });
        }
    }, [isInitialized, user, location.pathname, navigate]);

    return <>{children}</>;
}
