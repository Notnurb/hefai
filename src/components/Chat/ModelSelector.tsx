import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { memo, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { MODELS, getModel, REASONING_LEVELS } from '@/lib/ai/models';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LockIcon, BrainCircuitIcon } from 'lucide-react';

interface ModelSelectorProps {
    selectedModelId: string;
    reasoningLevel: string;
    onSelectModel: (modelId: string) => void;
    onReasoningLevelChange: (level: string) => void;
}

function ModelSelector({
    selectedModelId,
    reasoningLevel,
    onSelectModel,
    onReasoningLevelChange,
}: ModelSelectorProps) {
    const { isSignedIn, isLoaded } = useUser();
    const selectedModel = useMemo(() => getModel(selectedModelId), [selectedModelId]);
    const currentReasoning = useMemo(
        () => REASONING_LEVELS.find(r => r.id === reasoningLevel) || REASONING_LEVELS[1],
        [reasoningLevel]
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors border border-transparent hover:text-foreground outline-none">
                <span className={cn("text-foreground font-semibold", reasoningLevel !== 'medium' && "font-normal")}>
                    {selectedModel.name}
                </span>
                <span className="text-muted-foreground font-normal">{currentReasoning.label}</span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px] p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Select Model</div>
                {MODELS.map((model) => {
                    const isTaipei = model.id === 'tura-3' || model.id === 'taipei-3-1-beta';
                    const isLocked = isTaipei && isLoaded && !isSignedIn;

                    return (
                        <DropdownMenuItem
                            key={model.id}
                            disabled={isLocked}
                            onClick={() => !isLocked && onSelectModel(model.id)}
                            className={cn(
                                "flex items-start justify-between cursor-pointer rounded-lg py-2",
                                isLocked && "opacity-70 cursor-default"
                            )}
                        >
                            <div className="flex flex-col gap-0.5 w-full">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        {model.name}
                                        {isLocked && <LockIcon className="w-3 h-3 text-muted-foreground" />}
                                    </span>
                                    {selectedModelId === model.id && <HugeiconsIcon icon={Tick02Icon} size={16} className="text-blue-500" />}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {isLocked ? (
                                        <span>
                                            <Link href="/sign-in" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                                Sign in
                                            </Link> to use this model
                                        </span>
                                    ) : (
                                        model.description
                                    )}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    );
                })}
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center justify-between cursor-pointer rounded-lg py-2 px-2">
                        <div className="flex flex-col gap-0.5 flex-1">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <BrainCircuitIcon className="w-3.5 h-3.5" />
                                Reasoning Level
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {currentReasoning.label} — {currentReasoning.description}
                            </span>
                        </div>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="opacity-50 rotate-[-90deg]" />
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-1">
                        {REASONING_LEVELS.map((level) => (
                            <DropdownMenuItem
                                key={level.id}
                                onClick={() => onReasoningLevelChange(level.id)}
                                className={cn(
                                    "flex items-start justify-between cursor-pointer rounded-lg py-2 px-2",
                                    reasoningLevel === level.id && "bg-accent"
                                )}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">{level.label}</span>
                                    <span className="text-xs text-muted-foreground">{level.description}</span>
                                </div>
                                {reasoningLevel === level.id && <HugeiconsIcon icon={Tick02Icon} size={16} className="text-blue-500" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function areModelSelectorPropsEqual(prev: ModelSelectorProps, next: ModelSelectorProps) {
    return (
        prev.selectedModelId === next.selectedModelId &&
        prev.reasoningLevel === next.reasoningLevel &&
        prev.onSelectModel === next.onSelectModel &&
        prev.onReasoningLevelChange === next.onReasoningLevelChange
    );
}

export default memo(ModelSelector, areModelSelectorPropsEqual);