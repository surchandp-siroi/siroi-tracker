'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { useRouter, usePathname } from 'next/navigation';

export function InitProvider({ children }: { children: React.ReactNode }) {
    const { initAuth, user, isInitialized } = useAuthStore();
    const { initSync, unsubscribeSync } = useDataStore();
    const router = useRouter();
    const pathname = usePathname();

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
        if (isInitialized && !user && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isInitialized, user, pathname, router]);

    return <>{children}</>;
}
