'use client';

import { useState, useCallback, useEffect } from 'react';
import { UserProfile, UserFact, MemoryEntry } from '@/types';

const DEFAULT_USER_ID = 'default';

/**
 * useMemory — Hook for mem0 + SuperMemory integration.
 * Manages conversation memory (mem0) and user profile (SuperMemory).
 */
export function useMemory(userId: string = DEFAULT_USER_ID) {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [recentMemories, setRecentMemories] = useState<MemoryEntry[]>([]);
    const [userContext, setUserContext] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // ─── Load user profile on mount ──────────────────────────────────────────
    useEffect(() => {
        loadUserProfile();
        loadUserContext();
    }, [userId]);

    const loadUserProfile = useCallback(async () => {
        try {
            const res = await fetch(`/api/memory?user_id=${userId}&type=profile`);
            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    setUserProfile(data as UserProfile);
                }
            }
        } catch (e) {
            console.error('Failed to load user profile:', e);
        }
    }, [userId]);

    const loadUserContext = useCallback(async () => {
        try {
            const res = await fetch(`/api/memory?user_id=${userId}&type=context`);
            if (res.ok) {
                const data = await res.json();
                setUserContext(data.context || '');
            }
        } catch (e) {
            console.error('Failed to load user context:', e);
        }
    }, [userId]);

    // ─── Memory operations (mem0) ────────────────────────────────────────────

    const addMemory = useCallback(async (content: string, metadata?: Record<string, any>) => {
        try {
            const res = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', content, user_id: userId, metadata }),
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.error('Failed to add memory:', e);
        }
        return null;
    }, [userId]);

    const searchMemories = useCallback(async (query: string, limit = 5): Promise<MemoryEntry[]> => {
        try {
            const res = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'search', query, user_id: userId, limit }),
            });
            if (res.ok) {
                const data = await res.json();
                const results = data.results || [];
                setRecentMemories(results);
                return results;
            }
        } catch (e) {
            console.error('Failed to search memories:', e);
        }
        return [];
    }, [userId]);

    // ─── User profile operations (SuperMemory) ──────────────────────────────

    const updateUserProfile = useCallback(async (
        name?: string,
        personality?: Record<string, string>,
        preferences?: Record<string, string>,
    ) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'user_profile',
                    user_id: userId,
                    name,
                    personality,
                    preferences,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data.profile);
                await loadUserContext(); // Refresh context
                return data.profile;
            }
        } catch (e) {
            console.error('Failed to update user profile:', e);
        } finally {
            setIsLoading(false);
        }
        return null;
    }, [userId, loadUserContext]);

    const addUserFact = useCallback(async (
        category: string,
        content: string,
        importance = 5,
    ) => {
        try {
            const res = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'user_fact',
                    user_id: userId,
                    category,
                    content,
                    importance,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                await loadUserProfile(); // Refresh profile
                await loadUserContext(); // Refresh context
                return data.fact;
            }
        } catch (e) {
            console.error('Failed to add user fact:', e);
        }
        return null;
    }, [userId, loadUserProfile, loadUserContext]);

    // ─── Auto-extract user info from messages ────────────────────────────────

    const extractAndStoreUserInfo = useCallback(async (message: string, aiResponse: string) => {
        // Simple name detection
        const nameMatch = message.match(/(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        if (nameMatch) {
            const name = nameMatch[1];
            await updateUserProfile(name);
            await addUserFact('name', `User's name is ${name}`, 10);
        }

        // Store significant conversation context as memory
        if (message.length > 20) {
            await addMemory(`User: ${message}\nAI: ${aiResponse.slice(0, 200)}`, {
                type: 'conversation',
                timestamp: new Date().toISOString(),
            });
        }
    }, [updateUserProfile, addUserFact, addMemory]);

    return {
        userProfile,
        recentMemories,
        userContext,
        isLoading,
        addMemory,
        searchMemories,
        updateUserProfile,
        addUserFact,
        loadUserProfile,
        loadUserContext,
        extractAndStoreUserInfo,
    };
}
