import { submitVideoGeneration, pollVideoStatus } from '@/lib/ai/xai';

export interface VideoGenerationParams {
    prompt: string;
    n?: number;
    imageUrl?: string;
    videoUrl?: string;
    duration?: number;
    aspectRatio?: string;
    apiKey: string;
}

export class VideoService {
    /**
     * Plan a video prompt using Taipei 3 (grok-4-1-fast-reasoning).
     */
    static async planPrompt(prompt: string, apiKey: string): Promise<string> {
        try {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'grok-4-1-fast-reasoning',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert video director and cinematographer. 
Your task is to take a user's simple video idea and expand it into a detailed, high-quality prompt for a video generation model (like grok-imagine-video).
Focus on lighting, camera, movement, style, and atmosphere.
Output ONLY the enhanced prompt, nothing else.`,
                        },
                        {
                            role: 'user',
                            content: `Plan a video generation prompt for: "${prompt}"`,
                        },
                    ],
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Planning failed: ${error}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content?.trim() || prompt;
        } catch (error) {
            console.error('VideoService.planPrompt error:', error);
            throw error;
        }
    }

    /**
     * Generate videos using grok-imagine-video.
     * Returns an array of request IDs.
     */
    static async generate(params: VideoGenerationParams): Promise<string[]> {
        const { prompt, n = 1, imageUrl, videoUrl, duration = 5, aspectRatio = '16:9', apiKey } = params;
        const count = Math.min(Math.max(n, 1), 5);
        const requestIds: string[] = [];

        try {
            // Initiate generation requests in parallel or sequence
            // xAI might have rate limits, so sequential for now to be safe, 
            // or Promise.all if we want speed. Let's do parallel for better UX.
            const promises = Array.from({ length: count }).map(() =>
                submitVideoGeneration({
                    prompt,
                    apiKey,
                    imageUrl,
                    videoUrl,
                    duration,
                    aspectRatio,
                })
            );

            const results = await Promise.all(promises);
            return results.map(r => r.requestId);
        } catch (error) {
            console.error('VideoService.generate error:', error);
            throw error;
        }
    }

    /**
     * Get the status of a video generation request.
     */
    static async getStatus(requestId: string, apiKey: string) {
        try {
            return await pollVideoStatus(requestId, apiKey);
        } catch (error) {
            console.error('VideoService.getStatus error:', error);
            throw error;
        }
    }
}
