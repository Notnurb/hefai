import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function PATCH(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let userId: string;
        try {
            const payload = await verifyToken(token);
            userId = payload.userId as string;
        } catch (error) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const { name, bio, image } = body;

        // Basic validation
        if (name && typeof name !== 'string') {
            return NextResponse.json({ error: "Invalid name" }, { status: 400 });
        }
        if (bio && typeof bio !== 'string') {
            return NextResponse.json({ error: "Invalid bio" }, { status: 400 });
        }
        // image validation (optional, maybe check if valid URL or base64)

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name !== undefined && { name }),
                ...(bio !== undefined && { bio }),
                ...(image !== undefined && { image }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                image: true,
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
