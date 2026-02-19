import { NextRequest } from 'next/server';
import { streamChat } from '@/lib/ai/xai';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import { resolveSettings } from '@/lib/ai/modes';
import { ChatMode, ToneType } from '@/types';

export const runtime = 'nodejs';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Fetch memory context from the Python backend.
 */
async function getMemoryContext(userId: string, query: string): Promise<string> {
    try {
        const contextRes = await fetch(`${BACKEND_URL}/memory/user/${userId}/context`, {
            signal: AbortSignal.timeout(3000),
        });
        const contextData = contextRes.ok ? await contextRes.json() : { context: '' };

        const memRes = await fetch(`${BACKEND_URL}/memory/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, user_id: userId, limit: 5 }),
            signal: AbortSignal.timeout(3000),
        });
        const memData = memRes.ok ? await memRes.json() : { results: [] };

        const parts: string[] = [];

        if (contextData.context) {
            parts.push('=== User Profile ===');
            parts.push(contextData.context);
        }

        const memories = memData.results || [];
        if (memories.length > 0) {
            parts.push('\n=== Relevant Memories ===');
            memories.forEach((m: any, i: number) => {
                parts.push(`[${i + 1}] ${m.memory}`);
            });
        }

        return parts.join('\n');
    } catch (e) {
        console.log('Memory service unavailable, proceeding without context');
        return '';
    }
}

/**
 * Store conversation context as a memory after response completes.
 */
async function storeMemory(userId: string, userMessage: string, aiResponse: string): Promise<void> {
    try {
        await fetch(`${BACKEND_URL}/memory/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `User: ${userMessage}\nAssistant: ${aiResponse.slice(0, 500)}`,
                user_id: userId,
                metadata: { type: 'conversation', timestamp: new Date().toISOString() },
            }),
            signal: AbortSignal.timeout(3000),
        });
    } catch (e) {
        // Non-critical
    }
}

/**
 * Run a web search and return formatted results for prompt injection.
 */
/**
 * Run a web search and return formatted results + count.
 */
async function fetchWebSearchResults(query: string): Promise<{ text: string; count: number }> {
    try {
        const resp = await fetch(`${BACKEND_URL}/search/combined`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, num_results: 8 }),
            signal: AbortSignal.timeout(8000),
        });

        if (!resp.ok) return { text: '', count: 0 };

        const data = await resp.json();
        const results = data.results || [];
        const count = results.length;
        if (count === 0) return { text: '', count: 0 };

        const formatted = results.map((r: any, i: number) => {
            const highlights = r.highlights?.join(' ') || r.raw_content?.slice(0, 300) || '';
            const source = r.source ? `[${r.source}] ` : '';
            return `[${i + 1}] ${source}${r.title}\n    URL: ${r.url}\n    ${highlights}`;
        }).join('\n\n');

        return {
            text: `\n--- WEB SEARCH RESULTS (live) ---\nQuery: "${query}"\n\n${formatted}\n--- END SEARCH RESULTS ---\n`,
            count
        };
    } catch (e) {
        console.log('Web search unavailable, proceeding without results');
        return { text: '', count: 0 };
    }
}

// Clerk imports removed
import { cookies } from 'next/headers';

// ... existing imports ...

