'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ExecutionPlan, PlanPhase, PlanStep, PlanStepStatus } from '@/types/plan';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

// ─── Status indicators ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PlanStepStatus, { icon: string; color: string }> = {
    pending: { icon: '⏳', color: 'text-muted-foreground' },
    running: { icon: '🔄', color: 'text-blue-400' },
    complete: { icon: '✅', color: 'text-emerald-400' },
    failed: { icon: '❌', color: 'text-red-400' },
    skipped: { icon: '⏭️', color: 'text-muted-foreground/60' },
    adapted: { icon: '⚠️', color: 'text-amber-400' },
};

// ─── Single Step ──────────────────────────────────────────────────────────────

function StepRow({ step, index }: { step: PlanStep; index: number }) {
    const cfg = STATUS_CONFIG[step.status];

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className="flex items-start gap-2 py-1"
        >
            <span className="text-sm shrink-0 w-5 text-center">{cfg.icon}</span>
            <div className="flex flex-col min-w-0">
                <span
                    className={cn(
                        'text-sm leading-tight',
                        step.status === 'complete' && 'line-through opacity-60',
                        step.status === 'skipped' && 'line-through opacity-40',
                        cfg.color
                    )}
                >
                    {step.label}
                </span>
                {step.detail && (
                    <span className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {step.detail}
                    </span>
                )}
                {/* Nested substeps */}
                {step.substeps && step.substeps.length > 0 && (
                    <div className="ml-3 mt-1 border-l border-border pl-3 space-y-0.5">
                        {step.substeps.map((sub, si) => (
                            <StepRow key={sub.id} step={sub} index={si} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Phase ────────────────────────────────────────────────────────────────────

function PhaseSection({ phase, defaultOpen = true }: { phase: PlanPhase; defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const completedCount = phase.steps.filter((s) => s.status === 'complete').length;
    const totalCount = phase.steps.length;

    return (
        <div className="mb-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full text-left group"
            >
                <HugeiconsIcon
                    icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon}
                    size={14}
                    className="text-muted-foreground"
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80 group-hover:text-foreground transition-colors">
                    {phase.title}
                </span>
                {phase.requiresAnura && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-mono">
                        Anura
                    </span>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                    {completedCount}/{totalCount}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden ml-5 mt-1"
                    >
                        {phase.steps.map((step, i) => (
                            <StepRow key={step.id} step={step} index={i} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Full Plan ────────────────────────────────────────────────────────────────

interface PlanDisplayProps {
    plan: ExecutionPlan;
}

export default function PlanDisplay({ plan }: PlanDisplayProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="my-3 px-4 py-3 rounded-xl border border-border bg-card/50"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm">📋</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                        Execution Plan
                    </span>
                </div>
                {plan.estimatedTime && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                        ⏱️ {plan.estimatedTime}
                    </span>
                )}
            </div>

            {/* Objective */}
            <div className="text-sm text-foreground mb-3 font-medium">{plan.objective}</div>

            {/* Phases */}
            {plan.phases.map((phase, i) => (
                <PhaseSection key={phase.id} phase={phase} defaultOpen={i === 0} />
            ))}
        </motion.div>
    );
}
