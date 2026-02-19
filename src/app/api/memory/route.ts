import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// POST /api/memory — add or search memories
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...params } = body;

        let endpoint: string;
        switch (action) {
            case 'add':
                endpoint = '/memory/add';
                break;
            case 'search':
                endpoint = '/memory/search';
                break;
            case 'user_profile':
                endpoint = '/memory/user';
                break;
            case 'user_fact':
                endpoint = '/memory/user/fact';
                break;
            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Backend error' }));
            return NextResponse.json(err, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Memory proxy error:', error);
        return NextResponse.json(
            { error: error.message || 'Memory service unavailable' },
            { status: 502 }
        );
    }
}

// GET /api/memory?user_id=xxx&type=profile|facts|context|all
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id') || 'default';
        const type = searchParams.get('type') || 'context';

        let endpoint: string;
        switch (type) {
            case 'profile':
                endpoint = `/memory/user/${userId}`;
                break;
            case 'facts':
                endpoint = `/memory/user/${userId}/facts`;
                break;
            case 'context':
                endpoint = `/memory/user/${userId}/context`;
                break;
            case 'all':
                endpoint = `/memory/all/${userId}`;
                break;
            default:
                return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
        }

        const resp = await fetch(`${BACKEND_URL}${endpoint}`);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Backend error' }));
            return NextResponse.json(err, { status: resp.status });
        }

        const data = await resp.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Memory GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Memory service unavailable' },
            { status: 502 }
        );
    }
}
