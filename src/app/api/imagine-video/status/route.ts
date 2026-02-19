import { NextRequest } from 'next/server';
import { VideoService } from '@/lib/services/video';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId } = body;

        if (!requestId) {
            return Response.json({ error: 'requestId is required' }, { status: 400 });
        }

        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey || apiKey === 'your_xai_api_key_here') {
            return Response.json(
                { error: 'XAI_API_KEY not configured' },
                { status: 500 }
            );
        }

        const result = await VideoService.getStatus(requestId, apiKey);
        return Response.json(result);
    } catch (error: any) {
        console.error('Video status poll error:', error);
        return Response.json(
            { error: error.message || 'Status check failed' },
            { status: 500 }
        );
    }
}
