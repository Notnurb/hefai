export type Role = 'system' | 'user' | 'assistant' | 'data';

export type ToneType = 'formal' | 'concise' | 'detailed' | 'minimal';

export type ChatMode = 'think' | 'deep-research' | 'web-search' | 'study';

export interface ActiveModes {
    modes: ChatMode[];
    tone: ToneType | null;
}

export type TaskStatusType = 'idle' | 'thinking' | 'searching' | 'analyzing' | 'generating' | 'reading' | 'processing' | 'collaborating' | 'web_searching' | 'remembering';

export interface Attachment {
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
}

export interface Message {
    id: string;
    role: Role;
    content: string;
    timestamp: Date;
    model?: string;
    attachments?: Attachment[];
    tone?: ToneType;
    extendedThinking?: boolean;
    searchCount?: number;
    agents?: AgentResponse[];
    searchResults?: SearchResult[];
    isCollaboration?: boolean;
}

export interface Conversation {
    id: string;
    title: string;
    model: string;
    updatedAt: Date;
    createdAt: Date;
    messages: Message[];
}

// ─── Image & Video Generation ─────────────────────────────────────────────────

export type GenStatus = 'pending' | 'generating' | 'completed' | 'error';

export interface ImageGenJob {
    id: string;
    prompt: string;
    status: GenStatus;
    images: string[];
    proMode: boolean;
    count: number;
    sourceImage?: string; // base64 data URI for editing
    strength?: number; // 0.0 to 1.0
    error?: string;
    createdAt: Date;
}

export interface VideoGenJob {
    id: string;
    prompt: string;
    status: GenStatus;
    requestIds: string[];
    videoUrls: string[];
    count: number;
    duration: number;
    aspectRatio: string;
    sourceImage?: string; // base64 data URI for image-to-video
    sourceVideo?: string; // base64 data URI for video editing
    error?: string;
    createdAt: Date;
}

// ─── Code Editor (Epilson) ────────────────────────────────────────────────────

export type EpilsonTierId = 'fast' | 'pro' | 'max';

export interface CodeFile {
    path: string;        // e.g. "src/App.tsx"
    content: string;
    language: string;    // e.g. "typescript", "html", "css"
}

export interface FileOperation {
    type: 'create' | 'modify' | 'delete';
    path: string;
    content?: string;
    language?: string;
}

export interface CodeChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    fileOps?: FileOperation[];
    timestamp: Date;
}

export interface CodeProject {
    id: string;
    name: string;
    files: CodeFile[];
    chatHistory: CodeChatMessage[];
    tier: EpilsonTierId;
    createdAt: Date;
    updatedAt: Date;
}

export type CodeAiProvider = 'builtin' | 'grok' | 'openai' | 'claude';

export interface CodeCloudConfig {
    provider: CodeAiProvider;
    apiKey?: string;
    model?: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseServiceRoleKey?: string;
}

export interface CodeDesignConfig {
    reactLibrary: 'none' | 'shadcn' | 'mui' | 'chakra' | 'mantine' | 'ant';
    mainColor: string;
    accentColor: string;
    buttonTheme: 'rounded' | 'pill' | 'sharp' | 'soft';
    compactSpacing: boolean;
    highContrast: boolean;
    enableAnimations: boolean;
    strongShadows: boolean;
}

export interface CodePublishMetadata {
    slug: string;
    title: string;
    description?: string;
    favicon?: string;
    image?: string;
}

export interface CodeGenerationMetrics {
    generationCount: number;
    successCount: number;
    failedCount: number;
    totalOperations: number;
    avgGenerationMs: number;
    lastGenerationMs: number;
    lastGeneratedAt?: string;
}

// ─── Multi-AI Collaboration ──────────────────────────────────────────────────

export interface AgentInfo {
    id: string;
    name: string;
    emoji: string;
    specialty: string;
}

export interface AgentResponse {
    agent: AgentInfo;
    content: string;
    timestamp: string;
    error?: boolean;
}

export interface CollaborationResult {
    mode: 'sequential' | 'batch' | 'batch_http';
    query: string;
    agent_count: number;
    responses: AgentResponse[];
    synthesis: string;
    timestamp: string;
    batch_id?: string;
}

// ─── Web Search ──────────────────────────────────────────────────────────────

export interface SearchResult {
    title: string;
    url: string;
    highlights: string[];
    score?: number;
    published_date?: string;
    source: 'xai' | 'exa' | 'firecrawl';
    raw_content?: string;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    sources: { xai: number; exa: number; firecrawl?: number };
    timestamp: string;
}

// ─── Memory ──────────────────────────────────────────────────────────────────

export interface MemoryEntry {
    id: string;
    memory: string;
    user_id: string;
    metadata?: Record<string, any>;
    score?: number;
    created_at: string;
}

export interface UserProfile {
    user_id: string;
    name: string;
    personality: Record<string, string>;
    preferences: Record<string, string>;
    facts: UserFact[];
    exists: boolean;
}

export interface UserFact {
    id: string;
    category: string;
    content: string;
    importance: number;
    created_at: string;
}
