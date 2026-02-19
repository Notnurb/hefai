import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { verifyToken } from "@/lib/auth/jwt";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        try {
            const payload = await verifyToken(token);

            // Fetch user from Supabase directly
            // Note: Table name is 'User' (case sensitive due to Prisma)
            const { data: user, error } = await supabase
                .from('User')
                .select('id, name, email, bio, image')
                .eq('id', payload.userId)
                .single();

            if (error || !user) {
                // Determine if table case is issue? Try lowercase if fail?
                // For now assumes 'User' matches Prisma.
                return NextResponse.json({ user: null }, { status: 200 });
            }

            return NextResponse.json({ user });
        } catch (jwtError) {
            return NextResponse.json({ user: null }, { status: 200 });
        }
    } catch (error: any) {
        console.error("Auth check error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
