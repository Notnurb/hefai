'use client';

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Conversation } from '@/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    index: number;
    onSelect: (conversationId: string) => void;
    onDelete: (conversationId: string) => void;
}

function ConversationItem({
    conversation,
    isActive,
    index,
    onSelect,
    onDelete,
}: ConversationItemProps) {
    const handleSelect = useCallback(() => {
        onSelect(conversation.id);
    }, [conversation.id, onSelect]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(conversation.id);
    }, [conversation.id, onDelete]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={handleSelect}
            className={cn(
                "group relative flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 mb-0.5",
                isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
        >
            <span className="text-sm font-medium truncate flex-1">
                {conversation.title || "New Chat"}
            </span>

            {/* Actions visible on hover or active */}
            <div className={cn(
                "flex items-center gap-1 opacity-0 transition-opacity duration-200",
                isActive ? "opacity-100" : "group-hover:opacity-100"
            )}>
                <button
                    onClick={handleDelete}
                    className="p-1 rounded-md hover:bg-background/20 text-muted-foreground hover:text-destructive-foreground transition-colors duration-200"
                    aria-label="Delete chat"
                >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                </button>
            </div>
        </motion.div>
    );
}

function areConversationItemPropsEqual(prev: ConversationItemProps, next: ConversationItemProps) {
    return (
        prev.conversation === next.conversation &&
        prev.isActive === next.isActive &&
        prev.index === next.index &&
        prev.onSelect === next.onSelect &&
        prev.onDelete === next.onDelete
    );
}

export default memo(ConversationItem, areConversationItemPropsEqual);
