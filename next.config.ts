import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    serverExternalPackages: [
        'bcrypt',
        '@prisma/client',
        '@supabase/supabase-js',
        '@supabase/ssr',
        'jose',
    ],
};

export default nextConfig;
