import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, model } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Generate a short, concise, and natural title (3-6 words max) for a conversation that starts with the user\'s message. Do not use quotes, do not use "Topic:", do not use "Title:". Just return the plain text title. Examples: "React Hook Refactoring", "Vacation Planning in Italy", "Debugging Python Script".'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                model: 'grok-3-mini', // suzhou-3
                stream: false,
                temperature: 0.5,
                max_tokens: 15,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Title generation failed:', error);
            return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
        }

        const data = await response.json();
        const title = data.choices?.[0]?.message?.content?.trim() || 'New Chat';

        // Remove any surrounding quotes just in case
        const cleanTitle = title.replace(/^["']|["']$/g, '');

        return NextResponse.json({ title: cleanTitle });
    } catch (error: any) {
        console.error('Title API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
