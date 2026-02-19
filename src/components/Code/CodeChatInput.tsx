'use client';

import { useCallback, useRef, useState } from 'react';
import { Brain, SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CodeChatInputProps {
    onSend: (message: string, options: { planMode: boolean }) => void;
    isGenerating: boolean;
}

export default function CodeChatInput({ onSend, isGenerating }: CodeChatInputProps) {
    const [input, setInput] = useState('');
    const [planMode, setPlanMode] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const submit = useCallback(() => {
        if (!input.trim() || isGenerating) return;
        onSend(input.trim(), { planMode });
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }, [input, isGenerating, onSend, planMode]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
            }
        },
        [submit]
    );

    return (
        <div className="border-t border-border bg-background p-4">
            <div
                className={cn(
                    'rounded-xl border border-border bg-card shadow-sm transition-all',
                    isGenerating && 'pointer-events-none opacity-70'
                )}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={planMode ? 'Describe what to plan before coding...' : 'Describe what to build. Code will be generated immediately.'}
                    className="min-h-[52px] max-h-[180px] w-full resize-none border-0 bg-transparent px-3 py-3 text-sm outline-none"
                    rows={1}
                />

                <div className="flex items-center justify-between px-2 pb-2">
                    <button
                        onClick={() => setPlanMode((v) => !v)}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                            planMode
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground hover:bg-muted'
                        )}
                    >
                        <Brain className="h-3.5 w-3.5" />
                        {planMode ? 'Plan: On' : 'Plan: Off'}
                    </button>

                    <Button
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={submit}
                        disabled={!input.trim() || isGenerating}
                    >
                        <SendHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
                {planMode
                    ? 'Plan mode on: assistant will show plan and then implement.'
                    : 'Plan mode off: assistant skips planning output and writes code immediately.'}
            </p>
        </div>
    );
}
