import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// POST /api/agents — proxy to Python backend for multi-AI collaboration
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, num_agents, conversation_history, stream = false } = body;

        const endpoint = stream ? '/agents/collaborate/stream' : '/agents/collaborate';

        const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, num_agents, conversation_history }),
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Backend error' }));
            return NextResponse.json(err, { status: resp.status });
        }

        // If streaming, proxy the SSE stream
        if (stream && resp.body) {
            return new Response(resp.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        const data = await resp.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Agents proxy error:', error);
        return NextResponse.json(
            { error: error.message || 'Agent service unavailable' },
            { status: 502 }
        );
    }
}

// GET /api/agents — get agent roster
export async function GET() {
    try {
        const resp = await fetch(`${BACKEND_URL}/agents/roster`);
        if (!resp.ok) {
            return NextResponse.json({ error: 'Backend error' }, { status: resp.status });
        }
        const data = await resp.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Agent service unavailable' },
            { status: 502 }
        );
    }
}
