'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatProvider } from '@/context/ChatContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <ChatProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Mobile overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:transform-none transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${!sidebarOpen && 'lg:hidden'}`}>
                    <Sidebar
                        isOpen={sidebarOpen}
                        onToggle={() => setSidebarOpen(!sidebarOpen)}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
                    <header className="flex items-center justify-between px-4 py-3 border-b border-border lg:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                            <HugeiconsIcon icon={Menu01Icon} size={20} />
                        </Button>
                        <span className="font-semibold text-foreground">Hefai</span>
                        <div className="w-10" />
                    </header>

                    {/* Toggle for Desktop when sidebar is closed */}
                    {!sidebarOpen && (
                        <div className="hidden lg:block absolute top-4 left-4 z-50">
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="rounded-xl">
                                <HugeiconsIcon icon={Menu01Icon} size={20} />
                            </Button>
                        </div>
                    )}

                    <main className="flex-1 overflow-hidden relative">
                        {children}
                    </main>
                </div>
            </div>
        </ChatProvider>
    );
}
