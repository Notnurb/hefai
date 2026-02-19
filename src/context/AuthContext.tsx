'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

export interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    bio?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (data: any) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut: clerkSignOut, openSignIn } = useClerk();

    // Transform Clerk user to our app's User interface
    const user: User | null = clerkUser ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || '',
        image: clerkUser.imageUrl,
        // Clerk doesn't have a direct 'bio' field on the user object by default,
        // but we can look it up from publicMetadata if we decided to store it there.
        // For now, we'll leave it undefined to match the interface.
        bio: (clerkUser.publicMetadata as any)?.bio,
    } : null;

    const signIn = async () => {
        openSignIn();
    };

    const signOut = async () => {
        await clerkSignOut();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading: !isLoaded, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
