'use client';

import { useEffect } from 'react';
import { useChatActions, useChatConversations } from '@/context/ChatContext';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
    const { conversations } = useChatConversations();
    const { createConversation } = useChatActions();
    const router = useRouter();

    // On the root /chat page, either redirect to most recent or create new
    useEffect(() => {
        // Wait for hydration/initial load
        if (conversations.length > 0) {
            const lastId = conversations[0].id;
            router.replace(`/chat/${lastId}`);
        } else {
            // No conversations? Create one
            const newId = createConversation();
            router.replace(`/chat/${newId}`);
        }
    }, [conversations, createConversation, router]);

    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse">Initializing Hefai...</p>
            </div>
        </div>
    );
}
