'use client';

import React, { useRef, useCallback } from 'react';
import { CodeFile } from '@/types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface CodeEditorProps {
    files: CodeFile[];
    activeFile: string | null;
    openTabs: string[];
    isGenerating: boolean;
    onSelectTab: (path: string) => void;
    onCloseTab: (path: string) => void;
    onUpdateContent: (path: string, content: string) => void;
}

function getTabIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, string> = {
        html: '🌐', css: '🎨', ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️',
        json: '📋', md: '📝',
    };
    return icons[ext] || '📄';
}

function getHighlightLang(language: string): string {
    const map: Record<string, string> = {
        typescript: 'typescript', javascript: 'javascript',
        html: 'xml', css: 'css', json: 'json', markdown: 'markdown',
        python: 'python', xml: 'xml',
    };
    return map[language] || 'plaintext';
}

export default function CodeEditor({
    files,
    activeFile,
    openTabs,
    isGenerating,
    onSelectTab,
    onCloseTab,
    onUpdateContent,
}: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const currentFile = files.find(f => f.path === activeFile);
    const [showEditor, setShowEditor] = React.useState(false);

    const handleEdit = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (activeFile) {
            onUpdateContent(activeFile, e.target.value);
        }
    }, [activeFile, onUpdateContent]);

    if (openTabs.length === 0 || !currentFile) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-sm">No file open</p>
                <p className="text-xs mt-1">Select a file from the tree or generate code</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="flex items-center border-b border-border bg-background/50 overflow-x-auto scrollbar-thin">
                {openTabs.map(tabPath => {
                    const fileName = tabPath.split('/').pop() || tabPath;
                    const isActive = tabPath === activeFile;
                    return (
                        <div
                            key={tabPath}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 text-xs border-r border-border cursor-pointer shrink-0 transition-colors",
                                isActive
                                    ? "bg-card text-foreground border-b-2 border-b-brand"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                            )}
                            onClick={() => onSelectTab(tabPath)}
                        >
                            <span className="text-[10px]">{getTabIcon(fileName)}</span>
                            <span className="max-w-[120px] truncate">{fileName}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onCloseTab(tabPath); }}
                                className="ml-1 p-0.5 rounded hover:bg-destructive/20 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Editor area */}
            <div className="flex-1 overflow-auto relative">
                {showEditor && !isGenerating ? (
                    /* Editable textarea */
                    <div className="flex h-full">
                        {/* Line numbers */}
                        <div className="py-3 px-2 text-right select-none bg-[#1e1e2e] border-r border-border/30">
                            {currentFile.content.split('\n').map((_, i) => (
                                <div key={i} className="text-[11px] leading-[20px] text-muted-foreground/30 font-mono">
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={currentFile.content}
                            onChange={handleEdit}
                            spellCheck={false}
                            className="flex-1 min-h-full p-3 font-mono text-[13px] leading-[20px] bg-[#1e1e2e] text-[#d4d4d4] border-0 outline-none resize-none scrollbar-thin"
                        />
                    </div>
                ) : (
                    /* Syntax highlighted view */
                    <div
                        className="cursor-text"
                        onClick={() => !isGenerating && setShowEditor(true)}
                    >
                        <SyntaxHighlighter
                            language={getHighlightLang(currentFile.language)}
                            style={atomOneDark}
                            showLineNumbers
                            lineNumberStyle={{
                                color: 'rgba(255,255,255,0.15)',
                                fontSize: '11px',
                                paddingRight: '12px',
                                minWidth: '2.5em',
                            }}
                            customStyle={{
                                margin: 0,
                                padding: '12px 0',
                                background: '#1e1e2e',
                                fontSize: '13px',
                                lineHeight: '20px',
                                minHeight: '100%',
                            }}
                        >
                            {currentFile.content || ' '}
                        </SyntaxHighlighter>
                    </div>
                )}

                {/* Generating overlay */}
                {isGenerating && (
                    <div className="absolute top-2 right-2 flex items-center gap-2 bg-brand/20 backdrop-blur-sm text-brand text-xs px-3 py-1.5 rounded-lg">
                        <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        Generating...
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-background/50 text-[10px] text-muted-foreground/60">
                <div className="flex items-center gap-3">
                    <span>{currentFile.language}</span>
                    <span>{currentFile.content.split('\n').length} lines</span>
                </div>
                <button
                    onClick={() => setShowEditor(!showEditor)}
                    className="hover:text-foreground transition-colors"
                >
                    {showEditor ? 'View mode' : 'Edit mode'}
                </button>
            </div>
        </div>
    );
}
