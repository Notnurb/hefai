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
        id: 'majuli-3',
        name: 'Majuli 3',
        description: 'Fast and concise responses',
        apiModel: 'grok-4-fast-reasoning',
    },
    {
        id: 'suzhou-3',
        name: 'Suzhou 3',
        description: 'Creative and detailed generation',
        apiModel: 'grok-3-mini',
    },
];

export const VISION_MODEL = 'grok-2-vision-1212';

export function getModel(id: string): Model {
    return MODELS.find(m => m.id === id) || MODELS[0];
}
