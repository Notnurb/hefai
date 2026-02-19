'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatActions, useChatConversations } from '@/context/ChatContext';
import ConversationItem from './ConversationItem';
import UserProfile from '../Layout/UserProfile';
import ThemeToggle from '../Layout/ThemeToggle';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Add01Icon,
    MessageMultiple01Icon,
    Image01Icon,
    Video01Icon,
    SourceCodeIcon,
} from '@hugeicons/core-free-icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const { conversations, activeConversationId } = useChatConversations();
    const { selectConversation, deleteConversation, createConversation } = useChatActions();
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading } = useAuth();
    const isLoaded = !isLoading;
    const isSignedIn = !!user;

    const handleNewChat = useCallback(() => {
        const newId = createConversation();
        router.push(`/chat/${newId}`);
    }, [createConversation, router]);

    const handleSelectConversation = useCallback((conversationId: string) => {
        selectConversation(conversationId);
        router.push(`/chat/${conversationId}`);
    }, [selectConversation, router]);

    const handleDeleteConversation = useCallback((conversationId: string) => {
        deleteConversation(conversationId);
    }, [deleteConversation]);

    const isImagesActive = pathname?.startsWith('/images');
    const isVideosActive = pathname?.startsWith('/videos');
    const isCodeActive = pathname?.startsWith('/code');

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isOpen ? 280 : 0,
                opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-screen flex-shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar"
            role="navigation"
            aria-label="Chat sidebar"
        >
            <div className="flex flex-col h-full w-[280px]">
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
                    <Link href="/chat">
                        <h1 className="text-base font-semibold tracking-tight text-sidebar-foreground hover:opacity-80 transition-opacity cursor-pointer">
                            Hefai
                        </h1>
                    </Link>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNewChat}
                            className="p-2 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors duration-200"
                            aria-label="New chat"
                        >
                            <HugeiconsIcon icon={Add01Icon} size={16} className="text-sidebar-foreground/70" />
                        </motion.button>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="px-2 pt-3 pb-1 space-y-0.5">
                    <Link href="/images" className="block">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isImagesActive
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}>
                            <HugeiconsIcon icon={Image01Icon} size={18} />
                            <span>Images</span>
                        </div>
                    </Link>
                    <Link href="/videos" className="block">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isVideosActive
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}>
                            <HugeiconsIcon icon={Video01Icon} size={18} />
                            <span>Videos</span>
                        </div>
                    </Link>
                    <Link href="/code" className="block">
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isCodeActive
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}>
                            <HugeiconsIcon icon={SourceCodeIcon} size={18} />
                            <span>Code</span>
                        </div>
                    </Link>
                </div>

                {/* Divider */}
                <div className="mx-4 my-1 border-t border-sidebar-border/50" />

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin flex flex-col">
                    {!isLoaded ? null : (isSignedIn || conversations.length > 0) ? (
                        <>
                            <p className="text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-1.5">Chats</p>
                            <AnimatePresence mode="popLayout">
                                {conversations.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm"
                                    >
                                        <HugeiconsIcon icon={MessageMultiple01Icon} size={24} className="mb-2 opacity-40" />
                                        <p className="opacity-60">No conversations yet</p>
                                    </motion.div>
                                ) : (
                                    conversations.map((conv, i) => (
                                        <ConversationItem
                                            key={conv.id}
                                            conversation={conv}
                                            isActive={activeConversationId === conv.id}
                                            index={i}
                                            onSelect={handleSelectConversation}
                                            onDelete={handleDeleteConversation}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col px-4 pt-6">
                            <h3 className="text-sm font-semibold text-sidebar-foreground mb-2">Get responses tailored to you</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Log in to get answers based on saved chats, plus create images and upload files.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isLoaded ? null : isSignedIn ? (
                    <UserProfile />
                ) : (
                    <div className="p-4 border-t border-sidebar-border">
                        <Link href="/login" className="w-full block">
                            <Button className="w-full font-semibold rounded-full text-base h-11" variant="default">
                                Log in
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </motion.aside>
    );
}
