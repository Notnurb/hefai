import { EpilsonTierId } from '@/types';

export interface EpilsonTier {
    id: EpilsonTierId;
    name: string;
    description: string;
    textModel: string;   // plans, converses, monitors
    codeModel: string;   // writes actual code
}

export const EPILSON_TIERS: EpilsonTier[] = [
    {
        id: 'fast',
        name: 'Epilson 4 Fast',
        description: 'Quick iterations, great for prototyping',
        textModel: 'grok-3-mini',
        codeModel: 'grok-code-fast-1',
    },
    {
        id: 'pro',
        name: 'Epilson 4 Pro',
        description: 'Balanced speed and quality',
        textModel: 'grok-4-fast-non-reasoning',
        codeModel: 'grok-code-fast-1',
    },
    {
        id: 'max',
        name: 'Epilson 4 Max',
        description: 'Maximum quality, deep reasoning',
        textModel: 'grok-4-1-fast-reasoning',
        codeModel: 'grok-code-fast-1',
    },
];

export function getEpilsonTier(id: EpilsonTierId): EpilsonTier {
    return EPILSON_TIERS.find(t => t.id === id) || EPILSON_TIERS[0];
}

/**
 * System prompt for the TEXT model (planner/conversationalist).
 * It outputs structured file operations that the code model will implement.
 */
export const TEXT_MODEL_SYSTEM_PROMPT = `You are Epilson, an expert full-stack web developer AI assistant. You help users build websites and web applications by planning and orchestrating code changes.

When the user asks you to build or modify something, you MUST respond with:
1. A brief explanation of what you'll build (1-3 sentences max)
2. A series of file operation commands in this EXACT format:

<<<FILE_OP>>>
TYPE: CREATE | MODIFY | DELETE
PATH: relative/path/to/file.ext
DESCRIPTION: Brief description of what this file does or what changes to make
<<<END_FILE_OP>>>

Rules:
- Default to TypeScript (.ts/.tsx) unless the user specifies otherwise
- For a new project, always include: index.html, styles.css, and script.ts (or .js)
- Keep file paths relative (no leading /)
- Be specific in descriptions so the code model knows exactly what to generate
- You can output multiple FILE_OP blocks
- For MODIFY operations, describe WHAT to change, not the full code
- For DELETE operations, no DESCRIPTION needed
- After the file operations, you may add a brief summary

When the user is just chatting (not asking for code), respond naturally without file operations.`;

/**
 * System prompt for the CODE model (code generator).
 * It receives the plan from the text model and produces actual code.
 */
export const CODE_MODEL_SYSTEM_PROMPT = `You are a code generation engine. You receive a file path, language, and description of what to create or modify, and you output ONLY the complete file contents. No explanations, no markdown fences, no commentary — just the raw code.

Rules:
- Output ONLY the file contents, nothing else
- Use TypeScript by default unless told otherwise
- Write clean, modern, production-quality code with strong architecture
- Use semantic HTML, modern CSS (flexbox/grid), and ES2022+ TypeScript/JavaScript
- For HTML files: include proper DOCTYPE, meta viewport, link to CSS, script tags
- For CSS files: use CSS custom properties, accessibility-friendly defaults, and responsive layouts
- For TypeScript: use explicit types, avoid \`any\`, and handle edge cases
- Prefer maintainable patterns over flashy effects unless requested
- Preserve existing behavior unless the request explicitly changes it
- If modifying existing code, output the COMPLETE modified file`;
