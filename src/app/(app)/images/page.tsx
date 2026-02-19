'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useImageGen } from '@/hooks/useImageGen';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Image01Icon,
    ArrowUp02Icon,
    Cancel01Icon,
    Download04Icon,
    Delete02Icon,
    SparklesIcon,
    Message01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Watermark } from '@/components/ui/watermark';
import { downloadWithWatermark } from '@/lib/utils/image-processing';

export default function ImagesPage() {
    const router = useRouter();
    const imageGen = useImageGen();
    const [prompt, setPrompt] = useState('');
    const [count, setCount] = useState(1);
    const [proMode, setProMode] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [strength, setStrength] = useState(0.65); // Default influence
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!imageGen.moderationEnd || imageGen.moderationEnd <= Date.now()) {
            setTimeLeft(0);
            return;
        }

        const update = () => {
            const diff = Math.ceil((imageGen.moderationEnd - Date.now()) / 1000);
            if (diff > 0) setTimeLeft(diff);
            else setTimeLeft(0);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [imageGen.moderationEnd]);

    useEffect(() => {
        return () => {
            if (uploadPreview) {
                URL.revokeObjectURL(uploadPreview);
            }
        };
    }, [uploadPreview]);


    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() || !imageGen.canGenerate) return;
        setError(null);
        try {
            await imageGen.generate(prompt.trim(), count, proMode, uploadedFile || undefined, strength);
            setPrompt('');
            setUploadedFile(null);
            setUploadPreview(null);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch (e: any) {
            setError(e.message);
        }
    }, [prompt, count, proMode, uploadedFile, strength, imageGen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setUploadedFile(file);
            const preview = URL.createObjectURL(file);
            setUploadPreview(preview);
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
        setUploadPreview(null);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setUploadedFile(file);
            const preview = URL.createObjectURL(file);
            setUploadPreview(preview);
        }
    }, []);

    const downloadImage = async (url: string, index: number) => {
        await downloadWithWatermark(url, `hefai-image-${index + 1}.png`);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-border px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <HugeiconsIcon icon={Image01Icon} size={22} className="text-brand" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight">Image Generation</h1>
                            <p className="text-xs text-muted-foreground">
                                {imageGen.activeCount}/{imageGen.maxConcurrent} active · {imageGen.jobs.length} total
                            </p>
                        </div>
                    </div>
                    {imageGen.jobs.length > 0 && (
                        <button
                            onClick={imageGen.clearAll}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                <div className="max-w-4xl mx-auto">
                    {/* Input Area */}
                    <div
                        className="mb-8"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <div className={cn(
                            "relative flex flex-col bg-card border border-border rounded-2xl shadow-sm transition-all duration-200",
                            "focus-within:shadow-md focus-within:border-brand/30 focus-within:ring-1 focus-within:ring-brand/15"
                        )}>
                            {/* Upload preview */}
                            {uploadPreview && (
                                <div className="px-3 pt-3 flex flex-col gap-3">
                                    <div className="flex gap-4 items-start">
                                        <div className="relative inline-block shrink-0">
                                            <img src={uploadPreview} alt="Upload" className="h-24 rounded-xl object-cover border border-border" />
                                            <button
                                                onClick={removeFile}
                                                className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 shadow-sm"
                                            >
                                                <HugeiconsIcon icon={Cancel01Icon} size={12} />
                                            </button>
                                            <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                                Edit mode
                                            </span>
                                        </div>

                                        <div className="flex-1 space-y-2 pt-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-muted-foreground">Image Influence</span>
                                                <span>{Math.round(strength * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={strength}
                                                onChange={(e) => setStrength(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand"
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                Lower = more creative freedom, Higher = closer to original.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-border/50 w-full" />
                                </div>
                            )}

                            {/* Textarea + controls */}
                            <div className="flex items-end p-2 gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mb-0.5 p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                    title="Upload image to edit"
                                >
                                    <HugeiconsIcon icon={Image01Icon} size={18} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                <textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    onChange={(e) => {
                                        setPrompt(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={uploadedFile ? "Describe how to modify this image..." : "Describe the image you want to create..."}
                                    className="flex-1 min-h-[44px] max-h-[150px] border-0 focus:outline-none resize-none py-3 px-1 text-base bg-transparent scrollbar-thin"
                                    rows={1}
                                />

                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || !imageGen.canGenerate}
                                    className={cn(
                                        "mb-0.5 rounded-full h-10 w-10 flex items-center justify-center transition-all duration-200",
                                        prompt.trim() && imageGen.canGenerate
                                            ? "bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm"
                                            : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    <HugeiconsIcon icon={ArrowUp02Icon} size={20} />
                                </button>
                            </div>

                            {/* Controls bar */}
                            <div className="flex items-center justify-between px-3 pb-2 pt-0 flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    {/* Count selector */}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span>Count:</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setCount(n)}
                                                    className={cn(
                                                        "w-6 h-6 rounded-md text-xs font-medium transition-all",
                                                        count === n
                                                            ? "bg-brand text-brand-foreground shadow-sm"
                                                            : "bg-muted hover:bg-accent"
                                                    )}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pro mode toggle */}
                                    <button
                                        onClick={() => setProMode(!proMode)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                                            proMode
                                                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30"
                                                : "bg-muted text-muted-foreground hover:bg-accent"
                                        )}
                                    >
                                        <HugeiconsIcon icon={SparklesIcon} size={12} />
                                        Pro
                                    </button>
                                </div>

                            </div>
                        </div>

                        {/* Error display */}
                        {/* Error display */}
                        {error && (
                            <div className="mt-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                                {error}
                            </div>
                        )}
                        {timeLeft > 0 && (
                            <div className="mt-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                                <span>Image moderated. Timeout active: {timeLeft}s</span>
                            </div>
                        )}

                    </div>

                    {/* Results Gallery */}
                    <AnimatePresence mode="popLayout">
                        {imageGen.jobs.map(job => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-6"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate max-w-md">{job.prompt}</p>
                                        {job.proMode && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400">PRO</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                            job.status === 'generating' && "bg-blue-500/20 text-blue-400",
                                            job.status === 'completed' && "bg-green-500/20 text-green-400",
                                            job.status === 'error' && "bg-red-500/20 text-red-400",
                                        )}>
                                            {job.status === 'generating' ? 'Generating...' : job.status}
                                        </span>
                                        <button
                                            onClick={() => imageGen.clearJob(job.id)}
                                            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <HugeiconsIcon icon={Delete02Icon} size={14} />
                                        </button>
                                    </div>
                                </div>

                                {job.status === 'generating' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {Array.from({ length: job.count }).map((_, i) => (
                                            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse flex items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {job.status === 'completed' && job.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {job.images.map((url, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Generated ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <Watermark />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <div className="absolute bottom-2 right-2 flex gap-1">
                                                        <button
                                                            onClick={() => downloadImage(url, i)}
                                                            className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                                                        >
                                                            <HugeiconsIcon icon={Download04Icon} size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const encodedUrl = encodeURIComponent(url);
                                                                router.push(`/chat?image=${encodedUrl}&prompt=Describe this image`);
                                                            }}
                                                            className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                                                            title="Describe with Chat"
                                                        >
                                                            <HugeiconsIcon icon={Message01Icon} size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {job.status === 'error' && (
                                    <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                                        {job.error || 'Generation failed'}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty state */}
                    {imageGen.jobs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6">
                                <HugeiconsIcon icon={Image01Icon} size={32} className="text-muted-foreground/50" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 tracking-tight">Create stunning images</h2>
                            <p className="text-muted-foreground max-w-sm text-sm">
                                Describe what you want to see, or upload an image to modify it.
                                Toggle Pro mode for higher quality results.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
