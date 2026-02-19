'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Brain02Icon } from '@hugeicons/core-free-icons';

interface MemoryIndicatorProps {
    isActive: boolean;
    memoriesUsed?: number;
    userName?: string;
}

export default function MemoryIndicator({ isActive, memoriesUsed = 0, userName }: MemoryIndicatorProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    if (!isActive && memoriesUsed === 0) return null;

    return (
        <div className="relative inline-flex items-center">
            <motion.button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                >
                    <HugeiconsIcon icon={Brain02Icon} className="w-3 h-3 text-purple-400" />
                </motion.div>
                <span className="text-[10px] text-purple-300">
                    {isActive ? 'Remembering...' : `${memoriesUsed} memories`}
                </span>
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-background border border-white/10 shadow-xl z-50 min-w-[200px]"
                    >
                        <p className="text-[11px] text-foreground/70 mb-1">
                            {userName ? `Hefai remembers you, ${userName}` : 'Hefai remembers...'}
                        </p>
                        <p className="text-[10px] text-foreground/50">
                            {memoriesUsed > 0
                                ? `Using ${memoriesUsed} relevant memor${memoriesUsed === 1 ? 'y' : 'ies'} from past conversations`
                                : 'Memory context will be loaded when available'}
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-background border-r border-b border-white/10" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
