'use client';

import { useState, useCallback, useRef } from 'react';
import {
    CodeFile,
    CodeChatMessage,
    FileOperation,
    EpilsonTierId,
    CodeCloudConfig,
    CodeDesignConfig,
    CodeGenerationMetrics,
    CodePublishMetadata,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'hefai_code_projects';

interface CodeProjectState {
    files: CodeFile[];
    chatHistory: CodeChatMessage[];
    activeFile: string | null;
    openTabs: string[];
}

interface SendCodeMessageOptions {
    planMode?: boolean;
    cloudConfig?: CodeCloudConfig;
    designConfig?: CodeDesignConfig;
    selectedModelId?: string;
    extendedThinking?: boolean;
}

export function useCodeGen() {
    const [project, setProject] = useState<CodeProjectState>({
        files: [],
        chatHistory: [],
        activeFile: null,
        openTabs: [],
    });
    const [tier, setTier] = useState<EpilsonTierId>('pro');
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<CodeGenerationMetrics>({
        generationCount: 0,
        successCount: 0,
        failedCount: 0,
        totalOperations: 0,
        avgGenerationMs: 0,
        lastGenerationMs: 0,
    });
    const abortRef = useRef<AbortController | null>(null);

    // ─── File Operations ───────────────────────────────────────────────

    const openFile = useCallback((path: string) => {
        setProject(prev => ({
            ...prev,
            activeFile: path,
            openTabs: prev.openTabs.includes(path)
                ? prev.openTabs
                : [...prev.openTabs, path],
        }));
    }, []);

    const closeTab = useCallback((path: string) => {
        setProject(prev => {
            const newTabs = prev.openTabs.filter(t => t !== path);
            return {
                ...prev,
                openTabs: newTabs,
                activeFile: prev.activeFile === path
                    ? newTabs[newTabs.length - 1] || null
                    : prev.activeFile,
            };
        });
    }, []);

    const updateFileContent = useCallback((path: string, content: string) => {
        setProject(prev => ({
            ...prev,
            files: prev.files.map(f =>
                f.path === path ? { ...f, content } : f
            ),
        }));
    }, []);

    const getActiveFile = useCallback((): CodeFile | undefined => {
        return project.files.find(f => f.path === project.activeFile);
    }, [project.files, project.activeFile]);

    // ─── Apply file operations from AI ─────────────────────────────────

    const applyOperations = useCallback((ops: FileOperation[]) => {
        setProject(prev => {
            let newFiles = [...prev.files];
            let newTabs = [...prev.openTabs];
            let newActive = prev.activeFile;

            for (const op of ops) {
                if (op.type === 'create') {
                    // Remove existing file with same path if any
                    newFiles = newFiles.filter(f => f.path !== op.path);
                    newFiles.push({
                        path: op.path,
                        content: op.content || '',
                        language: op.language || 'text',
                    });
                    // Open the new file in a tab
                    if (!newTabs.includes(op.path)) {
                        newTabs.push(op.path);
                    }
                    newActive = op.path;
                } else if (op.type === 'modify') {
                    newFiles = newFiles.map(f =>
                        f.path === op.path
                            ? { ...f, content: op.content || f.content }
                            : f
                    );
                    if (!newTabs.includes(op.path)) {
                        newTabs.push(op.path);
                    }
                    newActive = op.path;
                } else if (op.type === 'delete') {
                    newFiles = newFiles.filter(f => f.path !== op.path);
                    newTabs = newTabs.filter(t => t !== op.path);
                    if (newActive === op.path) {
                        newActive = newTabs[newTabs.length - 1] || null;
                    }
                }
            }

            return {
                ...prev,
                files: newFiles,
                openTabs: newTabs,
                activeFile: newActive,
            };
        });
    }, []);

    // ─── Send message to AI ────────────────────────────────────────────

    const sendMessage = useCallback(async (message: string, options: SendCodeMessageOptions = {}) => {
        if (!message.trim() || isGenerating) return;

        const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        setError(null);
        setIsGenerating(true);
        setStreamingText('');

        // Add user message to chat
        const userMsg: CodeChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: message,
            timestamp: new Date(),
        };

        setProject(prev => ({
            ...prev,
            chatHistory: [...prev.chatHistory, userMsg],
        }));

        try {
            const controller = new AbortController();
            abortRef.current = controller;

            const res = await fetch('/api/code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    tier,
                    planMode: Boolean(options.planMode),
                    cloudConfig: options.cloudConfig,
                    designConfig: options.designConfig,
                    selectedModelId: options.selectedModelId,
                    extendedThinking: Boolean(options.extendedThinking),
                    chatHistory: project.chatHistory.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    files: project.files,
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(errData.error || `Error ${res.status}`);
            }

            const data = await res.json();
            const durationMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startMs;
            const opCount = Array.isArray(data.operations) ? data.operations.length : 0;

            setMetrics(prev => {
                const generationCount = prev.generationCount + 1;
                const successCount = prev.successCount + 1;
                const totalOperations = prev.totalOperations + opCount;
                const avgGenerationMs = ((prev.avgGenerationMs * prev.successCount) + durationMs) / successCount;
                return {
                    generationCount,
                    successCount,
                    failedCount: prev.failedCount,
                    totalOperations,
                    avgGenerationMs,
                    lastGenerationMs: durationMs,
                    lastGeneratedAt: new Date().toISOString(),
                };
            });

            // Apply file operations
            if (data.operations && data.operations.length > 0) {
                const ops: FileOperation[] = data.operations.map((op: any) => ({
                    type: op.type as 'create' | 'modify' | 'delete',
                    path: op.path,
                    content: op.content,
                    language: op.language,
                }));
                applyOperations(ops);

                // Add assistant message with file ops
                const assistantMsg: CodeChatMessage = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: options.planMode
                        ? (data.plan || 'Plan created and code generated.')
                        : (data.message || `Applied ${ops.length} code update${ops.length === 1 ? '' : 's'}.`),
                    fileOps: ops,
                    timestamp: new Date(),
                };

                setProject(prev => ({
                    ...prev,
                    chatHistory: [...prev.chatHistory, assistantMsg],
                }));
            } else {
                // Just a chat response, no file ops
                const assistantMsg: CodeChatMessage = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: options.planMode
                        ? (data.plan || 'I\'m not sure how to help with that.')
                        : (data.message || data.plan || 'No code updates were needed.'),
                    timestamp: new Date(),
                };

                setProject(prev => ({
                    ...prev,
                    chatHistory: [...prev.chatHistory, assistantMsg],
                }));
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                const durationMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startMs;
                setMetrics(prev => ({
                    generationCount: prev.generationCount + 1,
                    successCount: prev.successCount,
                    failedCount: prev.failedCount + 1,
                    totalOperations: prev.totalOperations,
                    avgGenerationMs: prev.avgGenerationMs,
                    lastGenerationMs: durationMs,
                    lastGeneratedAt: new Date().toISOString(),
                }));
                setError(err.message || 'Generation failed');
                // Add error message to chat
                const errorMsg: CodeChatMessage = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: `⚠️ Error: ${err.message || 'Generation failed'}`,
                    timestamp: new Date(),
                };
                setProject(prev => ({
                    ...prev,
                    chatHistory: [...prev.chatHistory, errorMsg],
                }));
            }
        } finally {
            setIsGenerating(false);
            setStreamingText('');
            abortRef.current = null;
        }
    }, [isGenerating, tier, project.chatHistory, project.files, applyOperations]);

    // ─── Cancel generation ─────────────────────────────────────────────

    const cancelGeneration = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    // ─── Reset project ─────────────────────────────────────────────────

    const resetProject = useCallback(() => {
        setProject({
            files: [],
            chatHistory: [],
            activeFile: null,
            openTabs: [],
        });
        setMetrics({
            generationCount: 0,
            successCount: 0,
            failedCount: 0,
            totalOperations: 0,
            avgGenerationMs: 0,
            lastGenerationMs: 0,
        });
        setError(null);
    }, []);

    // ─── Build preview HTML ────────────────────────────────────────────

    const buildPreviewHtml = useCallback((): string => {
        const htmlFile = project.files.find(f => f.path.endsWith('.html'));
        if (!htmlFile) {
            return `<!DOCTYPE html>
<html><head><style>
  body { display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#0a0a0a; color:#666; font-family:system-ui; }
</style></head><body><p>No HTML file in project</p></body></html>`;
        }

        let html = htmlFile.content;

        // Inline CSS files
        const cssFiles = project.files.filter(f => f.path.endsWith('.css'));
        for (const css of cssFiles) {
            const linkRegex = new RegExp(`<link[^>]*href=["']${css.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*/?>`, 'gi');
            if (linkRegex.test(html)) {
                html = html.replace(linkRegex, `<style>${css.content}</style>`);
            } else {
                // Inject before </head>
                html = html.replace('</head>', `<style>/* ${css.path} */\n${css.content}</style>\n</head>`);
            }
        }

        // Inline JS/TS files
        const jsFiles = project.files.filter(f =>
            f.path.endsWith('.js') || f.path.endsWith('.ts')
        );
        for (const js of jsFiles) {
            let code = js.content;
            // Simple TypeScript → JavaScript strip (remove type annotations)
            if (js.path.endsWith('.ts') || js.path.endsWith('.tsx')) {
                code = stripTypeAnnotations(code);
            }
            const scriptRegex = new RegExp(`<script[^>]*src=["']${js.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>\\s*</script>`, 'gi');
            if (scriptRegex.test(html)) {
                html = html.replace(scriptRegex, `<script>${code}</script>`);
            } else {
                html = html.replace('</body>', `<script>/* ${js.path} */\n${code}</script>\n</body>`);
            }
        }

        return html;
    }, [project.files]);

    const publishProject = useCallback(async (metadata: CodePublishMetadata) => {
        const html = buildPreviewHtml();
        const res = await fetch('/api/code/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                metadata,
                html,
                files: project.files,
                publishedAt: new Date().toISOString(),
            }),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: 'Publish failed' }));
            throw new Error(errData.error || `Publish failed (${res.status})`);
        }

        return res.json();
    }, [buildPreviewHtml, project.files]);

    return {
        project,
        tier,
        setTier,
        isGenerating,
        streamingText,
        error,
        metrics,
        sendMessage,
        cancelGeneration,
        openFile,
        closeTab,
        updateFileContent,
        getActiveFile,
        resetProject,
        buildPreviewHtml,
        publishProject,
    };
}

/**
 * Very basic TypeScript → JavaScript transform.
 * Strips type annotations, interfaces, and type keywords.
 * For a real app you'd use something like esbuild or sucrase.
 */
function stripTypeAnnotations(code: string): string {
    return code
        // Remove interface/type declarations
        .replace(/^(export\s+)?(interface|type)\s+\w+[\s\S]*?^}/gm, '')
        // Remove ': Type' annotations on variables/params
        .replace(/:\s*[A-Z]\w*(\[\])?(\s*[=,\)\{])/g, '$2')
        // Remove <Type> generics
        .replace(/<[A-Z]\w*(\s*,\s*[A-Z]\w*)*>/g, '')
        // Remove 'as Type' assertions
        .replace(/\s+as\s+\w+/g, '')
        // Remove 'import type' statements
        .replace(/^import\s+type\s+.*;\s*$/gm, '')
        .trim();
}
