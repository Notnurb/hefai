'use client';

import React, { useMemo } from 'react';
import { CodeFile } from '@/types';
import { cn } from '@/lib/utils';

interface FileTreeProps {
    files: CodeFile[];
    activeFile: string | null;
    onSelectFile: (path: string) => void;
}

interface TreeNode {
    name: string;
    path: string;
    isDir: boolean;
    children: TreeNode[];
}

function buildTree(files: CodeFile[]): TreeNode[] {
    const root: TreeNode[] = [];

    for (const file of files) {
        const parts = file.path.split('/');
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            const existingNode = current.find(n => n.name === part);

            if (existingNode) {
                current = existingNode.children;
            } else {
                const node: TreeNode = {
                    name: part,
                    path: parts.slice(0, i + 1).join('/'),
                    isDir: !isLast,
                    children: [],
                };
                current.push(node);
                current = node.children;
            }
        }
    }

    // Sort: folders first, then alphabetical
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.sort((a, b) => {
            if (a.isDir && !b.isDir) return -1;
            if (!a.isDir && b.isDir) return 1;
            return a.name.localeCompare(b.name);
        }).map(n => ({ ...n, children: sortNodes(n.children) }));
    };

    return sortNodes(root);
}

function getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, string> = {
        html: '🌐', css: '🎨', ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️',
        json: '📋', md: '📝', svg: '🖼️', png: '🖼️', jpg: '🖼️',
    };
    return icons[ext] || '📄';
}

function TreeItem({
    node,
    depth,
    activeFile,
    onSelectFile,
}: {
    node: TreeNode;
    depth: number;
    activeFile: string | null;
    onSelectFile: (path: string) => void;
}) {
    const [expanded, setExpanded] = React.useState(true);

    if (node.isDir) {
        return (
            <div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    <span className="text-[10px] opacity-60">{expanded ? '▼' : '▶'}</span>
                    <span className="opacity-70">📁</span>
                    <span className="truncate">{node.name}</span>
                </button>
                {expanded && node.children.map(child => (
                    <TreeItem
                        key={child.path}
                        node={child}
                        depth={depth + 1}
                        activeFile={activeFile}
                        onSelectFile={onSelectFile}
                    />
                ))}
            </div>
        );
    }

    return (
        <button
            onClick={() => onSelectFile(node.path)}
            className={cn(
                "w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors",
                activeFile === node.path
                    ? "bg-brand/15 text-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
            <span className="text-[10px]">{getFileIcon(node.name)}</span>
            <span className="truncate">{node.name}</span>
        </button>
    );
}

export default function FileTree({ files, activeFile, onSelectFile }: FileTreeProps) {
    const tree = useMemo(() => buildTree(files), [files]);

    if (files.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground/50 px-4 text-center">
                No files yet. Send a message to get started.
            </div>
        );
    }

    return (
        <div className="py-1.5 overflow-y-auto h-full scrollbar-thin">
            {tree.map(node => (
                <TreeItem
                    key={node.path}
                    node={node}
                    depth={0}
                    activeFile={activeFile}
                    onSelectFile={onSelectFile}
                />
            ))}
        </div>
    );
}
