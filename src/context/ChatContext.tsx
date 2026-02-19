'use client';

import { createContext, useContext, useMemo } from 'react';
import { useChat as useChatState } from '@/hooks/useChat';

type ChatStore = ReturnType<typeof useChatState>;
type ChatConversationValue = Pick<ChatStore, 'conversations' | 'activeConversation' | 'activeConversationId'>;
type ChatStreamingValue = Pick<
    ChatStore,
    | 'isLoading'
    | 'currentTask'
    | 'currentTaskLabel'
    | 'streamingContent'
    | 'streamingMessageId'
    | 'streamingSearchCount'
    | 'anuraTriggered'
>;
type ChatActionsValue = Pick<
    ChatStore,
    | 'setActiveConversationId'
    | 'sendMessage'
    | 'stopGeneration'
    | 'getTaskLabel'
    | 'createConversation'
    | 'selectConversation'
    | 'deleteConversation'
    | 'dismissAnura'
>;

const ChatConversationContext = createContext<ChatConversationValue | null>(null);
const ChatStreamingContext = createContext<ChatStreamingValue | null>(null);
const ChatActionsContext = createContext<ChatActionsValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const value = useChatState();

    const conversationValue = useMemo(
        () => ({
            conversations: value.conversations,
            activeConversation: value.activeConversation,
            activeConversationId: value.activeConversationId,
        }),
        [value.conversations, value.activeConversation, value.activeConversationId]
    );

    const streamingValue = useMemo(
        () => ({
            isLoading: value.isLoading,
            currentTask: value.currentTask,
            currentTaskLabel: value.currentTaskLabel,
            streamingContent: value.streamingContent,
            streamingMessageId: value.streamingMessageId,
            streamingSearchCount: value.streamingSearchCount,
            anuraTriggered: value.anuraTriggered,
        }),
        [
            value.isLoading,
            value.currentTask,
            value.currentTaskLabel,
            value.streamingContent,
            value.streamingMessageId,
            value.streamingSearchCount,
            value.anuraTriggered,
        ]
    );

    const actionsValue = useMemo(
        () => ({
            setActiveConversationId: value.setActiveConversationId,
            sendMessage: value.sendMessage,
            stopGeneration: value.stopGeneration,
            getTaskLabel: value.getTaskLabel,
            createConversation: value.createConversation,
            selectConversation: value.selectConversation,
            deleteConversation: value.deleteConversation,
            dismissAnura: value.dismissAnura,
        }),
        [
            value.setActiveConversationId,
            value.sendMessage,
            value.stopGeneration,
            value.getTaskLabel,
            value.createConversation,
            value.selectConversation,
            value.deleteConversation,
            value.dismissAnura,
        ]
    );

    return (
        <ChatConversationContext.Provider value={conversationValue}>
            <ChatStreamingContext.Provider value={streamingValue}>
                <ChatActionsContext.Provider value={actionsValue}>
                    {children}
                </ChatActionsContext.Provider>
            </ChatStreamingContext.Provider>
        </ChatConversationContext.Provider>
    );
}

function useRequiredContext<T>(contextValue: T | null, hookName: string): T {
    if (!contextValue) {
        throw new Error(`${hookName} must be used within a ChatProvider`);
    }
    return contextValue;
}

export function useChatConversations() {
    return useRequiredContext(useContext(ChatConversationContext), 'useChatConversations');
}

export function useChatStreaming() {
    return useRequiredContext(useContext(ChatStreamingContext), 'useChatStreaming');
}

export function useChatActions() {
    return useRequiredContext(useContext(ChatActionsContext), 'useChatActions');
}

export function useChat() {
    const conversations = useChatConversations();
    const streaming = useChatStreaming();
    const actions = useChatActions();
    return useMemo(
        () => ({ ...conversations, ...streaming, ...actions }),
        [conversations, streaming, actions]
    );
}
