import { NextRequest } from 'next/server';
import { generateImages } from '@/lib/ai/xai';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, n = 1, proMode = false, imageBase64, mimeType, strength } = body;

        if (!prompt || typeof prompt !== 'string') {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const count = Math.min(Math.max(Number(n) || 1, 1), 5);

        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey || apiKey === 'your_xai_api_key_here') {
            return Response.json(
                { error: 'XAI_API_KEY not configured. Add your key to .env.local' },
                { status: 500 }
            );
        }

        const model = proMode ? 'grok-imagine-image-pro' : 'grok-imagine-image';
        let imageUrl: string | undefined;

        if (imageBase64 && mimeType) {
            imageUrl = `data:${mimeType};base64,${imageBase64}`;
        }

        const results = await generateImages({
            prompt,
            model,
            n: count,
            apiKey,
            imageUrl,
            strength,
        });

        return Response.json({ images: results });
    } catch (error: any) {
        console.error('Image generation API error:', error);
        return Response.json(
            { error: error.message || 'Image generation failed' },
            { status: 500 }
        );
    }
}
