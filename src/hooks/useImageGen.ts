'use client';

import { useState, useCallback, useEffect } from 'react';
import { ImageGenJob, GenStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, mimeType: file.type || 'image/png' });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const MAX_CONCURRENT = 5;
const STORAGE_KEY = 'hefai_image_jobs';
const MOD_STORAGE_KEY = 'hefai_mod_state';

export function useImageGen() {
    const [jobs, setJobs] = useState<ImageGenJob[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((j: any) => ({ ...j, createdAt: new Date(j.createdAt) }));
            }
        } catch { }
        return [];
    });

    const [modState, setModState] = useState<{ strikes: number; end: number }>(() => {
        if (typeof window === 'undefined') return { strikes: 0, end: 0 };
        try {
            const saved = localStorage.getItem(MOD_STORAGE_KEY);
            return saved ? JSON.parse(saved) : { strikes: 0, end: 0 };
        } catch {
            return { strikes: 0, end: 0 };
        }
    });

    const saveJobs = useCallback((newJobs: ImageGenJob[]) => {
        setJobs(newJobs);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newJobs));
        } catch { }
    }, []);

    const activeCount = jobs.filter(j => j.status === 'generating').length;

    const generate = useCallback(async (
        prompt: string,
        count: number,
        proMode: boolean,
        imageFile?: File,
        strength?: number,
    ) => {
        if (activeCount >= MAX_CONCURRENT) {
            throw new Error(`Maximum ${MAX_CONCURRENT} concurrent image generations allowed`);
        }

        if (modState.end > Date.now()) {
            throw new Error('Moderation timeout active');
        }

        const jobId = uuidv4();
        const newJob: ImageGenJob = {
            id: jobId,
            prompt,
            status: 'generating',
            images: [],
            proMode,
            count: Math.min(Math.max(count, 1), 5),
            createdAt: new Date(),
            strength,
        };

        // If there's an uploaded image, convert to base64
        let imageBase64: string | undefined;
        let mimeType: string | undefined;

        if (imageFile) {
            const result = await fileToBase64(imageFile);
            imageBase64 = result.base64;
            mimeType = result.mimeType;
            newJob.sourceImage = `data:${mimeType};base64,${imageBase64}`;
        }

        setJobs(prev => {
            const updated = [newJob, ...prev];
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { }
            return updated;
        });

        try {
            const res = await fetch('/api/imagine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    n: newJob.count,
                    proMode,
                    imageBase64,
                    mimeType,
                    strength: newJob.strength,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || `API error: ${res.status}`);
            }

            const data = await res.json();
            const images = (data.images || []).map((img: any) => img.url);

            setJobs(prev => {
                const updated = prev.map(j =>
                    j.id === jobId ? { ...j, status: 'completed' as GenStatus, images } : j
                );
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { }
                return updated;
            });

            return images;
        } catch (error: any) {
            let finalError = error.message;
            let isModerated = false;

            if (finalError.toLowerCase().includes('moderation')) {
                finalError = 'Image moderated';
                isModerated = true;

                setModState(prev => {
                    const newStrikes = prev.strikes + 1;
                    const duration = Math.min(newStrikes * 10, 300); // 10s, 20s, 30s... max 5m
                    const newEnd = Date.now() + (duration * 1000);
                    const newState = { strikes: newStrikes, end: newEnd };
                    try { localStorage.setItem(MOD_STORAGE_KEY, JSON.stringify(newState)); } catch { }
                    return newState;
                });
            }

            setJobs(prev => {
                const updated = prev.map(j =>
                    j.id === jobId ? { ...j, status: 'error' as GenStatus, error: finalError } : j
                );
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { }
                return updated;
            });
            throw new Error(finalError);
        }
    }, [activeCount, modState.end]);

    const clearJob = useCallback((id: string) => {
        setJobs(prev => {
            const updated = prev.filter(j => j.id !== id);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { }
            return updated;
        });
    }, []);

    const clearAll = useCallback(() => {
        saveJobs([]);
    }, [saveJobs]);

    return {
        jobs,
        activeCount,
        maxConcurrent: MAX_CONCURRENT,
        canGenerate: activeCount < MAX_CONCURRENT && modState.end < Date.now(),
        generate,
        clearJob,
        clearAll,
        moderationEnd: modState.end,
    };
}

