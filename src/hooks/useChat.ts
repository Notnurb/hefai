'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Message, TaskStatusType, ToneType, ChatMode, Conversation } from '@/types';
import { MODE_CONFIGS } from '@/lib/ai/modes';
import { v4 as uuidv4 } from 'uuid';
import { useSubscription } from '@/context/SubscriptionContext';
import { useUser } from '@clerk/nextjs';

// ─── @anura detection ─────────────────────────────────────────────────────────

const ANURA_REGEX = /(?:^|\s)@anura(?:\s|$)/i;

export function containsAnuraTrigger(text: string): boolean {
    return ANURA_REGEX.test(text);
}

// ─── Taipei 3 shimmer labels (cycled while waiting for first token) ───────────

const TURA_LABELS = [
    'Understanding request...',
    'Analyzing context...',
    'Reasoning deeply...',
    'Confirming approach...',
];

const EXTENDED_LABELS = [
    'Understanding request...',
    'Deep analysis...',
    'Searching knowledge...',
    'Reading context...',
    'Reasoning through options...',
    'Confirming approach...',
];

const STORAGE_KEY = 'hefai_conversations';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTask, setCurrentTask] = useState<TaskStatusType>('idle');
    const [currentTaskLabel, setCurrentTaskLabel] = useState('');
    const [streamingContent, setStreamingContent] = useState('');
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [streamingSearchCount, setStreamingSearchCount] = useState<number | undefined>(undefined);
    const [anuraTriggered, setAnuraTriggered] = useState(false);

    // Use context for subscription and credits
    const { plan } = useSubscription();
    const router = useRouter();
    const { isSignedIn } = useUser();

    const abortRef = useRef<AbortController | null>(null);
    const shimmerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastMessageTime = useRef<number>(0);
    const conversationsRef = useRef<Conversation[]>([]);
    const activeConversationIdRef = useRef<string | null>(null);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    // Initialize/Load from API
    useEffect(() => {
        async function loadConversations() {
            if (!isSignedIn) {
                // If guest, maybe load from localStorage or just empty?
                // For now, let's keep localStorage for guests if we want, OR just clear.
                // User requirement: "Make it save chats". Implies for logged in users.
                // Start empty for guests or keep localStorage?
                // Let's keep localStorage for guests ONLY.
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const formatted = parsed.map((c: any) => ({
                            ...c,
                            createdAt: new Date(c.createdAt),
                            updatedAt: new Date(c.updatedAt),
                            messages: c.messages.map((m: any) => ({
                                ...m,
                                timestamp: new Date(m.timestamp)
                            }))
                        }));
                        setConversations(formatted);
                    } catch (e) {
                        // ignore
                    }
                }
                return;
            }

            try {
                const res = await fetch('/api/chat/history');
                if (res.ok) {
                    const data = await res.json();
                    if (data.conversations) {
                        const formatted = data.conversations.map((c: any) => ({
                            ...c,
                            createdAt: new Date(c.createdAt),
                            updatedAt: new Date(c.updatedAt),
                            messages: c.messages.map((m: any) => ({
                                ...m,
                                timestamp: new Date(m.timestamp || m.createdAt),
                                model: m.model || c.model // Fallback
                            }))
                        })) as Conversation[];

                        setConversations((prev) => {
                            // Merge strategy: Keep local conversations that aren't in server data
                            // Update existing ones with server data
                            const serverMap = new Map(formatted.map(c => [c.id, c]));
                            const merged = [...formatted];

                            prev.forEach(p => {
                                if (!serverMap.has(p.id)) {
                                    // Keep local-only conversation (e.g. newly created)
                                    merged.unshift(p);
                                }
                            });

                            return merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load history", error);
            }
        }

        loadConversations();
    }, [isSignedIn]);

    // Save to localStorage ONLY for guests
    useEffect(() => {
        if (!isSignedIn && conversations.length > 0) {
            const timeout = setTimeout(() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
            }, 250);
            return () => clearTimeout(timeout);
        } else if (isSignedIn) {
            // Optional: Clear local storage when signed in to avoid confusion?
            // localStorage.removeItem(STORAGE_KEY);
        }
    }, [conversations, isSignedIn]);

    const activeConversation = useMemo(
        () => conversations.find((c) => c.id === activeConversationId),
        [conversations, activeConversationId]
    );

    const getTaskLabel = useCallback(() => currentTaskLabel, [currentTaskLabel]);

    const createConversation = useCallback((modelId?: string, id?: string, initialMessages: Message[] = []) => {
        const defaultModel = isSignedIn ? 'tura-3' : 'suzhou-3';
        const finalModel = modelId || defaultModel;
        const newId = id || uuidv4();

        // Prevent duplicate creation if it already exists
        setConversations((prev) => {
            if (prev.some(c => c.id === newId)) return prev;

            const newConv: Conversation = {
                id: newId,
                title: initialMessages.length > 0 ? (initialMessages[0].content.slice(0, 30) || 'New Chat') : 'New Chat',
                model: finalModel,
                updatedAt: new Date(),
                createdAt: new Date(),
                messages: initialMessages,
            };
            return [newConv, ...prev];
        });

        setActiveConversationId(newId);
        activeConversationIdRef.current = newId;
        setStreamingContent('');
        setStreamingMessageId(null);
        setCurrentTask('idle');
        setCurrentTaskLabel('');
        setStreamingSearchCount(undefined);
        setAnuraTriggered(false);
        return newId;
    }, [isSignedIn]);

    const selectConversation = useCallback((id: string) => {
        setActiveConversationId(id);
        activeConversationIdRef.current = id;
        setStreamingContent('');
        setStreamingMessageId(null);
        setCurrentTask('idle');
        setCurrentTaskLabel('');
    }, []);

    const deleteConversation = useCallback(
        (id: string) => {
            setConversations((prev) => {
                const newConvs = prev.filter((c) => c.id !== id);
                return newConvs;
            });
            if (activeConversationId === id) {
                setActiveConversationId(null);
                activeConversationIdRef.current = null;
            }
        },
        [activeConversationId]
    );

    // Start cycling shimmer labels (non-blocking)
    const startShimmer = useCallback((labels: string[]) => {
        if (shimmerRef.current) clearInterval(shimmerRef.current);

        let idx = 0;
        setCurrentTask('thinking');
        setCurrentTaskLabel(labels[0]);

        shimmerRef.current = setInterval(() => {
            idx = (idx + 1) % labels.length;
            setCurrentTaskLabel(labels[idx]);
        }, 1200);
    }, []);

    const stopShimmer = useCallback(() => {
        if (shimmerRef.current) {
            clearInterval(shimmerRef.current);
            shimmerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            stopShimmer();
        };
    }, [stopShimmer]);

    const sendMessage = useCallback(
        async (
            content: string,
            modelId: string,
            extendedThinking: boolean,
            _tone: ToneType,
            _onAddMessage?: (msg: Message) => void,
            imageDescription?: string,
            activeModes: ChatMode[] = [],
            activeTone: ToneType | null = null,
        ) => {
            const conversationId = activeConversationIdRef.current;
            if (!conversationId) return;

            // Slowmode check for 'Max' plan
            if (plan === 'max') {
                const now = Date.now();
                if (now - lastMessageTime.current < 6000) {
                    return;
                }
                lastMessageTime.current = now;

                // Trigger ads - REMOVED
            }

            // Deduct credit - REMOVED

            const controller = new AbortController();
            abortRef.current = controller;
            setIsLoading(true);

            const hasAnura = containsAnuraTrigger(content);
            if (hasAnura) setAnuraTriggered(true);

            const updateConversationMessages = (msg: Message) => {
                setConversations((prev) =>
                    prev.map((c) => {
                        if (c.id === conversationId) {
                            return {
                                ...c,
                                messages: [...c.messages, msg],
                                updatedAt: new Date(),
                                title: c.messages.length === 0 ? content.slice(0, 40) : c.title,
                            };
                        }
                        return c;
                    })
                );
            };

            // Add user message
            const userMessage: Message = {
                id: uuidv4(),
                role: 'user',
                content,
                timestamp: new Date(),
                model: modelId,
            };
            updateConversationMessages(userMessage);

            // Start shimmer — use mode-specific labels if any modes are active
            const modeLabels = activeModes.length > 0
                ? activeModes.flatMap((m) => MODE_CONFIGS[m].shimmerLabels)
                : null;

            if (modeLabels) {
                startShimmer(modeLabels);
            } else {
                const isTaipei = modelId === 'tura-3';
                if (isTaipei || extendedThinking) {
                    startShimmer(extendedThinking ? EXTENDED_LABELS : TURA_LABELS);
                } else {
                    setCurrentTask('thinking');
                    setCurrentTaskLabel('Thinking...');
                }
            }

            const assistantId = uuidv4();
            setStreamingMessageId(assistantId);
            setStreamingContent('');
            setStreamingSearchCount(undefined);

            // Build history
            const targetConv = conversationsRef.current.find(c => c.id === conversationId);
            const history = [
                ...(targetConv?.messages || []).map(m => ({ role: m.role, content: m.content })),
                { role: 'user' as const, content }
            ];

            let streamFrame: number | null = null;
            let latestBufferedContent = '';
            const flushStreamingContent = () => {
                if (streamFrame !== null) {
                    cancelAnimationFrame(streamFrame);
                    streamFrame = null;
                }
                setStreamingContent(latestBufferedContent);
            };

            const scheduleStreamingContent = () => {
                if (streamFrame !== null) return;
                streamFrame = requestAnimationFrame(() => {
                    streamFrame = null;
                    setStreamingContent(latestBufferedContent);
                });
            };

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: history,
                        model: modelId,
                        extendedThinking,
                        tone: _tone,
                        activeModes,
                        activeTone,
                        anura: hasAnura,
                        imageDescription,
                        conversationId, // Pass ID for persistence
                    }),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(err.error || `API error: ${res.status}`);
                }

                const reader = res.body?.getReader();
                if (!reader) throw new Error('No response body');

                const decoder = new TextDecoder();
                let accumulated = '';
                let buffer = '';
                let gotFirstToken = false;
                let latestSearchCount: number | undefined;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;
                        const data = trimmed.slice(6);
                        if (data === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) throw new Error(parsed.error);

                            // Handle custom events
                            if (parsed.type === 'search_stats') {
                                setStreamingSearchCount(parsed.count);
                                latestSearchCount = parsed.count;
                                continue;
                            }

                            if (parsed.content) {
                                if (!gotFirstToken) {
                                    gotFirstToken = true;
                                    stopShimmer();
                                    setCurrentTask('generating');
                                    setCurrentTaskLabel('');
                                }
                                accumulated += parsed.content;
                                latestBufferedContent = accumulated;
                                scheduleStreamingContent();
                            }
                        } catch (e: any) {
                            if (e.message && !e.message.includes('JSON')) throw e;
                        }
                    }
                }

                if (latestBufferedContent !== accumulated) {
                    latestBufferedContent = accumulated;
                }
                flushStreamingContent();

                const assistantMessage: Message = {
                    id: assistantId,
                    role: 'assistant',
                    content: accumulated || 'No response received.',
                    timestamp: new Date(),
                    model: modelId,
                    searchCount: latestSearchCount,
                };
                updateConversationMessages(assistantMessage);

                // Generate AI title if this is the first message
                if (targetConv && targetConv.messages.length === 0) {
                    try {
                        fetch('/api/chat/title', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: content }),
                        })
                            .then(res => res.json())
                            .then(data => {
                                if (data.title) {
                                    setConversations(prev => prev.map(c => {
                                        if (c.id === conversationId) {
                                            return { ...c, title: data.title };
                                        }
                                        return c;
                                    }));
                                }
                            })
                            .catch(e => console.error('Failed to generate title:', e));
                    } catch (e) {
                        // Ignore title generation errors
                    }
                }

            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    // Check for login requirement
                    if (error.message.includes('Login required')) {
                        router.push('/sign-in');
                        return;
                    }

                    const errorMessage: Message = {
                        id: assistantId || uuidv4(),
                        role: 'assistant',
                        content: `⚠️ **Error:** ${error.message}`,
                        timestamp: new Date(),
                        model: modelId,
                    };
                    updateConversationMessages(errorMessage);
                }
            } finally {
                if (streamFrame !== null) {
                    cancelAnimationFrame(streamFrame);
                    streamFrame = null;
                }
                stopShimmer();
                setStreamingContent('');
                setStreamingMessageId(null);
                setIsLoading(false);
                setCurrentTask('idle');
                setCurrentTaskLabel('');
                // setStreamingSearchCount(undefined); // Keep it visible until new message?
            }
        },
        [startShimmer, stopShimmer, plan, router]
    );

    const stopGeneration = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    const dismissAnura = useCallback(() => {
        setAnuraTriggered(false);
    }, []);

    return {
        conversations,
        activeConversation,
        activeConversationId,
        setActiveConversationId,
        isLoading,
        currentTask,
        currentTaskLabel,
        streamingContent,
        streamingMessageId,
        streamingSearchCount,
        anuraTriggered,
        sendMessage,
        stopGeneration,
        getTaskLabel,
        createConversation,
        selectConversation,
        deleteConversation,
        dismissAnura,
    };
}
