'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUp02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import PlusMenu from './PlusMenu';
import ModelSelector from './ModelSelector';
import { ToneType, ChatMode } from '@/types';
import { MODE_CONFIGS } from '@/lib/ai/modes';
import { cn } from '@/lib/utils';

interface UploadedFile {
    file: File;
    preview?: string;
}

interface InputBoxProps {
    selectedModel: string;
    extendedThinking: boolean;
    isStreaming: boolean;
    activeModes: ChatMode[];
    activeTone: ToneType | null;
    onSend: (content: string, file?: File) => void;
    onModelChange: (model: string) => void;
    onExtendedThinkingChange: () => void;
    onToggleMode: (mode: ChatMode) => void;
    onSetTone: (tone: ToneType | null) => void;
    onSelectModel?: (model: string) => void;
    onToggleExtended?: () => void;
    initialContent?: string;
    initialFile?: File;
}

const TONE_EMOJI: Record<ToneType, string> = {
    formal: '👔',
    concise: '⚡',
    detailed: '📝',
    minimal: '🔹',
};

function InputBox({
    selectedModel,
    extendedThinking,
    isStreaming,
    activeModes,
    activeTone,
    onSend,
    onModelChange,
    onExtendedThinkingChange,
    onToggleMode,
    onSetTone,
    onSelectModel,
    onToggleExtended,
    initialContent,
    initialFile,
}: InputBoxProps) {
    const [content, setContent] = useState(initialContent || '');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleModelChange = onSelectModel || onModelChange;
    const handleToggleExtended = onToggleExtended || onExtendedThinkingChange;

    useEffect(() => {
        return () => {
            if (uploadedFile?.preview) {
                URL.revokeObjectURL(uploadedFile.preview);
            }
        };
    }, [uploadedFile?.preview]);

    // Handle initial file
    useEffect(() => {
        if (initialFile) {
            const isImage = initialFile.type.startsWith('image/');
            const preview = isImage ? URL.createObjectURL(initialFile) : undefined;
            setUploadedFile({ file: initialFile, preview });
        }
    }, [initialFile]);

    // Handle initial content updates if needed (optional, but good for sync)
    useEffect(() => {
        if (initialContent && content === '') {
            setContent(initialContent);
        }
    }, [initialContent]);

    const handleSend = useCallback(() => {
        if ((!content.trim() && !uploadedFile) || isStreaming) return;
        onSend(content, uploadedFile?.file);
        setContent('');
        setUploadedFile(null);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [content, uploadedFile, isStreaming, onSend]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    }, []);

    const handleFileUpload = useCallback((file: File) => {
        const isImage = file.type.startsWith('image/');
        const preview = isImage ? URL.createObjectURL(file) : undefined;
        setUploadedFile({ file, preview });
    }, []);

    const removeFile = useCallback(() => {
        setUploadedFile(null);
    }, []);

    const hasActivePills = activeModes.length > 0 || activeTone !== null;

    return (
        <div className="w-full max-w-3xl mx-auto mb-0 px-4">
            <div className={cn(
                "relative flex flex-col bg-card border border-border rounded-2xl shadow-sm transition-all duration-200 ease-in-out",
                "focus-within:shadow-md focus-within:border-brand/30 focus-within:ring-1 focus-within:ring-brand/15",
                isStreaming && "opacity-80 pointer-events-none"
            )}>
                {/* File Preview */}
                {uploadedFile && (
                    <div className="px-3 pt-3">
                        <div className="flex items-center gap-2 bg-accent/50 rounded-xl px-3 py-2 w-fit">
                            {uploadedFile.preview ? (
                                <img src={uploadedFile.preview} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                    {uploadedFile.file.name.split('.').pop()?.toUpperCase()}
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-xs font-medium truncate max-w-[150px]">{uploadedFile.file.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                    {(uploadedFile.file.size / 1024).toFixed(0)} KB
                                </span>
                            </div>
                            <button onClick={removeFile} className="ml-1 p-0.5 rounded-full hover:bg-accent">
                                <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Mode Pills */}
                {hasActivePills && (
                    <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5">
                        {activeModes.map((modeId) => {
                            const config = MODE_CONFIGS[modeId];
                            return (
                                <span
                                    key={modeId}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand/10 text-brand rounded-full text-xs font-medium animate-in fade-in zoom-in-95 duration-200"
                                >
                                    <span>{config.emoji}</span>
                                    <span>{config.label}</span>
                                    <button
                                        onClick={() => onToggleMode(modeId)}
                                        className="ml-0.5 hover:bg-brand/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <HugeiconsIcon icon={Cancel01Icon} size={10} />
                                    </button>
                                </span>
                            );
                        })}
                        {activeTone && (
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand/10 text-brand rounded-full text-xs font-medium animate-in fade-in zoom-in-95 duration-200"
                            >
                                <span>{TONE_EMOJI[activeTone]}</span>
                                <span className="capitalize">{activeTone}</span>
                                <button
                                    onClick={() => onSetTone(null)}
                                    className="ml-0.5 hover:bg-brand/20 rounded-full p-0.5 transition-colors"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} size={10} />
                                </button>
                            </span>
                        )}
                    </div>
                )}

                {/* Text Input Area */}
                <div className="flex items-end p-2 gap-2">
                    <div className="mb-0.5">
                        <PlusMenu
                            activeModes={activeModes}
                            activeTone={activeTone}
                            onToggleMode={onToggleMode}
                            onSetTone={onSetTone}
                            onUploadFile={handleFileUpload}
                            onScreenshot={() => { }}
                        />
                    </div>

                    <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Message Hefai..."
                        className="min-h-[44px] max-h-[200px] border-0 focus-visible:ring-0 resize-none shadow-none py-3 px-1 text-base bg-transparent scrollbar-thin"
                        rows={1}
                    />

                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={(!content.trim() && !uploadedFile) || isStreaming}
                        className={cn(
                            "mb-0.5 rounded-full h-10 w-10 transition-all duration-200",
                            (content.trim() || uploadedFile)
                                ? "bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <HugeiconsIcon icon={ArrowUp02Icon} size={20} />
                    </Button>
                </div>

                {/* Footer / Controls */}
                <div className="flex items-center justify-between px-3 pb-2 pt-0">
                    <div className="flex items-center gap-2">
                        <ModelSelector
                            selectedModelId={selectedModel}
                            onSelectModel={handleModelChange}
                            extendedThinking={extendedThinking}
                            onToggleExtended={handleToggleExtended}
                        />
                    </div>

                    <div className="text-[10px] text-muted-foreground/70 select-none">
                        Hefai can make mistakes. Check important info.
                    </div>
                </div>
            </div>
        </div>
    );
}

function areInputBoxPropsEqual(prev: InputBoxProps, next: InputBoxProps) {
    return (
        prev.selectedModel === next.selectedModel &&
        prev.extendedThinking === next.extendedThinking &&
        prev.isStreaming === next.isStreaming &&
        prev.activeModes === next.activeModes &&
        prev.activeTone === next.activeTone &&
        prev.onSend === next.onSend &&
        prev.onModelChange === next.onModelChange &&
        prev.onExtendedThinkingChange === next.onExtendedThinkingChange &&
        prev.onToggleMode === next.onToggleMode &&
        prev.onSetTone === next.onSetTone &&
        prev.onSelectModel === next.onSelectModel &&
        prev.onToggleExtended === next.onToggleExtended &&
        prev.initialContent === next.initialContent &&
        prev.initialFile === next.initialFile
    );
}

export default memo(InputBox, areInputBoxPropsEqual);
