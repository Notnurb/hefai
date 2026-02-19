import { getModel, VISION_MODEL } from './models';

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_IMAGE_URL = 'https://api.x.ai/v1/images/generations';
const XAI_VIDEO_URL = 'https://api.x.ai/v1/videos/generations';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | { type: string; text?: string; image_url?: { url: string } }[];
}

/**
 * Stream chat completions from xAI API.
 * Yields text chunks as they arrive via SSE.
 */
export async function* streamChat(
    messages: ChatMessage[],
    modelId: string,
    apiKey: string,
    temperature: number = 0.7,
    maxTokens?: number,
): AsyncGenerator<string> {
    const model = getModel(modelId);

    const body: Record<string, unknown> = {
        model: model.apiModel,
        messages,
        stream: true,
        temperature,
    };
    if (maxTokens) {
        body.max_tokens = maxTokens;
    }

    const res = await fetch(XAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`xAI API error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') return;

            try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            } catch {
                // Skip malformed chunks
            }
        }
    }
}

/**
 * Analyze an image using the vision model.
 * Returns a text description of the image content.
 */
export async function analyzeImage(
    imageBase64: string,
    mimeType: string,
    apiKey: string,
): Promise<string> {
    const res = await fetch(XAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${imageBase64}`,
                            },
                        },
                        {
                            type: 'text',
                            text: 'Describe this image in detail. What do you see? Be specific about the content, objects, text, colors, and any other relevant details.',
                        },
                    ],
                },
            ],
            temperature: 0.3,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Vision API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Unable to analyze the image.';
}

// ─── Image Generation ─────────────────────────────────────────────────────────

interface ImageGenOptions {
    prompt: string;
    model: 'grok-imagine-image' | 'grok-imagine-image-pro';
    n: number;
    apiKey: string;
    imageUrl?: string; // base64 data URI or public URL for editing
    strength?: number; // 0.0 to 1.0 influence of the source image
}

export interface ImageGenResult {
    url: string;
}

/**
 * Generate images using xAI image generation API.
 * Returns an array of image URLs.
 */
export async function generateImages(opts: ImageGenOptions): Promise<ImageGenResult[]> {
    const body: Record<string, unknown> = {
        model: opts.model,
        prompt: opts.prompt,
        n: opts.n,
        response_format: 'url',
    };

    if (opts.imageUrl) {
        body.image_url = opts.imageUrl;
        if (opts.strength !== undefined) {
            // xAI API might use 'strength', 'image_strength', or similar. 
            // Common standard is 'strength' or 'influence'.
            // Based on standard OpenAI-like APIs, 'strength' is often used for edit/variations.
            // If xAI uses a unique param, we might need to adjust. 
            // For now, mapping 'strength' to 'strength' seems safest assumption for "edit" mode.
            // However, for pure generation with image reference, it might just use the image.
            // Let's pass it as 'strength' and 'image_strength' to be safe or just 'strength'.
            body.strength = opts.strength;
        }
    }

    const res = await fetch(XAI_IMAGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Image generation error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return (data.data || []).map((item: any) => ({ url: item.url || item.b64_json }));
}

// ─── Video Generation ─────────────────────────────────────────────────────────

interface VideoGenOptions {
    prompt: string;
    apiKey: string;
    imageUrl?: string;  // for image-to-video
    videoUrl?: string;  // for video editing
    duration?: number;  // seconds (5, 10, 15)
    aspectRatio?: string; // "16:9", "9:16", "1:1"
    resolution?: string; // "720p", "480p"
}

export interface VideoSubmitResult {
    requestId: string;
}

/**
 * Submit a video generation request (async).
 * Returns a request_id for polling.
 */
export async function submitVideoGeneration(opts: VideoGenOptions): Promise<VideoSubmitResult> {
    const body: Record<string, unknown> = {
        model: 'grok-imagine-video',
        prompt: opts.prompt,
    };

    if (opts.duration) body.duration = opts.duration;
    if (opts.aspectRatio) body.aspect_ratio = opts.aspectRatio;
    if (opts.resolution) body.resolution = opts.resolution;
    if (opts.imageUrl) body.image_url = opts.imageUrl;
    if (opts.videoUrl) body.video_url = opts.videoUrl;

    const res = await fetch(XAI_VIDEO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Video generation error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return { requestId: data.request_id || data.id };
}

export interface VideoStatusResult {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    error?: string;
}

/**
 * Poll for video generation status.
 */
export async function pollVideoStatus(requestId: string, apiKey: string): Promise<VideoStatusResult> {
    const res = await fetch(`${XAI_VIDEO_URL}/${requestId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Video poll error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const status = data.status || 'pending';
    const videoUrl = data.data?.[0]?.url || data.video_url || undefined;
    const error = data.error || undefined;

    return { status, videoUrl, error };
}

