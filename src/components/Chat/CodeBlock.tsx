'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';

interface CodeBlockProps {
    language: string;
    value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Custom style overrides to match the design system
    const customStyle: React.CSSProperties = {
        margin: 0,
        borderRadius: '1rem',
        fontSize: '0.85rem',
        lineHeight: '1.6',
    };

    return (
        <div className="relative group my-4 rounded-2xl overflow-hidden border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-accent/30">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 p-1.5 rounded-lg hover:bg-accent"
                >
                    {copied ? (
                        <>
                            <HugeiconsIcon icon={Tick02Icon} size={14} className="text-green-500" />
                            <span>Copied</span>
                        </>
                    ) : (
                        <>
                            <HugeiconsIcon icon={Copy01Icon} size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code */}
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={customStyle}
                showLineNumbers
                wrapLongLines
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
}
