import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { ClerkProvider } from '@clerk/nextjs'

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

const SITE_FAVICON_URL = 'https://drive.google.com/uc?export=view&id=1mO0eYxOkAQS5zafmN-aJuGow7uIDt8Oo';

export const metadata: Metadata = {
    title: "Hefai — AI Chat",
    description: "Production-grade AI chat application powered by Taipei, Majuli, and Suzhou models.",
    icons: {
        icon: [{ url: SITE_FAVICON_URL }],
        shortcut: [{ url: SITE_FAVICON_URL }],
        apple: [{ url: SITE_FAVICON_URL }],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning className={outfit.variable}>
                <body className={cn("min-h-screen bg-background font-sans antialiased")}>
                    <Providers>{children}</Providers>
                </body>
            </html>
        </ClerkProvider>
    );
}
