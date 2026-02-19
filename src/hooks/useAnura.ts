'use client';

import { useState, useCallback, useRef } from 'react';
import { AnuraAction } from '@/types/plan';

export type AnuraStatus = 'idle' | 'initializing' | 'active' | 'error' | 'retrying';

interface UseAnuraReturn {
    isActive: boolean;
    status: AnuraStatus;
    actionLog: AnuraAction[];
    retryCount: number;
    launch: () => void;
    close: () => void;
    retry: () => void;
    logAction: (action: Omit<AnuraAction, 'timestamp'>) => void;
}

const MAX_RETRIES = 2;
const INIT_DELAY_MS = 1500;

export function useAnura(): UseAnuraReturn {
    const [status, setStatus] = useState<AnuraStatus>('idle');
    const [actionLog, setActionLog] = useState<AnuraAction[]>([]);
    const retryCountRef = useRef(0);

    const launch = useCallback(() => {
        retryCountRef.current = 0;
        setStatus('initializing');
        setActionLog([]);

        // Simulate initialization delay (iframe load time)
        setTimeout(() => {
            setStatus('active');
        }, INIT_DELAY_MS);
    }, []);

    const close = useCallback(() => {
        setStatus('idle');
        setActionLog([]);
        retryCountRef.current = 0;
    }, []);

    const retry = useCallback(() => {
        if (retryCountRef.current >= MAX_RETRIES) {
            setStatus('error');
            return;
        }
        retryCountRef.current += 1;
        setStatus('retrying');

        // Wait 3 seconds then re-init
        setTimeout(() => {
            setStatus('initializing');
            setTimeout(() => {
                setStatus('active');
            }, INIT_DELAY_MS);
        }, 3000);
    }, []);

    const logAction = useCallback((action: Omit<AnuraAction, 'timestamp'>) => {
        setActionLog((prev) => [
            ...prev,
            { ...action, timestamp: new Date() },
        ]);
    }, []);

    return {
        isActive: status === 'active' || status === 'initializing',
        status,
        actionLog,
        retryCount: retryCountRef.current,
        launch,
        close,
        retry,
        logAction,
    };
}
