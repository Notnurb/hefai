'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {
    BarChart3,
    CheckCircle2,
    CloudCog,
    Code2,
    Database,
    ExternalLink,
    FileCode2,
    Globe,
    GripVertical,
    Layers,
    Loader2,
    Palette,
    Rocket,
    Save,
    X,
} from 'lucide-react';
import { useCodeGen } from '@/hooks/useCodeGen';
import { CodeCloudConfig, CodeDesignConfig, CodePublishMetadata } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Preview from '@/components/Code/Preview';
import CodeEditor from '@/components/Code/CodeEditor';
import CodeChatInput from '@/components/Code/CodeChatInput';
import ModelSelector from '@/components/Chat/ModelSelector';
import { toast } from 'sonner';

type StudioTab = 'cloud' | 'design' | 'code' | 'preview' | 'stats';

const CLOUD_STORAGE_KEY = 'hefai_code_cloud_config_v2';
const DESIGN_STORAGE_KEY = 'hefai_code_design_config_v2';

const DEFAULT_CLOUD_CONFIG: CodeCloudConfig = {
    provider: 'builtin',
    apiKey: '',
    model: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceRoleKey: '',
};

const DEFAULT_DESIGN_CONFIG: CodeDesignConfig = {
    reactLibrary: 'shadcn',
    mainColor: '#3b82f6',
    accentColor: '#0f172a',
    buttonTheme: 'rounded',
    compactSpacing: false,
    highContrast: false,
    enableAnimations: true,
    strongShadows: false,
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
}

function getFileBadge(path: string) {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    if (ext === 'tsx' || ext === 'ts' || ext === 'jsx' || ext === 'js') return 'Code';
    if (ext === 'css' || ext === 'scss') return 'Style';
    if (ext === 'html') return 'Markup';
    return ext.toUpperCase() || 'File';
}

function countLines(content: string) {
    if (!content) return 0;
    return content.split('\n').length;
}

function TopTabButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onToggle,
}: {
    label: string;
    description: string;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent/40"
        >
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <span
                className={cn(
                    'rounded-md px-2 py-1 text-xs font-semibold',
                    checked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                )}
            >
                {checked ? 'On' : 'Off'}
            </span>
        </button>
    );
}

