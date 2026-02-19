import { NextRequest } from 'next/server';
import { analyzeImage } from '@/lib/ai/xai';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
            return new Response(
                JSON.stringify({ error: 'No image provided' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey || apiKey === 'your_xai_api_key_here') {
            return new Response(
                JSON.stringify({ error: 'XAI_API_KEY not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const mimeType = file.type || 'image/png';

        // Analyze with vision model
        const description = await analyzeImage(base64, mimeType, apiKey);

        return new Response(
            JSON.stringify({ description, filename: file.name }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Vision API error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Vision analysis failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
