'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Search, RefreshCw, MessageSquare, X } from 'lucide-react';
import { createClientSafe } from '@/lib/supabase/client';
import ThemeToggle from '@/components/Layout/ThemeToggle';
import SuggestArticleModal from '../_components/SuggestArticleModal';
import TriplepediaUserButton from '../_components/TriplepediaUserButton';
import { AnimatePresence, motion } from 'framer-motion';

function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    return `${months} months ago`;
}

interface Section {
    heading: string;
    content?: string;
    subheadings?: Array<{ heading: string; content: string }>;
}

interface InfoboxEntry {
    label: string;
    value: string | string[];
}

interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string;
    sections: Section[];
    infobox: InfoboxEntry[];
    submitted_by: string | null;
    fact_checked_at: string;
    created_at: string;
    status: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

function ArticleChatPanel({ article, onClose }: { article: Article; onClose: () => void }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const content = input.trim();
        if (!content || isGenerating) return;
        setInput('');

        const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content };
        const assistantId = crypto.randomUUID();

        setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
        setIsGenerating(true);
        abortRef.current = new AbortController();

        try {
            const history = messages.map((m) => ({ role: m.role, content: m.content }));
            const systemContext = `You are an expert assistant for the Triplepedia article "${article.title}". Answer questions about it accurately.\n\n## Summary\n${article.summary}\n\n${article.sections.map(s => `## ${s.heading}\n${s.content || ''}`).join('\n\n')}`;

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortRef.current.signal,
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemContext },
                        ...history,
                        { role: 'user', content },
                    ],
                    model: 'suzhou-3',
                }),
            });

            if (!res.ok || !res.body) throw new Error('API error');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let accumulated = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') break;
                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.content ?? '';
                        if (delta) {
                            accumulated += delta;
                            setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m));
                        }
                    } catch { /* skip */ }
                }
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: 'Something went wrong. Try again.' } : m));
            }
        } finally {
            setIsGenerating(false);
            abortRef.current = null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-card border-l border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{article.title}</p>
                    <p className="text-[10px] text-muted-foreground">Ask about this article</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground">
                    <X size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground/60 text-center pt-8">
                        Ask me anything about &ldquo;{article.title}&rdquo;
                    </p>
                )}
                {messages.map((m) => (
                    <div key={m.id} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block px-3 py-2 rounded-xl max-w-[90%] ${
                            m.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/50 text-foreground'
                        }`}>
                            {m.content || <span className="opacity-40">Thinking...</span>}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="border-t border-border p-3">
                <div className="flex items-center gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Ask about this article..."
                        className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-foreground/25"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isGenerating || !input.trim()}
                        className="h-9 w-9 rounded-xl bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-40 shrink-0"
                    >
                        <MessageSquare size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ArticlePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ title: string; slug: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [chatOpen, setChatOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!slug) return;
        const supabase = createClientSafe();
        if (!supabase) { setNotFound(true); setLoading(false); return; }
        setLoading(true);
        setNotFound(false);
        supabase
            .from('triplepedia_articles')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single()
            .then(({ data, error }) => {
                if (error || !data) setNotFound(true);
                else setArticle(data as Article);
                setLoading(false);
            });
    }, [slug]);

    useEffect(() => {
        if (!query.trim()) { setSuggestions([]); return; }
        const supabase = createClientSafe();
        if (!supabase) return;
        const t = setTimeout(async () => {
            const { data } = await supabase
                .from('triplepedia_articles')
                .select('title, slug')
                .eq('status', 'published')
                .ilike('title', `%${query}%`)
                .limit(5);
            setSuggestions(data ?? []);
        }, 180);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!article) return;
        const headings = document.querySelectorAll('h2[data-section]');
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);
                if (visible) setActiveSection(visible.target.getAttribute('data-section') ?? '');
            },
            { rootMargin: '-20% 0px -70% 0px' }
        );
        headings.forEach((h) => observer.observe(h));
        return () => observer.disconnect();
    }, [article]);

    const handleSearchSubmit = useCallback(() => {
        if (suggestions.length > 0) {
            router.push(`/triplepedia/${suggestions[0].slug}`);
            setShowSuggestions(false);
        }
    }, [suggestions, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-foreground/20 border-t-foreground/60 animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <h1 className="text-xl font-bold text-foreground">Article not found</h1>
                <p className="text-sm text-muted-foreground">This article may not exist yet.</p>
                <Link href="/triplepedia" className="mt-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    Back to Triplepedia
                </Link>
            </div>
        );
    }

    const sectionId = (heading: string) => heading.toLowerCase().replace(/\s+/g, '-');
    const renderParagraphs = (text?: string) => {
        if (!text) return null;
        const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
        return (
            <div className="space-y-4">
                {paragraphs.map((p, i) => (
                    <p key={i} className="text-base text-foreground/85 leading-relaxed">{p}</p>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Top bar */}
            <div className="sticky top-0 z-50 flex items-center gap-4 px-5 py-2.5 border-b border-border bg-background/95 backdrop-blur-sm">
                <Link href="/triplepedia" className="flex items-center gap-1 shrink-0 group">
                    <span className="font-serif text-xl font-normal text-foreground group-hover:opacity-80 transition-opacity">Triplepedia</span>
                    <span className="text-xs text-muted-foreground/40 italic ml-0.5">v0.1</span>
                </Link>

                <div className="flex-1 max-w-md relative" ref={searchRef}>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 focus-within:border-foreground/25 transition-colors">
                        <Search size={13} className="text-muted-foreground shrink-0" />
                        <input
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                            placeholder="Search"
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                        />
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50">
                            {suggestions.map((s) => (
                                <button key={s.slug} onClick={() => { router.push(`/triplepedia/${s.slug}`); setShowSuggestions(false); }}
                                    className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-t border-border first:border-t-0">
                                    <Search size={12} className="text-muted-foreground shrink-0" />
                                    <span className="text-sm">{s.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="ml-auto flex items-center gap-2.5">
                    <Link href="/chat" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <span className="text-base leading-none">&larr;</span>
                        <span>Back to chat</span>
                    </Link>
                    <div className="w-px h-4 bg-border" />
                    <ThemeToggle />
                    <button
                        onClick={() => setChatOpen(true)}
                        className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                        Ask about this article
                    </button>
                    <button onClick={() => setSuggestOpen(true)} className="px-4 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                        Suggest Article
                    </button>
                    <TriplepediaUserButton />
                </div>
            </div>

            {/* Three-column body */}
            <div className="flex max-w-[1300px] mx-auto px-6 py-8 gap-8">
                {/* Left: TOC */}
                <aside className="w-48 shrink-0 hidden lg:block">
                    <nav className="sticky top-20">
                        <ul className="space-y-0.5">
                            {article!.sections.map((s) => (
                                <li key={s.heading}>
                                    <a href={`#${sectionId(s.heading)}`}
                                        className={`block text-sm py-1 px-2 rounded-md transition-colors ${
                                            activeSection === sectionId(s.heading)
                                                ? 'text-foreground bg-muted/50'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                        }`}>
                                        {s.heading}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Center: Article body */}
                <article className="flex-1 min-w-0 max-w-2xl">
                    <div className="flex items-center gap-2 mb-5 text-sm text-muted-foreground">
                        <RefreshCw size={13} className="shrink-0" />
                        <span>
                            Fact-checked by <strong className="text-foreground font-semibold">Taipei 3.1 Extended</strong>{' '}
                            {timeAgo(article!.fact_checked_at)}
                        </span>
                    </div>

                    <h1 className="font-serif text-[42px] font-bold text-foreground mb-6 leading-tight">{article!.title}</h1>

                    {article!.summary && (
                        <div className="mb-8 font-light">{renderParagraphs(article!.summary)}</div>
                    )}

                    {article!.sections.map((section) => (
                        <div key={section.heading} className="mb-10">
                            <h2 id={sectionId(section.heading)} data-section={sectionId(section.heading)}
                                className="font-serif text-[28px] font-bold text-foreground mb-4 border-b border-border pb-2 scroll-mt-24">
                                {section.heading}
                            </h2>
                            {section.content && <div className="mb-4">{renderParagraphs(section.content)}</div>}
                            {section.subheadings?.map((sub) => (
                                <div key={sub.heading} className="mb-5">
                                    <h3 className="font-serif text-xl font-semibold text-foreground mt-5 mb-2">{sub.heading}</h3>
                                    {renderParagraphs(sub.content)}
                                </div>
                            ))}
                        </div>
                    ))}

                    <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground/50 space-y-1">
                        {article!.submitted_by && <p>Submitted by {article!.submitted_by}</p>}
                        <p>Fact-checked by <span className="font-medium text-muted-foreground">Taipei 3.1 Extended</span></p>
                    </div>
                </article>

                {/* Right: Infobox */}
                {article!.infobox && article!.infobox.length > 0 && (() => {
                    const imageEntry = article!.infobox.find((e) => e.label === '__image__');
                    const captionEntry = article!.infobox.find((e) => e.label === '__image_caption__');
                    const dataEntries = article!.infobox.filter((e) => e.label !== '__image__' && e.label !== '__image_caption__');

                    return (
                        <aside className="w-64 shrink-0 hidden xl:block">
                            <div className="sticky top-20 border border-border rounded-xl overflow-hidden">
                                {imageEntry && (
                                    <div className="border-b border-border bg-muted/10">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imageEntry.value as string} alt={captionEntry?.value as string || article!.title} className="w-full object-cover max-h-52" />
                                        {captionEntry && (
                                            <p className="px-3 py-1.5 text-[11px] text-muted-foreground/70 italic text-center leading-snug">
                                                {captionEntry.value as string}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="bg-muted/40 px-4 py-3 border-b border-border">
                                    <h3 className="text-sm font-semibold text-foreground truncate">{article!.title}</h3>
                                </div>
                                {dataEntries.length > 0 && (
                                    <div className="divide-y divide-border">
                                        {dataEntries.map((entry) => (
                                            <div key={entry.label} className="flex items-start justify-between px-4 py-3 gap-3">
                                                <span className="text-sm font-medium text-muted-foreground shrink-0">{entry.label}</span>
                                                <span className="text-sm text-muted-foreground text-right">
                                                    {Array.isArray(entry.value)
                                                        ? entry.value.map((v, i) => <span key={i} className="block">{v}</span>)
                                                        : entry.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </aside>
                    );
                })()}
            </div>

            <SuggestArticleModal open={suggestOpen} onClose={() => setSuggestOpen(false)} />

            {/* Docked article chat panel */}
            <AnimatePresence>
                {chatOpen && article && (
                    <motion.div
                        key="article-chat"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 bottom-0 w-80 z-50 shadow-2xl"
                    >
                        <ArticleChatPanel article={article} onClose={() => setChatOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
