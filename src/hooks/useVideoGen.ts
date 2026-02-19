'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VideoGenJob, GenStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, mimeType: file.type || 'application/octet-stream' });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const MAX_CONCURRENT = 2;
const POLL_INTERVAL = 3000;
const STORAGE_KEY = 'hefai_video_jobs';

export function useVideoGen() {
    const [jobs, setJobs] = useState<VideoGenJob[]>(() => {
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

    const pollTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const persistJobs = useCallback((updatedJobs: VideoGenJob[]) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs)); } catch { }
    }, []);

    const activeCount = jobs.filter(j => j.status === 'generating').length;

    // Poll a single video request
    const pollRequest = useCallback(async (jobId: string, requestId: string, index: number) => {
        try {
            const res = await fetch('/api/imagine-video/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId }),
            });

            if (!res.ok) throw new Error('Poll failed');

            const data = await res.json();

            if (data.status === 'completed' && data.videoUrl) {
                setJobs(prev => {
                    const updated = prev.map(j => {
                        if (j.id !== jobId) return j;
                        const newUrls = [...j.videoUrls];
                        newUrls[index] = data.videoUrl;
                        const allDone = newUrls.filter(Boolean).length === j.requestIds.length;
                        return {
                            ...j,
                            videoUrls: newUrls,
                            status: allDone ? 'completed' as GenStatus : j.status,
                        };
                    });
                    persistJobs(updated);
                    return updated;
                });
                // Stop polling this request
                const key = `${jobId}-${index}`;
                const timer = pollTimers.current.get(key);
                if (timer) {
                    clearInterval(timer);
                    pollTimers.current.delete(key);
                }
            } else if (data.status === 'failed') {
                setJobs(prev => {
                    const updated = prev.map(j =>
                        j.id === jobId ? { ...j, status: 'error' as GenStatus, error: data.error || 'Video generation failed' } : j
                    );
                    persistJobs(updated);
                    return updated;
                });
                const key = `${jobId}-${index}`;
                const timer = pollTimers.current.get(key);
                if (timer) {
                    clearInterval(timer);
                    pollTimers.current.delete(key);
                }
            }
        } catch (err) {
            console.error('Poll error:', err);
        }
    }, [persistJobs]);

    const generate = useCallback(async (
        prompt: string,
        count: number,
        duration: number,
        aspectRatio: string,
        imageFile?: File,
        videoFile?: File,
        proMode: boolean = false,
    ) => {
        if (activeCount >= MAX_CONCURRENT) {
            throw new Error(`Maximum ${MAX_CONCURRENT} concurrent video generations allowed`);
        }

        const jobId = uuidv4();
        const safeCount = Math.min(Math.max(count, 1), 5);

        const newJob: VideoGenJob = {
            id: jobId,
            prompt,
            status: 'generating',
            requestIds: [],
            videoUrls: [],
            count: safeCount,
            duration,
            aspectRatio,
            createdAt: new Date(),
        };

        let imageBase64: string | undefined;
        let mimeType: string | undefined;
        let videoBase64: string | undefined;
        let videoMimeType: string | undefined;

        if (imageFile) {
            const result = await fileToBase64(imageFile);
            imageBase64 = result.base64;
            mimeType = result.mimeType;
            newJob.sourceImage = `data:${mimeType};base64,${imageBase64}`;
        }

        if (videoFile) {
            const result = await fileToBase64(videoFile);
            videoBase64 = result.base64;
            videoMimeType = result.mimeType;
            newJob.sourceVideo = `data:${videoMimeType};base64,${videoBase64}`;
        }

        setJobs(prev => {
            const updated = [newJob, ...prev];
            persistJobs(updated);
            return updated;
        });

        try {
            let finalPrompt = prompt;

            // Pro Mode: Plan video prompt
            if (proMode) {
                const planRes = await fetch('/api/plan-video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt }),
                });

                if (planRes.ok) {
                    const planData = await planRes.json();
                    finalPrompt = planData.plannedPrompt || prompt;
                    // Update job with enhanced prompt
                    setJobs(prev => {
                        const updated = prev.map(j =>
                            j.id === jobId ? { ...j, prompt: `[PRO] ${finalPrompt}` } : j
                        );
                        persistJobs(updated);
                        return updated;
                    });
                }
            }

            const res = await fetch('/api/imagine-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    n: safeCount,
                    imageBase64,
                    mimeType,
                    videoBase64,
                    videoMimeType,
                    duration,
                    aspectRatio,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || `API error: ${res.status}`);
            }

            const data = await res.json();
            const requestIds = (data.jobs || []).map((j: any) => j.requestId);

            setJobs(prev => {
                const updated = prev.map(j =>
                    j.id === jobId ? { ...j, requestIds, videoUrls: new Array(requestIds.length).fill('') } : j
                );
                persistJobs(updated);
                return updated;
            });

            // Start polling each request
            requestIds.forEach((reqId: string, idx: number) => {
                const key = `${jobId}-${idx}`;
                const timer = setInterval(() => {
                    pollRequest(jobId, reqId, idx);
                }, POLL_INTERVAL);
                pollTimers.current.set(key, timer);
                // Immediate first poll
                pollRequest(jobId, reqId, idx);
            });

        } catch (error: any) {
            setJobs(prev => {
                const updated = prev.map(j =>
                    j.id === jobId ? { ...j, status: 'error' as GenStatus, error: error.message } : j
                );
                persistJobs(updated);
                return updated;
            });
            throw error;
        }
    }, [activeCount, persistJobs, pollRequest]);

    const clearJob = useCallback((id: string) => {
        // Clean up any active poll timers for this job
        pollTimers.current.forEach((timer, key) => {
            if (key.startsWith(id)) {
                clearInterval(timer);
                pollTimers.current.delete(key);
            }
        });
        setJobs(prev => {
            const updated = prev.filter(j => j.id !== id);
            persistJobs(updated);
            return updated;
        });
    }, [persistJobs]);

    const clearAll = useCallback(() => {
        pollTimers.current.forEach(timer => clearInterval(timer));
        pollTimers.current.clear();
        setJobs([]);
        persistJobs([]);
    }, [persistJobs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            pollTimers.current.forEach(timer => clearInterval(timer));
        };
    }, []);

    return {
        jobs,
        activeCount,
        maxConcurrent: MAX_CONCURRENT,
        canGenerate: activeCount < MAX_CONCURRENT,
        generate,
        clearJob,
        clearAll,
    };
}
