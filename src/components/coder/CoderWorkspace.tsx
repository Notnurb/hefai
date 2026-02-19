import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { CodePreview } from './CodePreview';
import { useCodeGeneration } from '@/hooks/useCodeGeneration';
import { ChevronDown, Check, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const AI_MODELS = [
    'Tripplet AI 1 Coder',
    'Tripplet AI 1 Coder Advanced',
    'Tripplet AI 1.5 Coder Public Beta 1',
];

const TRIPPLET_ICON = (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
);

export function CoderWorkspace() {
    const [selectedModel, setSelectedModel] = useState('Tripplet AI 1 Coder');
    const {
        messages,
        generatedFiles,
        isGenerating,
        currentFileIndex,
        streamedContent,
        sendMessage,
        clearConversation,
    } = useCodeGeneration();

    const handleSendMessage = (content: string) => {
        sendMessage(content, selectedModel);
    };

    return (
        <div className="h-screen flex flex-col bg-neutral-950">
            {/* Top bar with model selector */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-950">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        {TRIPPLET_ICON}
                    </div>
                    <span className="text-white font-medium">Tripplet Coder</span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm text-white hover:bg-white/10 transition-colors border border-white/10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedModel}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-2"
                            >
                                {TRIPPLET_ICON}
                                <span className="max-w-[200px] truncate">{selectedModel}</span>
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </motion.div>
                        </AnimatePresence>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-900 border-white/10 min-w-[240px]">
                        {AI_MODELS.map((model) => (
                            <DropdownMenuItem
                                key={model}
                                onClick={() => setSelectedModel(model)}
                                className="flex items-center justify-between gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    {TRIPPLET_ICON}
                                    <span className="text-sm">{model}</span>
                                </div>
                                {selectedModel === model && (
                                    <Check className="w-4 h-4 text-primary" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat sidebar */}
                <div className="w-80 flex-shrink-0">
                    <ChatSidebar
                        messages={messages}
                        isGenerating={isGenerating}
                        onSendMessage={handleSendMessage}
                        onClear={clearConversation}
                        selectedModel={selectedModel}
                    />
                </div>

                {/* Code preview */}
                <div className="flex-1">
                    <CodePreview
                        files={generatedFiles}
                        streamedContent={streamedContent}
                        currentFileIndex={currentFileIndex}
                        isGenerating={isGenerating}
                    />
                </div>
            </div>
        </div>
    );
}