export default function CodePage() {
    const codeGen = useCodeGen();
    const containerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const resizeStateRef = useRef({ startX: 0, startWidth: 44 });
    const [activeTab, setActiveTab] = useState<StudioTab>('code');
    const [chatPaneWidth, setChatPaneWidth] = useState(44);
    const [isResizing, setIsResizing] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [selectedModelId, setSelectedModelId] = useState('tura-3');
    const [extendedThinking, setExtendedThinking] = useState(false);
    const [cloudConfig, setCloudConfig] = useState<CodeCloudConfig>(DEFAULT_CLOUD_CONFIG);
    const [designConfig, setDesignConfig] = useState<CodeDesignConfig>(DEFAULT_DESIGN_CONFIG);
    const [deployOpen, setDeployOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishUrl, setPublishUrl] = useState<string | null>(null);
    const [publishError, setPublishError] = useState<string | null>(null);
    const [publishedCount, setPublishedCount] = useState(0);
    const [slugTouched, setSlugTouched] = useState(false);
    const [publishMeta, setPublishMeta] = useState<CodePublishMetadata>({
        slug: '',
        title: '',
        description: '',
        favicon: '',
        image: '',
    });

    useEffect(() => {
        try {
            const storedCloud = localStorage.getItem(CLOUD_STORAGE_KEY);
            const storedDesign = localStorage.getItem(DESIGN_STORAGE_KEY);
            if (storedCloud) setCloudConfig({ ...DEFAULT_CLOUD_CONFIG, ...JSON.parse(storedCloud) });
            if (storedDesign) setDesignConfig({ ...DEFAULT_DESIGN_CONFIG, ...JSON.parse(storedDesign) });
        } catch {
            // ignore bad local storage payloads
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(cloudConfig));
    }, [cloudConfig]);

    useEffect(() => {
        localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(designConfig));
    }, [designConfig]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const sync = () => setIsDesktop(mediaQuery.matches);
        sync();
        mediaQuery.addEventListener('change', sync);
        return () => mediaQuery.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const handleMove = (event: MouseEvent) => {
            if (!containerRef.current) return;
            const delta = event.clientX - resizeStateRef.current.startX;
            const containerWidth = containerRef.current.getBoundingClientRect().width || 1;
            const widthDeltaPercent = (delta / containerWidth) * 100;
            const nextWidth = resizeStateRef.current.startWidth + widthDeltaPercent;
            setChatPaneWidth(Math.min(72, Math.max(28, nextWidth)));
        };

        const handleUp = () => setIsResizing(false);

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);

        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isResizing]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [codeGen.project.chatHistory.length, codeGen.isGenerating]);

    useEffect(() => {
        if (!codeGen.project.activeFile && codeGen.project.files.length > 0) {
            codeGen.openFile(codeGen.project.files[0].path);
        }
    }, [codeGen.project.activeFile, codeGen.project.files, codeGen.openFile]);

    const refreshPublishedCount = useCallback(async () => {
        try {
            const res = await fetch('/api/code/publish', { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            setPublishedCount(Array.isArray(data.sites) ? data.sites.length : 0);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        refreshPublishedCount();
    }, [refreshPublishedCount]);

    const previewHtml = useMemo(() => codeGen.buildPreviewHtml(), [codeGen.buildPreviewHtml]);

    const userMessageCount = useMemo(
        () => codeGen.project.chatHistory.filter((m) => m.role === 'user').length,
        [codeGen.project.chatHistory]
    );

    const totalLines = useMemo(
        () => codeGen.project.files.reduce((sum, file) => sum + countLines(file.content), 0),
        [codeGen.project.files]
    );

    const cloudConnected = cloudConfig.provider === 'builtin' || Boolean(cloudConfig.apiKey?.trim());
    const supabaseConnected = Boolean(cloudConfig.supabaseUrl?.trim() && cloudConfig.supabaseAnonKey?.trim());

    const toggleExtendedThinking = useCallback(() => {
        setExtendedThinking((current) => !current);
    }, []);

    const startResize = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (!isDesktop || !containerRef.current) return;
            resizeStateRef.current = { startX: event.clientX, startWidth: chatPaneWidth };
            setIsResizing(true);
        },
        [chatPaneWidth, isDesktop]
    );

    const handleSend = useCallback(
        (input: string, options: { planMode: boolean }) => {
            codeGen.sendMessage(input, {
                planMode: options.planMode,
                cloudConfig,
                designConfig,
                selectedModelId,
                extendedThinking,
            });
        },
        [codeGen, cloudConfig, designConfig, selectedModelId, extendedThinking]
    );

    const saveCloudSettings = useCallback(() => {
        localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(cloudConfig));
        toast.success('Cloud settings saved');
    }, [cloudConfig]);

    const saveDesignSettings = useCallback(() => {
        localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(designConfig));
        toast.success('Design settings saved');
    }, [designConfig]);

    const openDeploy = useCallback(() => {
        const baseTitle =
            publishMeta.title ||
            (codeGen.project.chatHistory.find((m) => m.role === 'user')?.content.slice(0, 42) || 'My app');
        const normalizedTitle = baseTitle.trim();

        setPublishMeta((prev) => ({
            ...prev,
            title: normalizedTitle,
            slug: prev.slug || slugify(normalizedTitle),
        }));
        setPublishError(null);
        setPublishUrl(null);
        setDeployOpen(true);
    }, [codeGen.project.chatHistory, publishMeta.title]);

    const publish = useCallback(async () => {
        if (!publishMeta.title.trim()) {
            setPublishError('Title is required');
            return;
        }

        const slug = slugify(publishMeta.slug || publishMeta.title);
        if (!slug || slug.length < 2) {
            setPublishError('Slug must be at least 2 characters');
            return;
        }

        setPublishing(true);
        setPublishError(null);
        try {
            const result = await codeGen.publishProject({
                ...publishMeta,
                slug,
                title: publishMeta.title.trim(),
            });
            setPublishUrl(result.url);
            toast.success(`Published at ${result.url}`);
            refreshPublishedCount();
        } catch (error: any) {
            setPublishError(error?.message || 'Failed to publish');
        } finally {
            setPublishing(false);
        }
    }, [codeGen, publishMeta, refreshPublishedCount]);

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
            <header className="flex h-14 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
                    <TopTabButton active={activeTab === 'cloud'} onClick={() => setActiveTab('cloud')} icon={CloudCog} label="Cloud" />
                    <TopTabButton active={activeTab === 'design'} onClick={() => setActiveTab('design')} icon={Palette} label="Design" />
                    <TopTabButton active={activeTab === 'code'} onClick={() => setActiveTab('code')} icon={Code2} label="Code" />
                    <TopTabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} icon={Globe} label="Preview" />
                    <TopTabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={BarChart3} label="Stats" />
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={openDeploy} className="gap-2">
                        <Rocket className="h-4 w-4" />
                        Deploy
                    </Button>
                </div>
            </header>

            <div ref={containerRef} className="flex min-h-0 flex-1 flex-col lg:flex-row">
                <section
                    className="flex h-[52%] min-h-[360px] flex-col border-b border-border lg:h-auto lg:flex-none lg:border-b-0"
                    style={isDesktop ? { width: `${chatPaneWidth}%` } : undefined}
                >
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold">Code Chat</h2>
                            <p className="text-xs text-muted-foreground">
                                Prompts: {userMessageCount} | Provider: {cloudConfig.provider}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ModelSelector
                                selectedModelId={selectedModelId}
                                onSelectModel={setSelectedModelId}
                                extendedThinking={extendedThinking}
                                onToggleExtended={toggleExtendedThinking}
                            />
                            {codeGen.isGenerating && (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Generating
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {codeGen.project.chatHistory.length === 0 && (
                            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                Describe what to build. With Plan off, code is generated immediately.
                            </div>
                        )}

                        {codeGen.project.chatHistory.map((msg) => (
                            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                <div
                                    className={cn(
                                        'max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                                        msg.role === 'user'
                                            ? 'rounded-br-md bg-primary text-primary-foreground'
                                            : 'rounded-bl-md border border-border bg-card text-card-foreground'
                                    )}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    ) : (
                                        <div className="markdown-content">
                                            <Markdown
                                                components={{
                                                    code({ className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return match ? (
                                                            <SyntaxHighlighter
                                                                style={vscDarkPlus}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '12px' }}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                        ) : (
                                                            <code className={cn('rounded bg-muted px-1 py-0.5 font-mono text-xs', className)} {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                }}
                                            >
                                                {msg.content}
                                            </Markdown>
                                        </div>
                                    )}

                                    {msg.fileOps && msg.fileOps.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {msg.fileOps.map((op, i) => (
                                                <span
                                                    key={`${op.path}-${i}`}
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold',
                                                        op.type === 'create' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                                                        op.type === 'modify' && 'border-blue-500/40 bg-blue-500/10 text-blue-400',
                                                        op.type === 'delete' && 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                                                    )}
                                                >
                                                    <span className="uppercase">{op.type}</span>
                                                    <span className="font-mono">{op.path}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {codeGen.isGenerating && (
                            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Coding...
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <CodeChatInput onSend={handleSend} isGenerating={codeGen.isGenerating} />
                </section>

                <div
                    onMouseDown={startResize}
                    className={cn(
                        'hidden w-2 items-center justify-center bg-muted/30 transition-colors lg:flex',
                        isDesktop ? 'cursor-col-resize hover:bg-muted/50' : '',
                        isResizing && 'bg-primary/30'
                    )}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground/70" />
                </div>

                <section className="flex min-h-0 flex-1 flex-col">
                    <div className="flex items-center justify-between border-b border-border px-3 py-2">
                        <div className="inline-flex items-center gap-2 text-sm font-medium">
                            {activeTab === 'cloud' && <CloudCog className="h-4 w-4" />}
                            {activeTab === 'design' && <Palette className="h-4 w-4" />}
                            {activeTab === 'code' && <Code2 className="h-4 w-4" />}
                            {activeTab === 'preview' && <Globe className="h-4 w-4" />}
                            {activeTab === 'stats' && <BarChart3 className="h-4 w-4" />}
                            <span className="capitalize">{activeTab}</span>
                        </div>

                        {publishUrl && (
                            <a
                                href={publishUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {publishUrl}
                            </a>
                        )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden">
                        {activeTab === 'cloud' && (
                            <div className="h-full overflow-y-auto p-4">
                                <div className="mx-auto grid w-full max-w-4xl gap-4">
                                    <div className="rounded-xl border border-border p-4">
                                        <h3 className="mb-3 text-sm font-semibold">AI Connection</h3>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <label className="grid gap-1 text-xs text-muted-foreground">
                                                Provider
                                                <select
                                                    value={cloudConfig.provider}
                                                    onChange={(e) => setCloudConfig((prev) => ({ ...prev, provider: e.target.value as CodeCloudConfig['provider'] }))}
                                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                                >
                                                    <option value="builtin">Built-in AI</option>
                                                    <option value="grok">Grok</option>
                                                    <option value="openai">OpenAI</option>
                                                    <option value="claude">Claude</option>
                                                </select>
                                            </label>
                                            <label className="grid gap-1 text-xs text-muted-foreground">
                                                Model (optional override)
                                                <input
                                                    value={cloudConfig.model || ''}
                                                    onChange={(e) => setCloudConfig((prev) => ({ ...prev, model: e.target.value }))}
                                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                                    placeholder="e.g. gpt-4.1"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs text-muted-foreground md:col-span-2">
                                                API key
                                                <input
                                                    type="password"
                                                    value={cloudConfig.apiKey || ''}
                                                    onChange={(e) => setCloudConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                                    placeholder="sk-..., xai-..., or anthropic key"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border p-4">
                                        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
                                            <Database className="h-4 w-4" />
                                            Supabase Connection
                                        </h3>
                                        <div className="grid gap-3">
                                            <label className="grid gap-1 text-xs text-muted-foreground">
                                                Project URL
                                                <input
                                                    value={cloudConfig.supabaseUrl || ''}
                                                    onChange={(e) => setCloudConfig((prev) => ({ ...prev, supabaseUrl: e.target.value }))}
                                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                                    placeholder="https://xxxx.supabase.co"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs text-muted-foreground">
                                                Anon key
                                                <input
                                                    value={cloudConfig.supabaseAnonKey || ''}
                                                    onChange={(e) => setCloudConfig((prev) => ({ ...prev, supabaseAnonKey: e.target.value }))}
                                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                                    placeholder="Supabase anon key"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs text-muted-foreground">
                                                Service role key
                                                <input
                                                    type="password"
                                                    value={cloudConfig.supabaseServiceRoleKey || ''}
                                                    onChange={(e) => setCloudConfig((prev) => ({ ...prev, supabaseServiceRoleKey: e.target.value }))}
                                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                                    placeholder="Optional for server operations"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                                        <div className="space-y-1 text-sm">
                                            <p className="font-medium">Connection status</p>
                                            <p className="text-xs text-muted-foreground">
                                                AI: {cloudConnected ? 'connected' : 'not connected'} | Supabase: {supabaseConnected ? 'connected' : 'not connected'}
                                            </p>
                                        </div>
                                        <Button size="sm" onClick={saveCloudSettings} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'design' && (
                            <div className="h-full overflow-y-auto p-4">
                                <div className="mx-auto grid w-full max-w-4xl gap-4">
                                    <div className="rounded-xl border border-border p-4">
                                        <h3 className="mb-3 text-sm font-semibold">UI Palette</h3>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <label className="grid gap-1 text-xs text-muted-foreground">
                                                React library
                                                <select
                                                    value={designConfig.reactLibrary}
                                                    onChange={(e) => setDesignConfig((prev) => ({ ...prev, reactLibrary: e.target.value as CodeDesignConfig['reactLibrary'] }))}
                                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                                >
                                                    <option value="none">None</option>
                                                    <option value="shadcn">shadcn/ui</option>
                                                    <option value="mui">MUI</option>
                                                    <option value="chakra">Chakra UI</option>
                                                    <option value="mantine">Mantine</option>
                                                    <option value="ant">Ant Design</option>
                                                </select>
                                            </label>
                                            <label className="grid gap-1 text-xs text-muted-foreground">
                                                Main color
                                                <input
                                                    type="color"
                                                    value={designConfig.mainColor}
                                                    onChange={(e) => setDesignConfig((prev) => ({ ...prev, mainColor: e.target.value }))}
                                                    className="h-10 rounded-md border border-border bg-background"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs text-muted-foreground">
                                                Accent color
                                                <input
                                                    type="color"
                                                    value={designConfig.accentColor}
                                                    onChange={(e) => setDesignConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                                                    className="h-10 rounded-md border border-border bg-background"
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs text-muted-foreground md:col-span-3">
                                                Button theme
                                                <select
                                                    value={designConfig.buttonTheme}
                                                    onChange={(e) => setDesignConfig((prev) => ({ ...prev, buttonTheme: e.target.value as CodeDesignConfig['buttonTheme'] }))}
                                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                                >
                                                    <option value="rounded">Rounded</option>
                                                    <option value="pill">Pill</option>
                                                    <option value="sharp">Sharp</option>
                                                    <option value="soft">Soft</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <ToggleRow
                                            label="Compact spacing"
                                            description="Tighter layout density for data-heavy UI."
                                            checked={designConfig.compactSpacing}
                                            onToggle={() => setDesignConfig((prev) => ({ ...prev, compactSpacing: !prev.compactSpacing }))}
                                        />
                                        <ToggleRow
                                            label="High contrast"
                                            description="Increase contrast for readability and accessibility."
                                            checked={designConfig.highContrast}
                                            onToggle={() => setDesignConfig((prev) => ({ ...prev, highContrast: !prev.highContrast }))}
                                        />
                                        <ToggleRow
                                            label="Animations"
                                            description="Enable motion and transitions in generated UI."
                                            checked={designConfig.enableAnimations}
                                            onToggle={() => setDesignConfig((prev) => ({ ...prev, enableAnimations: !prev.enableAnimations }))}
                                        />
                                        <ToggleRow
                                            label="Strong shadows"
                                            description="Use deeper elevation and depth effects."
                                            checked={designConfig.strongShadows}
                                            onToggle={() => setDesignConfig((prev) => ({ ...prev, strongShadows: !prev.strongShadows }))}
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button size="sm" onClick={saveDesignSettings} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            Save Design Settings
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'code' && (
                            <div className="grid h-full min-h-0 grid-cols-[260px_1fr]">
                                <aside className="border-r border-border bg-card/40">
                                    <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Files ({codeGen.project.files.length})
                                    </div>
                                    <div className="h-full overflow-y-auto p-2">
                                        {codeGen.project.files.length === 0 && (
                                            <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                                                No files yet. Send a prompt to start coding.
                                            </p>
                                        )}
                                        <div className="space-y-1">
                                            {codeGen.project.files.map((file) => (
                                                <button
                                                    key={file.path}
                                                    onClick={() => codeGen.openFile(file.path)}
                                                    className={cn(
                                                        'flex w-full items-center justify-between rounded-md border px-2 py-2 text-left transition-colors',
                                                        codeGen.project.activeFile === file.path
                                                            ? 'border-primary/40 bg-primary/10 text-primary'
                                                            : 'border-transparent hover:bg-accent'
                                                    )}
                                                >
                                                    <span className="inline-flex items-center gap-2 truncate text-xs font-medium">
                                                        <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{file.path}</span>
                                                    </span>
                                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                        {getFileBadge(file.path)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </aside>
                                <div className="min-h-0">
                                    <CodeEditor
                                        files={codeGen.project.files}
                                        activeFile={codeGen.project.activeFile}
                                        openTabs={codeGen.project.openTabs}
                                        isGenerating={codeGen.isGenerating}
                                        onSelectTab={codeGen.openFile}
                                        onCloseTab={codeGen.closeTab}
                                        onUpdateContent={codeGen.updateFileContent}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'preview' && (
                            <div className="h-full">
                                <Preview html={previewHtml} isGenerating={codeGen.isGenerating} />
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="h-full overflow-y-auto p-4">
                                <div className="mx-auto grid w-full max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="text-xs text-muted-foreground">Messages</p>
                                        <p className="mt-1 text-2xl font-bold">{userMessageCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="text-xs text-muted-foreground">Files</p>
                                        <p className="mt-1 text-2xl font-bold">{codeGen.project.files.length}</p>
                                    </div>
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="text-xs text-muted-foreground">Lines of code</p>
                                        <p className="mt-1 text-2xl font-bold">{totalLines}</p>
                                    </div>
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="text-xs text-muted-foreground">Published apps</p>
                                        <p className="mt-1 text-2xl font-bold">{publishedCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="text-xs text-muted-foreground">Generations</p>
                                        <p className="mt-1 text-2xl font-bold">{codeGen.metrics.generationCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="text-xs text-muted-foreground">Success / Fail</p>
                                        <p className="mt-1 text-2xl font-bold">
                                            {codeGen.metrics.successCount} / {codeGen.metrics.failedCount}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="text-xs text-muted-foreground">Total operations</p>
                                        <p className="mt-1 text-2xl font-bold">{codeGen.metrics.totalOperations}</p>
                                    </div>
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="text-xs text-muted-foreground">Avg generation</p>
                                        <p className="mt-1 text-2xl font-bold">{codeGen.metrics.avgGenerationMs.toFixed(0)}ms</p>
                                    </div>
                                </div>

                                <div className="mx-auto mt-4 grid w-full max-w-5xl gap-3 md:grid-cols-2">
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="mb-2 text-sm font-semibold">Connectivity</p>
                                        <div className="space-y-2 text-sm">
                                            <p className="inline-flex items-center gap-2">
                                                {cloudConnected ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-rose-400" />}
                                                AI provider: {cloudConfig.provider}
                                            </p>
                                            <p className="inline-flex items-center gap-2">
                                                {supabaseConnected ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-rose-400" />}
                                                Supabase: {supabaseConnected ? 'connected' : 'not configured'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-border p-4">
                                        <p className="mb-2 text-sm font-semibold">Generation profile</p>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <p className="inline-flex items-center gap-2">
                                                <Layers className="h-4 w-4" />
                                                React library: {designConfig.reactLibrary}
                                            </p>
                                            <p className="inline-flex items-center gap-2">
                                                <Palette className="h-4 w-4" />
                                                Button theme: {designConfig.buttonTheme}
                                            </p>
                                            <p className="inline-flex items-center gap-2">
                                                <FileCode2 className="h-4 w-4" />
                                                Last generation: {codeGen.metrics.lastGenerationMs.toFixed(0)}ms
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {deployOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-xl rounded-xl border border-border bg-background shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <div>
                                <h3 className="text-sm font-semibold">Deploy & Publish</h3>
                                <p className="text-xs text-muted-foreground">Publish to a slug URL like <code className="font-mono">/my-app</code></p>
                            </div>
                            <button
                                onClick={() => setDeployOpen(false)}
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                            <label className="grid gap-1 text-xs text-muted-foreground">
                                Title
                                <input
                                    value={publishMeta.title}
                                    onChange={(e) => {
                                        const title = e.target.value;
                                        setPublishMeta((prev) => ({
                                            ...prev,
                                            title,
                                            slug: slugTouched ? prev.slug : slugify(title),
                                        }));
                                    }}
                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                    placeholder="My awesome app"
                                />
                            </label>
                            <label className="grid gap-1 text-xs text-muted-foreground">
                                Slug
                                <input
                                    value={publishMeta.slug}
                                    onChange={(e) => {
                                        setSlugTouched(true);
                                        setPublishMeta((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                                    }}
                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                    placeholder="my-awesome-app"
                                />
                            </label>
                            <label className="grid gap-1 text-xs text-muted-foreground">
                                Description
                                <input
                                    value={publishMeta.description || ''}
                                    onChange={(e) => setPublishMeta((prev) => ({ ...prev, description: e.target.value }))}
                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                    placeholder="What this app does"
                                />
                            </label>
                            <label className="grid gap-1 text-xs text-muted-foreground">
                                Favicon URL
                                <input
                                    value={publishMeta.favicon || ''}
                                    onChange={(e) => setPublishMeta((prev) => ({ ...prev, favicon: e.target.value }))}
                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                    placeholder="https://example.com/favicon.ico"
                                />
                            </label>
                            <label className="grid gap-1 text-xs text-muted-foreground">
                                Social image URL
                                <input
                                    value={publishMeta.image || ''}
                                    onChange={(e) => setPublishMeta((prev) => ({ ...prev, image: e.target.value }))}
                                    className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                                    placeholder="https://example.com/preview.png"
                                />
                            </label>

                            {publishError && (
                                <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                                    {publishError}
                                </div>
                            )}

                            {publishUrl && (
                                <a
                                    href={publishUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Published at {publishUrl}
                                </a>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                            <Button variant="outline" size="sm" onClick={() => setDeployOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={publish} disabled={publishing} className="gap-2">
                                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                                Publish
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
