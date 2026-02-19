import { NextRequest } from 'next/server';
import { VideoService } from '@/lib/services/video';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
            return Response.json(
                { error: 'XAI_API_KEY not configured' },
                { status: 500 }
            );
        }

        const plannedPrompt = await VideoService.planPrompt(prompt, apiKey);

        return Response.json({ plannedPrompt });

    } catch (error: any) {
        console.error('Video planning error:', error);
        return Response.json(
            { error: error.message || 'Failed to plan video' },
            { status: 500 }
        );
    }
}
