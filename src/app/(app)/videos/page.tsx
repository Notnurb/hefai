'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useVideoGen } from '@/hooks/useVideoGen';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Video01Icon,
    ArrowUp02Icon,
    Cancel01Icon,
    Download04Icon,
    Delete02Icon,
    Image01Icon,
    SparklesIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Watermark } from '@/components/ui/watermark';

export default function VideosPage() {
    const videoGen = useVideoGen();
    const [prompt, setPrompt] = useState('');
    const [count, setCount] = useState(1);
    const [duration, setDuration] = useState(5);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [proMode, setProMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    useEffect(() => {
        return () => {
            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }
        };
    }, [videoPreview]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() || !videoGen.canGenerate) return;
        setError(null);
        try {
            await videoGen.generate(
                prompt.trim(),
                count,
                duration,
                aspectRatio,
                uploadedImage || undefined,
                uploadedVideo || undefined,
                proMode,
            );
            setPrompt('');
            setUploadedImage(null);
            setImagePreview(null);
            setUploadedVideo(null);
            setVideoPreview(null);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch (e: any) {
            setError(e.message);
        }
    }, [prompt, count, duration, aspectRatio, uploadedImage, uploadedVideo, videoGen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setUploadedImage(file);
            setImagePreview(URL.createObjectURL(file));
            // Clear video if image is selected
            if (uploadedVideo) {
                setUploadedVideo(null);
                setVideoPreview(null);
            }
        }
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setUploadedVideo(file);
            setVideoPreview(URL.createObjectURL(file));
            // Clear image if video is selected
            if (uploadedImage) {
                setUploadedImage(null);
                setImagePreview(null);
            }
        }
    };

    const removeImage = () => {
        setUploadedImage(null);
        setImagePreview(null);
    };

    const removeVideo = () => {
        setUploadedVideo(null);
        setVideoPreview(null);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (file.type.startsWith('image/')) {
            setUploadedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setUploadedVideo(null);
            setVideoPreview(null);
        } else if (file.type.startsWith('video/')) {
            setUploadedVideo(file);
            setVideoPreview(URL.createObjectURL(file));
            setUploadedImage(null);
            setImagePreview(null);
        }
    }, []);

    const downloadVideo = async (url: string, index: number) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `hefai-video-${index + 1}.mp4`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-border px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <HugeiconsIcon icon={Video01Icon} size={22} className="text-brand" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight">Video Generation</h1>
                            <p className="text-xs text-muted-foreground">
                                {videoGen.activeCount}/{videoGen.maxConcurrent} active · {videoGen.jobs.length} total
                            </p>
                        </div>
                    </div>
                    {videoGen.jobs.length > 0 && (
                        <button
                            onClick={videoGen.clearAll}
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
                            {/* Upload previews */}
                            {(imagePreview || videoPreview) && (
                                <div className="px-3 pt-3 flex gap-2">
                                    {imagePreview && (
                                        <div className="relative inline-block">
                                            <img src={imagePreview} alt="Upload" className="h-20 rounded-xl object-cover" />
                                            <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5">
                                                <HugeiconsIcon icon={Cancel01Icon} size={12} />
                                            </button>
                                            <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                                                Image → Video
                                            </span>
                                        </div>
                                    )}
                                    {videoPreview && (
                                        <div className="relative inline-block">
                                            <video src={videoPreview} className="h-20 rounded-xl object-cover" muted />
                                            <button onClick={removeVideo} className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5">
                                                <HugeiconsIcon icon={Cancel01Icon} size={12} />
                                            </button>
                                            <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                                                Edit video
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Textarea + controls */}
                            <div className="flex items-end p-2 gap-2">
                                <div className="flex gap-0.5 mb-0.5">
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                        title="Upload image for animation"
                                    >
                                        <HugeiconsIcon icon={Image01Icon} size={18} />
                                    </button>
                                    <button
                                        onClick={() => videoInputRef.current?.click()}
                                        className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                        title="Upload video to edit"
                                    >
                                        <HugeiconsIcon icon={Video01Icon} size={18} />
                                    </button>
                                </div>
                                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />

                                <textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    onChange={(e) => {
                                        setPrompt(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        uploadedImage ? "Describe how to animate this image..."
                                            : uploadedVideo ? "Describe how to edit this video..."
                                                : "Describe the video you want to create..."
                                    }
                                    className="flex-1 min-h-[44px] max-h-[150px] border-0 focus:outline-none resize-none py-3 px-1 text-base bg-transparent scrollbar-thin"
                                    rows={1}
                                />

                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || !videoGen.canGenerate}
                                    className={cn(
                                        "mb-0.5 rounded-full h-10 w-10 flex items-center justify-center transition-all duration-200",
                                        prompt.trim() && videoGen.canGenerate
                                            ? "bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm"
                                            : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    <HugeiconsIcon icon={ArrowUp02Icon} size={20} />
                                </button>
                            </div>

                            {/* Controls bar */}
                            <div className="flex items-center justify-between px-3 pb-2 pt-0 flex-wrap gap-2">
                                <div className="flex items-center gap-4">
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

                                    {/* Duration selector */}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span>Duration:</span>
                                        <div className="flex gap-0.5">
                                            {[5, 10, 15].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setDuration(d)}
                                                    className={cn(
                                                        "px-2 h-6 rounded-md text-xs font-medium transition-all",
                                                        duration === d
                                                            ? "bg-brand text-brand-foreground shadow-sm"
                                                            : "bg-muted hover:bg-accent"
                                                    )}
                                                >
                                                    {d}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Aspect ratio */}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-4">
                                        <span>Ratio:</span>
                                        <div className="flex gap-0.5">
                                            {['16:9', '9:16', '1:1'].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setAspectRatio(r)}
                                                    className={cn(
                                                        "px-2 h-6 rounded-md text-xs font-medium transition-all",
                                                        aspectRatio === r
                                                            ? "bg-brand text-brand-foreground shadow-sm"
                                                            : "bg-muted hover:bg-accent"
                                                    )}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pro Mode Toggle */}
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

                        {error && (
                            <div className="mt-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="px-1 mb-8">
                        {proMode && (
                            <div className="text-xs text-purple-400 flex items-center gap-2 mb-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <span className="font-bold">✨ Pro Mode Active:</span>
                                Using Taipei 3 reasoning to enhance your prompt before generation.
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <AnimatePresence mode="popLayout">
                        {videoGen.jobs.map(job => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-6"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium truncate max-w-md">{job.prompt}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                            job.status === 'generating' && "bg-blue-500/20 text-blue-400",
                                            job.status === 'completed' && "bg-green-500/20 text-green-400",
                                            job.status === 'error' && "bg-red-500/20 text-red-400",
                                        )}>
                                            {job.status === 'generating' ? `Processing (${job.videoUrls.filter(Boolean).length}/${job.requestIds.length})...` : job.status}
                                        </span>
                                        <button
                                            onClick={() => videoGen.clearJob(job.id)}
                                            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <HugeiconsIcon icon={Delete02Icon} size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {job.status === 'generating' && job.videoUrls.map((url, i) => (
                                        url ? (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="relative rounded-xl overflow-hidden bg-muted"
                                            >
                                                <video
                                                    src={url}
                                                    controls
                                                    className="w-full rounded-xl"
                                                />
                                                <Watermark className="bottom-14 right-3" />
                                                <button
                                                    onClick={() => downloadVideo(url, i)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                                                >
                                                    <HugeiconsIcon icon={Download04Icon} size={14} />
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse flex flex-col items-center justify-center gap-2">
                                                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                                <span className="text-xs text-muted-foreground">Generating video {i + 1}...</span>
                                            </div>
                                        )
                                    ))}

                                    {job.status === 'completed' && job.videoUrls.map((url, i) => (
                                        url && (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.15 }}
                                                className="relative rounded-xl overflow-hidden bg-muted"
                                            >
                                                <video
                                                    src={url}
                                                    controls
                                                    className="w-full rounded-xl"
                                                />
                                                <Watermark className="bottom-14 right-3" />
                                                <button
                                                    onClick={() => downloadVideo(url, i)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                                                >
                                                    <HugeiconsIcon icon={Download04Icon} size={14} />
                                                </button>
                                            </motion.div>
                                        )
                                    ))}

                                    {job.status === 'generating' && job.requestIds.length === 0 && (
                                        Array.from({ length: job.count }).map((_, i) => (
                                            <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse flex flex-col items-center justify-center gap-2">
                                                <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                                <span className="text-xs text-muted-foreground">Submitting...</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {job.status === 'error' && (
                                    <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-2">
                                        {job.error || 'Generation failed'}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty state */}
                    {videoGen.jobs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6">
                                <HugeiconsIcon icon={Video01Icon} size={32} className="text-muted-foreground/50" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 tracking-tight">Create amazing videos</h2>
                            <p className="text-muted-foreground max-w-sm text-sm">
                                Describe a scene, upload an image to animate, or a video to edit.
                                Choose duration and aspect ratio for your content.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
