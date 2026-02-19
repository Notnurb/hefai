import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// POST /api/search — proxy to Python backend
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, num_results = 10, category, source = 'combined' } = body;

        let endpoint = '/search/combined';
        if (source === 'xai') endpoint = '/search/xai';
        if (source === 'exa') endpoint = '/search/exa';
        if (source === 'firecrawl') endpoint = '/search/firecrawl';

        const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, num_results, category }),
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Backend error' }));
            return NextResponse.json(err, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Search proxy error:', error);
        return NextResponse.json(
            { error: error.message || 'Search service unavailable' },
            { status: 502 }
        );
    }
}
