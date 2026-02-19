import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
        });

        // Sign JWT
        const token = await signToken({ userId: user.id, email: user.email });

        // Set cookie
        const response = NextResponse.json(
            { message: "User registered successfully" },
            { status: 201 }
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
        console.error("Registration error:", error);

        // Handle Prisma connection errors specifically
        if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
            return NextResponse.json(
                { error: "Database connection failed. Please ensure your database server is running." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to register" },
            { status: 500 }
        );
    }
}
