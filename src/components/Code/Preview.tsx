'use client';

import { useMemo } from 'react';
import { Loader2, Monitor } from 'lucide-react';

interface PreviewProps {
    html: string;
    isGenerating: boolean;
}

export default function Preview({ html, isGenerating }: PreviewProps) {
    const isEmpty = !html || html.includes('No HTML file');

    const srcDoc = useMemo(() => html, [html]);

    return (
        <div className="relative h-full w-full bg-white">
            {isEmpty ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground">
                    <Monitor className="h-8 w-8 opacity-60" />
                    <p className="text-sm">Preview will appear here</p>
                </div>
            ) : (
                <iframe
                    srcDoc={srcDoc}
                    className="h-full w-full border-0"
                    sandbox="allow-scripts allow-modals allow-forms"
                    title="Preview"
                />
            )}

            {isGenerating && (
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md bg-black/70 px-2.5 py-1.5 text-xs text-white">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Building...
                </div>
            )}
        </div>
    );
}
