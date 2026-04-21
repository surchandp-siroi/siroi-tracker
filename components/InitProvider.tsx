'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';

export function InitProvider({ children }: { children: React.ReactNode }) {
    const { initAuth, user, isInitialized } = useAuthStore();
    const { initSync, unsubscribeSync } = useDataStore();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    useEffect(() => {
        if (isInitialized && user) {
            initSync(user.role, user.branchId);
        } else {
            unsubscribeSync();
        }
        return () => {
            unsubscribeSync();
        };
    }, [user, isInitialized, initSync, unsubscribeSync]);

    return <>{children}</>;
}
