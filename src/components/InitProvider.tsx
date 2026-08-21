import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { initPushNotifications } from '@/utils/PushNotificationsHelper';

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
            // Register push notifications
            initPushNotifications(user.id, user.email);

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
        if (isInitialized && !user && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/onboarding' && location.pathname !== '/onboarding/' && location.pathname !== '/customer-data') {
            navigate(Capacitor.isNativePlatform() ? '/' : '/login', { replace: true });
        }
    }, [isInitialized, user, location.pathname, navigate]);

    return <>{children}</>;
}
