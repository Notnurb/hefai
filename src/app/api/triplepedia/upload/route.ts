import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const BUCKET = 'triplepedia-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const supabase = getAdminClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });
        if (!ALLOWED_MIMES.has(file.type)) return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images allowed' }, { status: 400 });
        if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 413 });

        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(filename, buffer, { contentType: file.type, upsert: false });

        if (uploadError) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename);
        return NextResponse.json({ url: publicUrl });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
