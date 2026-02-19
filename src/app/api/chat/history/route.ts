import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { verifyToken } from "@/lib/auth/jwt";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ conversations: [] }, { status: 200 });
        }

        try {
            const payload = await verifyToken(token);

            // Fetch conversations with their messages
            // Note: DB table names are case-sensitive if created via Prisma
            const { data: conversations, error } = await supabase
                .from('Conversation')
                .select(`
                    id, 
                    title, 
                    model, 
                    updatedAt, 
                    createdAt,
                    messages: Message (
                        id, 
                        role, 
                        content, 
                        createdAt, 
                        model: tone,
                        attachments
                    )
                `)
                .eq('userId', payload.userId)
                .is('deletedAt', null)
                .order('updatedAt', { ascending: false });

            if (error) {
                console.error("Supabase error:", error);
                return NextResponse.json({ conversations: [] }, { status: 200 });
            }

            // Transform for frontend if needed
            const formatted = conversations?.map(c => ({
                ...c,
                messages: Array.isArray(c.messages)
                    ? c.messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((m: any) => ({
                            ...m,
                            timestamp: m.createdAt // Map createdAt to timestamp for frontend
                        }))
                    : []
            }));

            return NextResponse.json({ conversations: formatted || [] });
        } catch (jwtError) {
            return NextResponse.json({ conversations: [] }, { status: 200 });
        }
    } catch (error: any) {
        console.error("History fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
