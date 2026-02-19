import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user via Supabase
        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            // Try fallback to 'user' lowercase table if 'User' not found?
            // Actually, for security, generic error.
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Sign JWT
        const token = await signToken({ userId: user.id, email: user.email });

        // Set cookie
        const response = NextResponse.json(
            { message: "Logged in successfully" },
            { status: 200 }
        );

        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error: any) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to login" },
            { status: 500 }
        );
    }
}
