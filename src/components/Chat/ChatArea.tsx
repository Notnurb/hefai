'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Message } from '@/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { MessageMultiple01Icon } from '@hugeicons/core-free-icons';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import AnimatedCounter from '@/components/ui/animated-counter';

interface ChatAreaProps {
    messages: Message[];
    isStreaming: boolean;
    taskLabel: string;
    streamingContent: string;
    streamingMessageId: string | null;
    streamingSearchCount?: number;
    selectedModel: string;
}

export default function ChatArea({
    messages,
    isStreaming,
    taskLabel,
    streamingContent,
    streamingMessageId,
    streamingSearchCount,
    selectedModel,
}: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollFrameRef = useRef<number | null>(null);
    const lastStreamScrollRef = useRef(0);

    const renderedMessages = useMemo(
        () =>
            messages.map((msg) => (
                <MessageBubble
                    key={msg.id}
                    message={msg}
                />
            )),
        [messages]
    );

    const streamingMessage = useMemo(
        () => ({
            id: streamingMessageId || 'streaming',
            role: 'assistant' as const,
            content: '',
            timestamp: new Date(),
            model: selectedModel,
        }),
        [streamingMessageId, selectedModel]
    );

    // Auto-scroll to bottom on new messages or streaming content
    useEffect(() => {
        if (!bottomRef.current) return;

        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (isStreaming && now - lastStreamScrollRef.current < 80) {
            return;
        }

        if (isStreaming) {
            lastStreamScrollRef.current = now;
        }

        if (scrollFrameRef.current !== null) {
            cancelAnimationFrame(scrollFrameRef.current);
        }

        scrollFrameRef.current = requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
            scrollFrameRef.current = null;
        });

        return () => {
            if (scrollFrameRef.current !== null) {
                cancelAnimationFrame(scrollFrameRef.current);
                scrollFrameRef.current = null;
            }
        };
    }, [messages.length, isStreaming, streamingContent]);

    return (
        <div className="flex-1 overflow-hidden relative flex flex-col">
            {messages.length === 0 && !isStreaming ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6">
                        <HugeiconsIcon icon={MessageMultiple01Icon} size={32} className="text-muted-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 tracking-tight">How can I help you today?</h1>
                    <p className="text-muted-foreground max-w-md text-lg">
                        I can help you analyze documents, write code, or just chat.
                        Try asking me anything!
                    </p>
                </div>
            ) : (
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-4 md:px-8 py-4 scroll-smooth"
                >
                    <div className="max-w-3xl mx-auto flex flex-col pb-4">
                        {renderedMessages}

                        {/* Live streaming bubble — shown while AI is generating */}
                        {isStreaming && streamingContent && (
                            <MessageBubble
                                key="streaming"
                                message={streamingMessage}
                                isStreaming={true}
                                streamingContent={streamingContent}
                                searchCount={streamingSearchCount}
                            />
                        )}

                        {/* Shimmer indicator — shown while waiting for first token */}
                        {isStreaming && taskLabel && !streamingContent && (
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-semibold text-foreground/70">AI</span>
                                </div>
                                <TextShimmerWave className="font-mono text-sm" duration={1}>
                                    {taskLabel}
                                </TextShimmerWave>
                                {typeof streamingSearchCount === 'number' && (
                                    <div className="flex items-center gap-2 ml-2 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                                        <span className="text-[10px] font-medium text-indigo-300 uppercase tracking-wider">Results</span>
                                        <AnimatedCounter
                                            value={streamingSearchCount}
                                            className="text-xs font-bold text-indigo-400 font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div ref={bottomRef} className="h-4" />
                    </div>
                </div>
            )}
        </div>
    );
}
