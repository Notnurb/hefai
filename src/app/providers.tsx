'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
            <AuthProvider>
                <SubscriptionProvider>
                    <TooltipProvider>
                        {children}
                    </TooltipProvider>
                </SubscriptionProvider>
            </AuthProvider>
        </NextThemesProvider>
    );
}
