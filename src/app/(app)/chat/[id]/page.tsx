'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useChatActions, useChatConversations, useChatStreaming } from '@/context/ChatContext';
import ChatArea from '@/components/Chat/ChatArea';
import InputBox from '@/components/Chat/InputBox';
import { ToneType, ChatMode } from '@/types';
import { toggleMode } from '@/lib/ai/modes';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

export default function ChatIdPage() {
    const params = useParams();
    const router = useRouter();
    const { conversations, activeConversation, activeConversationId } = useChatConversations();
    const {
        isLoading,
        currentTaskLabel,
        streamingContent,
        streamingMessageId,
        streamingSearchCount,
    } = useChatStreaming();
    const { selectConversation, createConversation, sendMessage } = useChatActions();
    const { isSignedIn, isLoaded } = useUser();
    const [selectedModel, setSelectedModel] = useState('suzhou-3'); // Default to restricted model
    const [extendedThinking, setExtendedThinking] = useState(false);
    const [selectedTone, setSelectedTone] = useState<ToneType>('concise');

    // Persistent mode toggles
    const [activeModes, setActiveModes] = useState<ChatMode[]>([]);
    const [activeTone, setActiveTone] = useState<ToneType | null>(null);

    const [guestMsgCount, setGuestMsgCount] = useState(0);

    const searchParams = useSearchParams();
    const imageParam = useMemo(() => searchParams.get('image'), [searchParams]);
    const promptParam = useMemo(() => searchParams.get('prompt'), [searchParams]);
    const fetchedImageParamRef = useRef<string | null>(null);
    const [initialPrompt, setInitialPrompt] = useState('');
    const [initialFile, setInitialFile] = useState<File | undefined>(undefined);

    useEffect(() => {
        if (promptParam) {
            setInitialPrompt(promptParam);
        }
    }, [promptParam]);

    useEffect(() => {
        if (!imageParam || fetchedImageParamRef.current === imageParam) return;
        fetchedImageParamRef.current = imageParam;

        const fetchImage = async () => {
            try {
                // Use proxy to ensure we can get the blob (avoid CORS issues)
                const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageParam)}`;
                let res = await fetch(proxyUrl);

                // Fallback to direct fetch if proxy fails (just in case)
                if (!res.ok) {
                    res = await fetch(imageParam);
                }

                if (res.ok) {
                    const blob = await res.blob();
                    const file = new File([blob], "image.png", { type: "image/png" });
                    setInitialFile(file);
                } else {
                    console.error("Failed to fetch image:", res.status, res.statusText);
                }
            } catch (e) {
                console.error("Failed to fetch initial image:", e);
            }
        };
        fetchImage();
    }, [imageParam]);

    const id = params.id as string;

    // Guests cannot use restricted models
    useEffect(() => {
        if (isLoaded && !isSignedIn && selectedModel === 'tura-3') {
            setSelectedModel('suzhou-3');
        }
    }, [isLoaded, isSignedIn, selectedModel]);

    // Load guest message count
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            const saved = localStorage.getItem('guest_msg_count');
            const count = saved ? parseInt(saved, 10) : 0;
            setGuestMsgCount(count);
        }
    }, [isLoaded, isSignedIn]);

    const conversationExists = useMemo(
        () => conversations.some((conversation) => conversation.id === id),
        [conversations, id]
    );

    // Sync active ID with URL
    useEffect(() => {
        if (!isLoading && id) {
            if (activeConversationId !== id) {
                if (conversationExists) {
                    selectConversation(id);
                } else {
                    // Force create if it doesn't exist (e.g. direct link or refresh)
                    createConversation(selectedModel, id);
                }
            }
        }
    }, [id, conversationExists, activeConversationId, isLoading, selectConversation, createConversation, selectedModel]);

    const messages = activeConversation?.messages || [];

    const handleToggleMode = useCallback((mode: ChatMode) => {
        setActiveModes((current) => toggleMode(current, mode));
    }, []);

    const handleSetTone = useCallback((tone: ToneType | null) => {
        setActiveTone(tone);
    }, []);

    const toggleExtendedThinking = useCallback(() => {
        setExtendedThinking((current) => !current);
    }, []);

    const handleSend = useCallback(async (content: string, file?: File) => {
        if (!isLoaded) return;

        // Guest limit check
        if (!isSignedIn) {
            if (guestMsgCount >= 15) {
                toast.error("Guest limit reached", {
                    description: "Please sign in to continue chatting.",
                    action: {
                        label: "Sign In",
                        onClick: () => router.push('/sign-in')
                    }
                });
                return;
            }
            const newCount = guestMsgCount + 1;
            setGuestMsgCount(newCount);
            localStorage.setItem('guest_msg_count', newCount.toString());
        }

        let imageDescription: string | undefined;

        if (file && file.type.startsWith('image/')) {
            try {
                const formData = new FormData();
                formData.append('image', file);
                const res = await fetch('/api/vision', {
                    method: 'POST',
                    body: formData,
                });
                if (res.ok) {
                    const data = await res.json();
                    imageDescription = data.description;
                }
            } catch (e) {
                console.error('Vision analysis failed:', e);
            }
        }

        sendMessage(
            content,
            selectedModel,
            extendedThinking,
            selectedTone,
            () => { },
            imageDescription,
            activeModes,
            activeTone,
        );
    }, [
        isLoaded,
        isSignedIn,
        guestMsgCount,
        router,
        sendMessage,
        selectedModel,
        extendedThinking,
        selectedTone,
        activeModes,
        activeTone,
    ]);

    const isEmpty = messages.length === 0 && !isLoading;

    return (
        <div className={cn(
            "flex flex-col h-full relative transition-all duration-500 overflow-hidden",
            isEmpty ? "justify-center px-4" : "justify-between"
        )}>
            {/* Chat area */}
            {!isEmpty && (
                <div className="flex-1 w-full overflow-hidden">
                    <ChatArea
                        messages={messages}
                        isStreaming={isLoading}
                        taskLabel={currentTaskLabel}
                        streamingContent={streamingContent}
                        streamingMessageId={streamingMessageId}
                        streamingSearchCount={streamingSearchCount}
                        selectedModel={selectedModel}
                    />
                </div>
            )}

            {/* Content Group */}
            <div className={cn(
                "w-full flex flex-col items-center transition-all duration-700",
                isEmpty ? "transform -translate-y-16" : "py-4 shrink-0"
            )}>
                {/* Empty state greeting */}
                {isEmpty && (
                    <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                            How can I help you?
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-lg md:text-xl font-medium">
                            One of the first generations of early agentic AGI. Build, create, and solve with Tripplet Hefai.
                        </p>
                    </div>
                )}

                {/* Input box */}
                <div className={cn(
                    "w-full transition-all duration-500",
                    isEmpty ? "max-w-3xl" : "max-w-4xl"
                )}>
                    <InputBox
                        selectedModel={selectedModel}
                        extendedThinking={extendedThinking}
                        isStreaming={isLoading}
                        activeModes={activeModes}
                        activeTone={activeTone}
                        onSend={handleSend}
                        onModelChange={setSelectedModel}
                        onExtendedThinkingChange={toggleExtendedThinking}
                        onSelectModel={setSelectedModel}
                        onToggleExtended={toggleExtendedThinking}
                        onToggleMode={handleToggleMode}
                        onSetTone={handleSetTone}
                        initialContent={initialPrompt}
                        initialFile={initialFile}
                    />
                </div>

                {!isEmpty && (
                    <div className="py-2 text-[10px] text-muted-foreground/50">
                        Hefai can make mistakes. Check important info.
                    </div>
                )}
            </div>
        </div>
    );
}