// ... imports
import { auth } from '@clerk/nextjs/server';
import { supabase } from "@/lib/db/supabase";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            messages,
            model,
            extendedThinking,
            tone,
            activeModes = [] as ChatMode[],
            activeTone = null as ToneType | null,
            anura,
            imageDescription,
            conversationId, // NEW
        } = body;

        // AUTHENTICATION
        const { userId } = await auth();
        const cookieStore = await cookies();

        // Unauthenticated access control
        if (!userId) {
            // ... (keep existing guest logic)
            // 1. Enforce Model
            if (model !== 'suzhou-3') {
                return new Response(
                    JSON.stringify({ error: 'Login required to use this model. Only Suzhou 3 is available for guests.' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // 2. Enforce Message Limit (15 messages)
            const limitCookie = cookieStore.get('anon_msg_count');
            const currentCount = limitCookie ? parseInt(limitCookie.value) : 0;

            if (currentCount >= 15) {
                return new Response(
                    JSON.stringify({ error: 'Login required' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Increment count
            cookieStore.set('anon_msg_count', (currentCount + 1).toString(), {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            });
        }

        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey || apiKey === 'your_xai_api_key_here') {
            return new Response(
                JSON.stringify({ error: 'XAI_API_KEY not configured. Add your key to .env.local' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // PERSISTENCE: Handle Conversation & User Message (if authenticated)
        if (userId && conversationId) {
            // Ensure conversation exists
            const { data: conv } = await supabase
                .from('Conversation')
                .select('id')
                .eq('id', conversationId)
                .single();

            if (!conv) {
                // Create new conversation
                // Title is generated later or defaults to New Chat
                await supabase.from('Conversation').insert({
                    id: conversationId,
                    userId,
                    title: messages[messages.length - 1]?.content.slice(0, 30) || 'New Chat',
                    model: model || 'tura-3',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Update timestamp
                await supabase.from('Conversation')
                    .update({ updatedAt: new Date().toISOString() })
                    .eq('id', conversationId);
            }

            // Insert User Message
            const lastUserMsg = messages[messages.length - 1];
            if (lastUserMsg && lastUserMsg.role === 'user') {
                await supabase.from('Message').insert({
                    conversationId,
                    role: 'user',
                    content: lastUserMsg.content,
                    tone: activeTone || tone,
                    extendedThink: extendedThinking || false,
                    createdAt: new Date().toISOString()
                });
            }
        }

        // Resolve mode settings (temperature, maxTokens, webSearch)
        const modeSettings = resolveSettings(activeModes);

        // Determine effective tone: new activeTone takes priority over legacy tone
        const effectiveTone = activeTone || tone || null;

        // Fetch memory context
        const lastUserMsgContent = messages?.filter((m: any) => m.role === 'user').pop()?.content || '';
        const memoryContext = userId ? await getMemoryContext(userId, lastUserMsgContent) : '';

        // Build system prompt with active modes
        let systemPrompt = getSystemPrompt({
            modelId: model || 'tura-3',
            tone: effectiveTone,
            activeModes,
            anuraActive: anura || false,
            extendedThinking: extendedThinking || false,
        });

        // Guest Restriction: Video/Image Generation
        if (!userId) {
            systemPrompt += `\n\nIMPORTANT: You are in "Guest Mode". You CANNOT generate images or videos. If the user asks to generate, create, or imagine an image or video, do NOT use any tools. Instead, strictly reply with this exact text: ":::sign-in-placeholder:::" and nothing else.`;
        }

        // Inject memory context
        if (memoryContext) {
            systemPrompt += `\n\n--- MEMORY CONTEXT (from previous interactions) ---\n${memoryContext}\n--- END MEMORY CONTEXT ---\nUse this context to personalize your responses. Remember the user's name, preferences, and prior conversations.`;
        }

        // Auto-search logic: if query asks a question or implies search
        const qLowerCase = lastUserMsgContent.toLowerCase();
        const shouldAutoSearch = qLowerCase.length > 5 && (
            qLowerCase.includes('?') ||
            qLowerCase.startsWith('who') ||
            qLowerCase.startsWith('what') ||
            qLowerCase.startsWith('where') ||
            qLowerCase.startsWith('when') ||
            qLowerCase.startsWith('why') ||
            qLowerCase.startsWith('how') ||
            qLowerCase.includes('search') ||
            qLowerCase.includes('latest') ||
            qLowerCase.includes('price') ||
            qLowerCase.includes('news')
        );

        let searchStats = { count: 0 };

        // Inject web search results if web-search mode is active OR auto-search triggers
        if (modeSettings.enableWebSearch || shouldAutoSearch) {
            const searchResults = await fetchWebSearchResults(lastUserMsgContent);
            if (searchResults.text) {
                systemPrompt += `\n${searchResults.text}`;
                searchStats.count = searchResults.count;
            }
        }

        // Build message history for xAI
        const apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system' as const, content: systemPrompt },
        ];

        for (const msg of messages || []) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                let content = msg.content;
                if (msg === messages[messages.length - 1] && msg.role === 'user' && imageDescription) {
                    content = `[The user uploaded an image. Image analysis: ${imageDescription}]\n\n${content}`;
                }
                apiMessages.push({ role: msg.role, content });
            }
        }

        // Create SSE stream with mode-resolved temperature & maxTokens
        let fullResponse = '';
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    // Send search stats if available
                    if (searchStats.count > 0) {
                        const statsData = `data: ${JSON.stringify({ type: 'search_stats', count: searchStats.count })}\n\n`;
                        controller.enqueue(encoder.encode(statsData));
                    }

                    for await (const chunk of streamChat(
                        apiMessages,
                        model || 'tura-3',
                        apiKey,
                        modeSettings.temperature,
                        modeSettings.maxTokens,
                    )) {
                        fullResponse += chunk;
                        const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                        controller.enqueue(encoder.encode(data));
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));

                    // Post-processing: Memory & Persistence
                    if (userId) {
                        // Store memory
                        storeMemory(userId, lastUserMsgContent, fullResponse).catch(() => { });

                        // PERSISTENCE: Save Assistant Message
                        if (conversationId) {
                            supabase.from('Message').insert({
                                conversationId,
                                role: 'assistant',
                                content: fullResponse,
                                createdAt: new Date().toISOString()
                            }).then(({ error }) => {
                                if (error) console.error('Failed to save assistant message:', error);
                            });
                        }
                    }
                } catch (error: any) {
                    const errData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
                    controller.enqueue(encoder.encode(errData));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('Chat API error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
