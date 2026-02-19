'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Plan = 'free' | 'go' | 'builder' | 'plus' | 'max';

interface SubscriptionContextType {
    plan: Plan;
    isSubscribed: boolean;
    toggleSubscription: (plan: Plan) => void;
    showRealAds: boolean;
    setShowRealAds: (show: boolean) => void;
    credits: number;
    addCredits: (amount: number) => void;
    deductCredit: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    // Simplified context - always "pro" effectively, or just no-op
    const isSubscribed = true; // No limits
    const plan = 'max'; // Default to max features

    return (
        <SubscriptionContext.Provider
            value={{
                plan: 'max',
                isSubscribed: true,
                toggleSubscription: () => { },
                showRealAds: false,
                setShowRealAds: () => { },
                credits: 999999, // Infinite credits
                addCredits: () => { },
                deductCredit: () => { },
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    return useContext(SubscriptionContext) || {
        plan: 'max',
        isSubscribed: true,
        toggleSubscription: () => { },
        showRealAds: false,
        setShowRealAds: () => { },
        credits: 999999,
        addCredits: () => { },
        deductCredit: () => { },
    };
}
