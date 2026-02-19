import { NextRequest } from 'next/server';
import { VideoService } from '@/lib/services/video';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            prompt,
            n = 1,
            imageBase64,
            mimeType,
            videoBase64,
            videoMimeType,
            duration = 5,
            aspectRatio = '16:9',
        } = body;

        if (!prompt || typeof prompt !== 'string') {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey || apiKey === 'your_xai_api_key_here') {
            return Response.json(
                { error: 'XAI_API_KEY not configured' },
                { status: 500 }
            );
        }

        let imageUrl: string | undefined;
        let videoUrl: string | undefined;

        if (imageBase64 && mimeType) {
            imageUrl = `data:${mimeType};base64,${imageBase64}`;
        }
        if (videoBase64 && videoMimeType) {
            videoUrl = `data:${videoMimeType};base64,${videoBase64}`;
        }

        const requestIds = await VideoService.generate({
            prompt,
            n: Number(n),
            imageUrl,
            videoUrl,
            duration,
            aspectRatio,
            apiKey,
        });

        return Response.json({ jobs: requestIds.map(id => ({ requestId: id })) });
    } catch (error: any) {
        console.error('Video generation API error:', error);
        return Response.json(
            { error: error.message || 'Video generation failed' },
            { status: 500 }
        );
    }
}
