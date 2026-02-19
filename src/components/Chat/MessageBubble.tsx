'use client';

import React, { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '@/types';
import { formatMessageDate } from '@/lib/utils/format-date';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AgentPanel from '@/components/Chat/AgentPanel';
import SearchResults from '@/components/Chat/SearchResults';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import AnimatedCounter from '@/components/ui/animated-counter';
import { motion } from 'framer-motion';
import { getModel } from '@/lib/ai/models';
import { LockIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CodeBlock = dynamic(() => import('@/components/Chat/CodeBlock'), { ssr: false });
const MARKDOWN_REMARK_PLUGINS = [remarkGfm];
const MARKDOWN_REHYPE_PLUGINS = [rehypeHighlight];

const MARKDOWN_COMPONENTS = {
    h1({ children, ...props }: any) {
        return <h1 {...props} className="text-2xl font-bold mt-6 mb-3 text-foreground">{children}</h1>;
    },
    h2({ children, ...props }: any) {
        return <h2 {...props} className="text-xl font-semibold mt-5 mb-2 text-foreground">{children}</h2>;
    },
    h3({ children, ...props }: any) {
        return <h3 {...props} className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h3>;
    },
    h4({ children, ...props }: any) {
        return <h4 {...props} className="text-base font-semibold mt-3 mb-1.5 text-foreground">{children}</h4>;
    },
    p({ children, ...props }: any) {
        return <p {...props} className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
    },
    strong({ children, ...props }: any) {
        return <strong {...props} className="font-bold text-foreground">{children}</strong>;
    },
    em({ children, ...props }: any) {
        return <em {...props} className="italic">{children}</em>;
    },
    ul({ children, ...props }: any) {
        return <ul {...props} className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
    },
    ol({ children, ...props }: any) {
        return <ol {...props} className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
    },
    li({ children, ...props }: any) {
        return <li {...props} className="leading-relaxed">{children}</li>;
    },
    blockquote({ children, ...props }: any) {
        return (
            <blockquote {...props} className="border-l-3 border-brand/40 pl-4 my-3 italic text-muted-foreground">
                {children}
            </blockquote>
        );
    },
    a({ children, href, ...props }: any) {
        return (
            <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="text-brand underline hover:text-brand/80 transition-colors">
                {children}
            </a>
        );
    },
    hr({ ...props }: any) {
        return <hr {...props} className="my-4 border-border" />;
    },
    code({ inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <CodeBlock
                language={match[1]}
                value={String(children).replace(/\n$/, '')}
                {...props}
            />
        ) : (
            <code className={cn("bg-accent px-1.5 py-0.5 rounded-md font-mono text-[0.9em]", className)} {...props}>
                {children}
            </code>
        );
    },
    table({ children, ...props }: any) {
        return (
            <div className="overflow-x-auto my-3">
                <table {...props} className="w-full border-collapse text-sm">{children}</table>
            </div>
        );
    },
    th({ children, ...props }: any) {
        return <th {...props} className="border border-border px-3 py-2 text-left font-semibold bg-muted/50">{children}</th>;
    },
    td({ children, ...props }: any) {
        return <td {...props} className="border border-border px-3 py-2">{children}</td>;
    },
};

interface MessageBubbleProps {
    message: Message;
    isStreaming?: boolean;
    taskLabel?: string;
    streamingContent?: string;
    searchCount?: number;
}

function MessageBubble({
    message,
    isStreaming,
    taskLabel,
    streamingContent,
    searchCount,
}: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const isStreamingAssistant = Boolean(isStreaming && isAssistant);

    const modelName = useMemo(() => {
        if (!message.model) return 'Hefai';
        if (message.model.includes('grok-imagine-image')) return 'Image Generation';
        if (message.model.includes('grok-imagine-video')) return 'Video Generation';

        try {
            return getModel(message.model).name;
        } catch {
            return message.model;
        }
    }, [message.model]);

    const displayContent = isStreaming && streamingContent ? streamingContent : message.content;
    const visibleSearchCount = typeof searchCount === 'number' ? searchCount : message.searchCount;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
                "flex w-full mb-6",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div className={cn("flex max-w-[85%] gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar */}
                <Avatar className="h-7 w-7 mt-1 shrink-0">
                    {isUser ? (
                        <AvatarFallback className="bg-brand/15 text-brand text-xs font-semibold">U</AvatarFallback>
                    ) : (
                        <AvatarFallback className="bg-foreground/10 text-foreground/70 text-xs font-semibold">AI</AvatarFallback>
                    )}
                </Avatar>

                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground/80">
                            {isUser ? 'You' : modelName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {formatMessageDate(message.timestamp)}
                        </span>
                    </div>

                    {/* Content */}
                    <div className={cn(
                        "rounded-2xl text-sm leading-relaxed overflow-hidden",
                        isUser
                            ? "bg-brand text-brand-foreground px-4 py-2.5 rounded-tr-md"
                            : "bg-muted/30 border border-border/40 text-foreground px-4 py-2.5 rounded-tl-md"
                    )}>
                        {/* Shimmer task indicator */}
                        {isStreaming && isAssistant && taskLabel && !streamingContent && (
                            <div className="mb-2">
                                <TextShimmerWave className="font-mono text-sm" duration={1}>
                                    {taskLabel}
                                </TextShimmerWave>
                            </div>
                        )}

                        {/* Search Count Animation */}
                        {isStreaming && isAssistant && typeof visibleSearchCount === 'number' && (
                            <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 w-fit">
                                <span className="text-xs font-medium text-indigo-300">Results found:</span>
                                <AnimatedCounter
                                    value={visibleSearchCount}
                                    className="text-xs font-bold text-indigo-400 font-mono"
                                />
                            </div>
                        )}

                        {isUser ? (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : isStreamingAssistant ? (
                            <div className="whitespace-pre-wrap break-words">
                                {displayContent}
                                {streamingContent ? ' ▍' : ''}
                            </div>
                        ) : message.content.includes(':::sign-in-placeholder:::') ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 border border-muted rounded-xl gap-3 text-center w-full max-w-[300px]">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <LockIcon className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Sign in to view media</p>
                                    <p className="text-xs text-muted-foreground">Guest users cannot generate images or videos.</p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="w-full mt-2">
                                    <Link href="/sign-in">Sign In</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="markdown-content">
                                <ReactMarkdown
                                    remarkPlugins={MARKDOWN_REMARK_PLUGINS}
                                    rehypePlugins={MARKDOWN_REHYPE_PLUGINS}
                                    components={MARKDOWN_COMPONENTS}
                                    className="max-w-none break-words"
                                >
                                    {displayContent}
                                </ReactMarkdown>
                            </div>
                        )}

                        {/* Search Results */}
                        {isAssistant && message.searchResults && message.searchResults.length > 0 && (
                            <SearchResults results={message.searchResults} />
                        )}

                        {/* Agent Collaboration Panel */}
                        {isAssistant && message.agents && message.agents.length > 0 && (
                            <AgentPanel
                                agents={message.agents}
                                isCollaborating={false}
                                synthesis={message.isCollaboration ? message.content : undefined}
                            />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function areMessageBubblePropsEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
    return (
        prev.message === next.message &&
        prev.isStreaming === next.isStreaming &&
        prev.taskLabel === next.taskLabel &&
        prev.streamingContent === next.streamingContent &&
        prev.searchCount === next.searchCount
    );
}

export default memo(MessageBubble, areMessageBubblePropsEqual);
