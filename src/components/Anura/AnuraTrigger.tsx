'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnuraTriggerProps {
    /** If true, renders as an inline badge @anura. If false, renders as a confirmation prompt. */
    inline?: boolean;
    /** Called when the user confirms Anura launch from the hard-task prompt. */
    onConfirm?: () => void;
    /** Called when the user declines Anura launch. */
    onDecline?: () => void;
}

/**
 * Renders the @anura trigger badge in a gray-bordered box,
 * or as a confirmation dialog for autonomous hard-task detection.
 */
export default function AnuraTrigger({ inline = true, onConfirm, onDecline }: AnuraTriggerProps) {
    if (inline) {
        return (
            <motion.span
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md border border-[#2d2d2d] bg-[#1a1a1a] text-xs font-mono text-[#a0a0a0] select-none"
                style={{ border: '1px solid #444' }}
            >
                @anura
            </motion.span>
        );
    }

    // Hard-task confirmation prompt
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3 px-5 py-4 my-4 rounded-xl border border-[#2d2d2d] bg-[#1a1a1a]"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
            <div className="flex items-center gap-2 text-sm text-[#e0e0e0]">
                <span className="text-lg">🖥️</span>
                This task requires an <span className="font-mono font-bold text-brand">Anura OS</span> virtual machine.
            </div>
            <div className="text-xs text-[#a0a0a0] leading-relaxed">
                A sandboxed Linux environment will be launched in your browser for safe execution.
            </div>
            <div className="flex items-center gap-3 mt-1">
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition-all active:scale-[0.97]"
                >
                    Launch Anura OS
                </button>
                <button
                    onClick={onDecline}
                    className="px-4 py-2 rounded-lg bg-[#2d2d2d] text-[#a0a0a0] text-sm font-medium hover:bg-[#3d3d3d] hover:text-[#e0e0e0] transition-all"
                >
                    Skip — use standard mode
                </button>
            </div>
        </motion.div>
    );
}
