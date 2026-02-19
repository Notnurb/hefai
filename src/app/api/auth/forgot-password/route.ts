import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json({ success: true });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Hash token for storage? Or just store straight. 
        // For simplicity, let's store robust random token.
        // Or better, hash it.
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Expire in 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetTokenHash,
                expiresAt,
            },
        });

        // In a real app, send email here.
        // For development, log the link.
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetTokenHash}`;

        console.log("==================================================================");
        console.log("PASSWORD RESET REQUEST FOR:", email);
        console.log("RESET LINK:", resetUrl);
        console.log("==================================================================");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
