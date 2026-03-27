'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowUp } from 'lucide-react';
import { createClientSafe } from '@/lib/supabase/client';
import ThemeToggle from '@/components/Layout/ThemeToggle';
import SuggestArticleModal from './_components/SuggestArticleModal';
import TriplepediaUserButton from './_components/TriplepediaUserButton';

const STARS = [
    { x: 4.2, y: 7.5 }, { x: 14.8, y: 21.3 }, { x: 27.1, y: 4.8 },
    { x: 41.6, y: 14.2 }, { x: 54.3, y: 2.9 }, { x: 67.8, y: 17.6 },
    { x: 77.4, y: 7.3 }, { x: 87.9, y: 24.7 }, { x: 94.6, y: 11.8 },
    { x: 2.7, y: 44.3 }, { x: 17.5, y: 37.8 }, { x: 33.9, y: 54.6 },
    { x: 47.2, y: 41.5 }, { x: 61.4, y: 57.3 }, { x: 74.8, y: 44.9 },
    { x: 89.3, y: 51.7 }, { x: 7.6, y: 71.2 }, { x: 21.4, y: 64.8 },
    { x: 37.2, y: 77.5 }, { x: 51.8, y: 67.3 }, { x: 64.5, y: 81.9 },
    { x: 79.7, y: 71.4 }, { x: 91.3, y: 84.6 }, { x: 11.6, y: 87.3 },
    { x: 24.8, y: 91.7 }, { x: 44.5, y: 94.3 }, { x: 69.8, y: 89.6 },
    { x: 84.2, y: 94.8 }, { x: 58.7, y: 31.4 }, { x: 32.1, y: 82.7 },
    { x: 6.3, y: 58.2 }, { x: 96.1, y: 38.7 }, { x: 48.9, y: 76.4 },
];

interface ArticleSuggestion {
    title: string;
    slug: string;
}

export default function TriplepediaHome() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<ArticleSuggestion[]>([]);
    const [articleCount, setArticleCount] = useState<number | null>(null);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const supabase = createClientSafe();
        if (!supabase) { setArticleCount(0); return; }
        supabase
            .from('triplepedia_articles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .then(({ count }) => setArticleCount(count ?? 0));
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }
        const supabase = createClientSafe();
        if (!supabase) return;
        const t = setTimeout(async () => {
            const { data } = await supabase
                .from('triplepedia_articles')
                .select('title, slug')
                .eq('status', 'published')
                .ilike('title', `%${query}%`)
                .limit(6);
            setSuggestions(data ?? []);
        }, 180);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearch = useCallback(() => {
        if (!query.trim()) return;
        if (suggestions.length > 0) {
            router.push(`/triplepedia/${suggestions[0].slug}`);
        }
    }, [query, suggestions, router]);

    const handleArticleSubmitted = useCallback(() => {
        const supabase = createClientSafe();
        if (!supabase) return;
        supabase
            .from('triplepedia_articles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .then(({ count }) => setArticleCount(count ?? 0));
    }, []);

    return (
        <div className="relative min-h-screen bg-white dark:bg-[#0d0d0d] overflow-hidden flex flex-col">
            {STARS.map((star, i) => (
                <span
                    key={i}
                    className="absolute text-black/10 dark:text-white/15 text-xs select-none pointer-events-none leading-none"
                    style={{ left: `${star.x}%`, top: `${star.y}%` }}
                >
                    +
                </span>
            ))}

            <div className="relative z-10 flex items-center justify-between px-6 py-4">
                <Link
                    href="/chat"
                    className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-white/40 hover:text-zinc-800 dark:hover:text-white/80 transition-colors"
                >
                    <span className="text-base leading-none">&larr;</span>
                    <span>Back to chat</span>
                </Link>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={() => setSuggestOpen(true)}
                        className="px-4 py-1.5 rounded-full border border-black/20 dark:border-white/20 text-sm text-black/70 dark:text-white/80 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40 transition-colors"
                    >
                        Suggest Article
                    </button>
                    <TriplepediaUserButton variant="dark" />
                </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                <h1 className="font-serif text-[68px] font-normal text-zinc-900 dark:text-white mb-10 tracking-tight leading-none select-none">
                    Triplepedia{' '}
                    <span className="text-[34px] text-zinc-400 dark:text-white/30 italic font-normal align-middle">
                        v0.1
                    </span>
                </h1>

                <div className="w-full max-w-2xl px-4 relative" ref={wrapperRef}>
                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-3.5 focus-within:border-zinc-400 dark:focus-within:border-white/20 transition-colors">
                        <Search size={16} className="text-zinc-400 dark:text-white/30 shrink-0" />
                        <input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search Triplepedia..."
                            className="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/25 text-base outline-none"
                        />
                        <button
                            onClick={handleSearch}
                            className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
                        >
                            <ArrowUp size={15} className="text-white dark:text-black" />
                        </button>
                    </div>

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-[calc(100%-6px)] left-4 right-4 rounded-b-2xl border border-t-0 border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm overflow-hidden z-50 shadow-lg">
                            {suggestions.map((s) => (
                                <button
                                    key={s.slug}
                                    onClick={() => {
                                        setShowSuggestions(false);
                                        router.push(`/triplepedia/${s.slug}`);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border-t border-zinc-100 dark:border-white/5 first:border-t-0"
                                >
                                    <Search size={13} className="text-zinc-400 dark:text-white/25 shrink-0" />
                                    <span className="text-sm text-zinc-700 dark:text-white/70">{s.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 pb-8 px-8 flex items-end justify-between">
                <div className="text-xs text-zinc-400 dark:text-white/20 font-mono">Triplepedia v0.1</div>

                <div className="text-center">
                    <p className="text-xs text-zinc-400 dark:text-white/30 mb-1 tracking-widest uppercase">
                        Articles
                    </p>
                    <p className="text-2xl font-mono font-semibold text-zinc-600 dark:text-white/50 tabular-nums tracking-tight">
                        {articleCount !== null ? articleCount.toLocaleString() : '\u2014'}
                    </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-white/20">
                    <span className="hover:text-zinc-600 dark:hover:text-white/40 transition-colors cursor-default">
                        Terms of Service
                    </span>
                    <span>&middot;</span>
                    <span className="hover:text-zinc-600 dark:hover:text-white/40 transition-colors cursor-default">
                        Privacy Policy
                    </span>
                    <span>&middot;</span>
                    <span className="hover:text-zinc-600 dark:hover:text-white/40 transition-colors cursor-default">
                        Acceptable Use
                    </span>
                </div>
            </div>

            <SuggestArticleModal
                open={suggestOpen}
                onClose={() => setSuggestOpen(false)}
                onSubmitted={handleArticleSubmitted}
            />
        </div>
    );
}
