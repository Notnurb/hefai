import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/hooks/useCodeGeneration';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSidebarProps {
    messages: Message[];
    isGenerating: boolean;
    onSendMessage: (content: string) => void;
    onClear: () => void;
    selectedModel: string;
}

export function ChatSidebar({
    messages,
    isGenerating,
    onSendMessage,
    onClear,
    selectedModel,
}: ChatSidebarProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isGenerating) return;
        onSendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-950 border-r border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">Tripplet AI</h3>
                        <p className="text-xs text-white/50 truncate max-w-[120px]">{selectedModel}</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={onClear}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                        title="Clear conversation"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Start Building</h3>
                        <p className="text-sm text-white/50">
                            Describe what you want to create and I'll generate the code for you.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    'flex gap-3',
                                    message.role === 'user' ? 'flex-row-reverse' : ''
                                )}
                            >
                                <div
                                    className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                        message.role === 'user'
                                            ? 'bg-primary/20'
                                            : 'bg-white/10'
                                    )}
                                >
                                    {message.role === 'user' ? (
                                        <User className="w-4 h-4 text-primary" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        'rounded-xl px-4 py-2 max-w-[85%]',
                                        message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-white/10 text-white'
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                        <div className="bg-white/10 rounded-xl px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/70">Generating code</span>
                                <span className="flex gap-1">
                                    <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what to build..."
                        disabled={isGenerating}
                        className={cn(
                            'w-full px-4 py-3 pr-12 rounded-xl resize-none',
                            'bg-white/5 border border-white/10 text-white placeholder:text-white/40',
                            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'min-h-[48px] max-h-[120px]'
                        )}
                        rows={1}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isGenerating}
                        className={cn(
                            'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all',
                            input.trim() && !isGenerating
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'bg-white/5 text-white/30 cursor-not-allowed'
                        )}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
