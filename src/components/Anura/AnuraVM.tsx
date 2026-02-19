'use client';

import React, { useEffect, useState } from 'react';
import { AnuraAction } from '@/types/plan';
import { AnuraStatus } from '@/hooks/useAnura';

interface AnuraVMProps {
    status?: AnuraStatus;
    actionLog?: AnuraAction[] | string;
    onClose?: () => void;
    onRetry?: () => void;
}

export default function AnuraVM({
    status = 'active',
    actionLog = [],
    onClose,
    onRetry
}: AnuraVMProps) {
    const [iframeKey, setIframeKey] = useState(0);

    // Sync status mapping to display colors
    const isError = status === 'error';
    const isActive = status === 'active';
    const isInitializing = status === 'initializing' || status === 'retrying';

    const statusColor = isError ? '#ef4444' : (isActive ? '#4ade80' : '#3b82f6');
    const statusText = status.toUpperCase();

    // Get the latest action log description or the string passed
    const latestAction = typeof actionLog === 'string'
        ? actionLog
        : (actionLog && actionLog.length > 0 ? actionLog[actionLog.length - 1].description : '');

    // Reset iframe on retry status
    useEffect(() => {
        if (status === 'retrying' || status === 'initializing') {
            setIframeKey(prev => prev + 1);
        }
    }, [status]);

    return (
        <div style={{ background: '#1a1a1a', borderRadius: '8px', margin: '16px 0', overflow: 'hidden', border: '1px solid #2d2d2d' }}>
            {/* Header */}
            <div style={{ background: '#2d2d2d', padding: '10px 16px', color: '#e0e0e0', fontFamily: 'monospace', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🖥️</span>
                    <span>@anura Virtual Machine</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-[#a0a0a0] hover:text-[#e0e0e0] transition-colors text-xs uppercase font-bold tracking-tighter"
                        >
                            [Terminate]
                        </button>
                    )}
                    <span style={{ color: statusColor, fontWeight: 'bold' }}>
                        ● {statusText}
                    </span>
                </div>
            </div>

            {/* Iframe or Error State */}
            {isError ? (
                <div style={{ height: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#ef4444', fontFamily: 'monospace', padding: '20px', gap: '16px', background: '#000' }}>
                    <div style={{ fontSize: '32px' }}>❌</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Anura Connection Failed</div>
                    <div style={{ color: '#a0a0a0', fontSize: '14px', maxWidth: '300px', textAlign: 'center' }}>
                        Maximum retry attempts exceeded. The virtual machine is currently unavailable.
                    </div>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            style={{ background: '#2d2d2d', color: '#eee', padding: '8px 16px', borderRadius: '6px', border: '1px solid #444', cursor: 'pointer' }}
                        >
                            Force Restart
                        </button>
                    )}
                </div>
            ) : (
                <iframe
                    key={iframeKey}
                    src="https://anura.pro"
                    style={{ width: '100%', height: '600px', border: 'none', display: 'block' }}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                />
            )}

            {/* Footer / Action Log */}
            <div style={{ background: '#2d2d2d', padding: '10px 16px', color: '#a0a0a0', fontFamily: 'monospace', fontSize: '13px', borderTop: '1px solid #333' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#e0e0e0', opacity: 0.7 }}>Actions:</span>
                    <span id="cursor-log" style={{ color: '#e0e0e0' }}>{latestAction || 'Awaiting VM readiness...'}</span>
                </div>
            </div>
        </div>
    );
}
