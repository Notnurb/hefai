'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function TypingIndicator() {
    return (
        <div className="flex space-x-1 items-center h-4">
            <div className="typing-dot w-1.5 h-1.5 bg-foreground/50 rounded-full" />
            <div className="typing-dot w-1.5 h-1.5 bg-foreground/50 rounded-full" />
            <div className="typing-dot w-1.5 h-1.5 bg-foreground/50 rounded-full" />
        </div>
    );
}
