export interface Model {
    id: string;
    name: string;
    description: string;
    apiModel: string;
}

export const MODELS: Model[] = [
    {
        id: 'tura-3',
        name: 'Taipei 3',
        description: 'Advanced reasoning and analysis',
        apiModel: 'grok-4-1-fast-reasoning',
    },
    {
        id: 'taipei-3-1-beta',
        name: 'Taipei 3.1 Beta',
        description: 'Advanced reasoning with latest improvements',
        apiModel: 'grok-4-20-beta-0309-reasoning',
    },
    {
        id: 'majuli-3',
        name: 'Majuli 3',
        description: 'Fast and concise responses',
        apiModel: 'grok-4-fast-reasoning',
    },
    {
        id: 'majuli-3-1-beta',
        name: 'Majuli 3.1 Beta',
        description: 'Fast with latest improvements',
        apiModel: 'grok-4-20-beta-0309',
    },
    {
        id: 'suzhou-3',
        name: 'Suzhou 3',
        description: 'Creative and detailed generation',
        apiModel: 'grok-3-mini',
    },
    {
        id: 'suzhou-3-1-beta',
        name: 'Suzhou 3.1 Beta',
        description: 'Creative with latest improvements',
        apiModel: 'grok-3-2025-01-25',
    },
    {
        id: 'suzhou-3-2-beta',
        name: 'Suzhou 3.2 Beta',
        description: 'Enhanced creative generation',
        apiModel: 'grok-3-mini-2025-01-27',
    },
];

export const REASONING_LEVELS = [
    { id: 'low', label: 'Low', description: 'Quick responses' },
    { id: 'medium', label: 'Medium', description: 'Balanced thinking' },
    { id: 'high', label: 'High', description: 'Thorough analysis' },
    { id: 'xhigh', label: 'xHigh', description: 'Deep reasoning' },
    { id: 'max', label: 'Max', description: 'Maximum thinking effort' },
];

export const REASONINGEffort_MAP: Record<string, number> = {
    'low': 0,
    'medium': 1,
    'high': 2,
    'xhigh': 3,
    'max': 4,
};

export function getReasoningModel(modelId: string, reasoningLevel: string): string {
    const model = getModel(modelId);
    
    if (modelId.includes('taipei') || modelId.includes('tura')) {
        const reasoningModels: Record<string, string> = {
            'low': 'grok-2',
            'medium': 'grok-4',
            'high': 'grok-4-fast-reasoning',
            'xhigh': 'grok-4-1-fast-reasoning',
            'max': 'grok-4-20-beta-0309-reasoning',
        };
        return reasoningModels[reasoningLevel] || model.apiModel;
    }
    
    if (modelId.includes('majuli')) {
        const reasoningModels: Record<string, string> = {
            'low': 'grok-4',
            'medium': 'grok-4',
            'high': 'grok-4-fast-reasoning',
            'xhigh': 'grok-4-1-fast-reasoning',
            'max': 'grok-4-20-beta-0309',
        };
        return reasoningModels[reasoningLevel] || model.apiModel;
    }
    
    if (modelId.includes('suzhou')) {
        const reasoningModels: Record<string, string> = {
            'low': 'grok-3-mini',
            'medium': 'grok-3-mini',
            'high': 'grok-3',
            'xhigh': 'grok-3-2025-01-25',
            'max': 'grok-3-mini-2025-01-27',
        };
        return reasoningModels[reasoningLevel] || model.apiModel;
    }
    
    return model.apiModel;
}

export const VISION_MODEL = 'grok-2-vision-1212';

export function getModel(id: string): Model {
    return MODELS.find(m => m.id === id) || MODELS[0];
}
