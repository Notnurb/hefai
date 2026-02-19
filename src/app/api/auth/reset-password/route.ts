import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
        }

        // Find token
        // In forgot-password we stored the token directly (or hash).
        // Let's assume we stored it directly based on previous step.
        // Wait, in previous step I hashed it: `resetTokenHash`.
        // So the token passed in URL is `resetTokenHash`.
        // So we look it up directly.

        const resetTokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetTokenRecord) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        // Check expiration
        if (new Date() > resetTokenRecord.expiresAt) {
            // Clean up
            await prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
            return NextResponse.json({ error: "Token expired" }, { status: 400 });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update user
        await prisma.user.update({
            where: { id: resetTokenRecord.userId },
            data: { passwordHash },
        });

        // Delete token (and potentially all other tokens for this user?)
        await prisma.passwordResetToken.deleteMany({
            where: { userId: resetTokenRecord.userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
