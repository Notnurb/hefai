import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { memo, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { MODELS, getModel } from '@/lib/ai/models';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LockIcon } from 'lucide-react';

interface ModelSelectorProps {
    selectedModelId: string;
    extendedThinking: boolean;
    onSelectModel: (modelId: string) => void;
    onToggleExtended: () => void;
}

function ModelSelector({
    selectedModelId,
    extendedThinking,
    onSelectModel,
    onToggleExtended,
}: ModelSelectorProps) {
    const { isSignedIn, isLoaded } = useUser();
    const selectedModel = useMemo(() => getModel(selectedModelId), [selectedModelId]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors border border-transparent hover:text-foreground outline-none">
                <span className={cn("text-foreground", extendedThinking && "font-semibold")}>
                    {selectedModel.name}
                </span>
                {extendedThinking && <span className="text-muted-foreground font-normal">Extended</span>}
                <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px] p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Select Model</div>
                {MODELS.map((model) => {
                    const isTaipei = model.id === 'tura-3';
                    // Only lock if we know for sure they aren't signed in
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
                <div
                    className="flex items-center justify-between px-2 py-1.5 select-none cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleExtended();
                    }}
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">Extended thinking</span>
                        <span className="text-[10px] text-muted-foreground">Think longer for complex tasks</span>
                    </div>
                    <div
                        className={cn(
                            "w-9 h-5 rounded-full transition-colors relative",
                            extendedThinking ? "bg-blue-600" : "bg-muted-foreground/30"
                        )}
                    >
                        <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm", extendedThinking ? "translate-x-4" : "translate-x-0")} />
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function areModelSelectorPropsEqual(prev: ModelSelectorProps, next: ModelSelectorProps) {
    return (
        prev.selectedModelId === next.selectedModelId &&
        prev.extendedThinking === next.extendedThinking &&
        prev.onSelectModel === next.onSelectModel &&
        prev.onToggleExtended === next.onToggleExtended
    );
}

export default memo(ModelSelector, areModelSelectorPropsEqual);
