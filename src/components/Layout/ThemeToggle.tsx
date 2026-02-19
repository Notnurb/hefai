'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun03Icon, Moon02Icon } from '@hugeicons/core-free-icons';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-9 h-9" />;
    }

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative p-2 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground transition-all duration-200 overflow-hidden"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={isDark ? 'dark' : 'light'}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                >
                    {isDark ? (
                        <HugeiconsIcon icon={Moon02Icon} size={16} />
                    ) : (
                        <HugeiconsIcon icon={Sun03Icon} size={16} />
                    )}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}
