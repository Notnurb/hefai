'use client';

import React, { memo, useCallback, useRef, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    PlusSignIcon,
    ImageUploadIcon,
    FileUploadIcon,
    Tick01Icon,
    ArrowDown01Icon,
    ArrowUp01Icon,
} from '@hugeicons/core-free-icons';
import { ChatMode, ToneType } from '@/types';
import { MODE_CONFIGS, toggleMode } from '@/lib/ai/modes';
import { cn } from '@/lib/utils';

interface PlusMenuProps {
    activeModes: ChatMode[];
    activeTone: ToneType | null;
    onToggleMode: (mode: ChatMode) => void;
    onSetTone: (tone: ToneType | null) => void;
    onUploadFile: (file: File) => void;
    onScreenshot: () => void;
}

const TONE_OPTIONS: { id: ToneType; label: string; emoji: string }[] = [
    { id: 'formal', label: 'Formal', emoji: '👔' },
    { id: 'concise', label: 'Concise', emoji: '⚡' },
    { id: 'detailed', label: 'Detailed', emoji: '📝' },
    { id: 'minimal', label: 'Minimal', emoji: '🔹' },
];

const MODE_ORDER: ChatMode[] = ['think', 'deep-research', 'web-search', 'study'];

function PlusMenu({
    activeModes,
    activeTone,
    onToggleMode,
    onSetTone,
    onUploadFile,
    onScreenshot,
}: PlusMenuProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [toneExpanded, setToneExpanded] = useState(false);

    const handleFileClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUploadFile(file);
            e.target.value = '';
        }
    }, [onUploadFile]);

    const hasActiveItems = activeModes.length > 0 || activeTone !== null;

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.md,.csv,.json"
                className="hidden"
                onChange={handleFileChange}
            />
            <DropdownMenu>
                <DropdownMenuTrigger
                    className={cn(
                        "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                        "h-9 w-9 shrink-0",
                        hasActiveItems
                            ? "bg-brand/15 text-brand hover:bg-brand/25"
                            : "hover:bg-accent text-muted-foreground"
                    )}
                >
                    <HugeiconsIcon icon={PlusSignIcon} size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    side="top"
                    className="w-72 p-1.5"
                >
                    {/* Mode toggles */}
                    {MODE_ORDER.map((modeId) => {
                        const config = MODE_CONFIGS[modeId];
                        const isActive = activeModes.includes(modeId);

                        return (
                            <button
                                key={modeId}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleMode(modeId);
                                }}
                                className={cn(
                                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                                    "hover:bg-accent/80 cursor-pointer group outline-none",
                                    isActive && "bg-brand/10"
                                )}
                            >
                                <span className="text-lg shrink-0">{config.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            isActive ? "text-brand" : "text-foreground"
                                        )}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                                        {config.description}
                                    </p>
                                </div>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                                    isActive
                                        ? "border-brand bg-brand"
                                        : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                                )}>
                                    {isActive && (
                                        <HugeiconsIcon icon={Tick01Icon} size={12} className="text-white" />
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    {/* Divider */}
                    <div className="h-px bg-border my-1.5" />

                    {/* Tone submenu */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setToneExpanded(!toneExpanded);
                        }}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                            "hover:bg-accent/80 cursor-pointer outline-none",
                            activeTone && "bg-brand/10"
                        )}
                    >
                        <span className="text-lg shrink-0">🎨</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-sm font-medium",
                                    activeTone ? "text-brand" : "text-foreground"
                                )}>
                                    Tone
                                </span>
                                {activeTone && (
                                    <span className="text-[10px] bg-brand/15 text-brand px-1.5 py-0.5 rounded-full font-medium capitalize">
                                        {activeTone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <HugeiconsIcon
                            icon={toneExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                            size={14}
                            className="text-muted-foreground shrink-0"
                        />
                    </button>

                    {/* Tone options (expandable) */}
                    {toneExpanded && (
                        <div className="pl-8 pr-1.5 pb-1 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                            {TONE_OPTIONS.map((opt) => {
                                const isActive = activeTone === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onSetTone(isActive ? null : opt.id);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-left transition-all duration-150",
                                            "hover:bg-accent/80 cursor-pointer outline-none",
                                            isActive && "bg-brand/10"
                                        )}
                                    >
                                        <span className="text-sm">{opt.emoji}</span>
                                        <span className={cn(
                                            "text-sm",
                                            isActive ? "text-brand font-medium" : "text-foreground"
                                        )}>
                                            {opt.label}
                                        </span>
                                        {isActive && (
                                            <HugeiconsIcon icon={Tick01Icon} size={12} className="text-brand ml-auto" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-border my-1.5" />

                    {/* File actions */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleFileClick();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-accent/80 cursor-pointer transition-all duration-150 outline-none"
                    >
                        <HugeiconsIcon icon={FileUploadIcon} size={18} className="text-muted-foreground" />
                        <span className="text-sm text-foreground">Upload File</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onScreenshot();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-accent/80 cursor-pointer transition-all duration-150 outline-none"
                    >
                        <HugeiconsIcon icon={ImageUploadIcon} size={18} className="text-muted-foreground" />
                        <span className="text-sm text-foreground">Upload Image</span>
                    </button>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

function arePlusMenuPropsEqual(prev: PlusMenuProps, next: PlusMenuProps) {
    return (
        prev.activeModes === next.activeModes &&
        prev.activeTone === next.activeTone &&
        prev.onToggleMode === next.onToggleMode &&
        prev.onSetTone === next.onSetTone &&
        prev.onUploadFile === next.onUploadFile &&
        prev.onScreenshot === next.onScreenshot
    );
}

export default memo(PlusMenu, arePlusMenuPropsEqual);
