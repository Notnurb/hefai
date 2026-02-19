
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
        }

        const blob = await response.blob();
        const headers = new Headers(response.headers);

        // Ensure CORS allows access
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Content-Type', blob.type || 'image/png');

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error('Image proxy error:', error);
        return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
    }
}
