/**
 * Mode configuration — defines how each persistent toggle changes AI behavior.
 * No model swap needed: just system prompt, temperature, and token limits.
 */

import { ChatMode } from '@/types';

// ─── Mode Definitions ─────────────────────────────────────────────────────────

export interface ModeConfig {
    id: ChatMode;
    label: string;
    description: string;
    emoji: string;
    temperature: number;
    maxTokens?: number;        // undefined = use model default
    enableWebSearch: boolean;
    shimmerLabels: string[];
}

export const MODE_CONFIGS: Record<ChatMode, ModeConfig> = {
    think: {
        id: 'think',
        label: 'Think',
        description: 'Deeper reasoning. Step-by-step logic. Structured answers.',
        emoji: '🧠',
        temperature: 0.3,
        enableWebSearch: false,
        shimmerLabels: [
            'Reasoning step by step...',
            'Structuring logic...',
            'Analyzing edge cases...',
            'Building structured answer...',
        ],
    },
    'deep-research': {
        id: 'deep-research',
        label: 'Deep Research',
        description: 'Long-form, thorough analysis. Multiple angles.',
        emoji: '🔬',
        temperature: 0.5,
        maxTokens: 8192,
        enableWebSearch: false,
        shimmerLabels: [
            'Researching in depth...',
            'Exploring multiple angles...',
            'Cross-referencing sources...',
            'Synthesizing analysis...',
        ],
    },
    'web-search': {
        id: 'web-search',
        label: 'Web Search',
        description: 'Live info. Current events. Up-to-date facts.',
        emoji: '🌐',
        temperature: 0.7,
        enableWebSearch: true,
        shimmerLabels: [
            'Searching the web...',
            'Fetching live results...',
            'Analyzing sources...',
            'Compiling findings...',
        ],
    },
    study: {
        id: 'study',
        label: 'Study & Learn',
        description: 'Tutor mode. Breaks things down. Helps you understand.',
        emoji: '📚',
        temperature: 0.4,
        enableWebSearch: false,
        shimmerLabels: [
            'Preparing lesson...',
            'Breaking down concepts...',
            'Crafting examples...',
            'Building understanding...',
        ],
    },
};

// ─── Conflict Rules ───────────────────────────────────────────────────────────

/**
 * Modes that cannot be active simultaneously.
 * Each pair is [A, B] meaning enabling A disables B and vice versa.
 */
export const MODE_CONFLICTS: [ChatMode, ChatMode][] = [
    ['deep-research', 'study'],
];

/**
 * Given current active modes and a mode being toggled ON,
 * returns the new set of active modes with conflicts resolved.
 */
export function toggleMode(current: ChatMode[], mode: ChatMode): ChatMode[] {
    // If already active, turn it off
    if (current.includes(mode)) {
        return current.filter((m) => m !== mode);
    }

    // Find modes that conflict with the one being turned on
    const conflicting = MODE_CONFLICTS
        .filter(([a, b]) => a === mode || b === mode)
        .map(([a, b]) => (a === mode ? b : a));

    // Remove conflicting modes, then add the new one
    const cleaned = current.filter((m) => !conflicting.includes(m));
    return [...cleaned, mode];
}

// ─── Resolve combined settings ────────────────────────────────────────────────

export interface ResolvedModeSettings {
    temperature: number;
    maxTokens?: number;
    enableWebSearch: boolean;
}

/**
 * Merge all active modes into a single temperature / maxTokens / webSearch config.
 * Uses the lowest temperature & highest maxTokens among active modes.
 */
export function resolveSettings(activeModes: ChatMode[]): ResolvedModeSettings {
    if (activeModes.length === 0) {
        return { temperature: 0.7, enableWebSearch: false };
    }

    const configs = activeModes.map((m) => MODE_CONFIGS[m]);

    return {
        temperature: Math.min(...configs.map((c) => c.temperature)),
        maxTokens: configs.reduce<number | undefined>((max, c) => {
            if (!c.maxTokens) return max;
            if (!max) return c.maxTokens;
            return Math.max(max, c.maxTokens);
        }, undefined),
        enableWebSearch: configs.some((c) => c.enableWebSearch),
    };
}
