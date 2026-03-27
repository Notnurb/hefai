import { NextRequest, NextResponse } from 'next/server';

interface ExtractedArticle {
    title: string;
    summary: string;
    sections: Array<{ heading: string; content: string }>;
    infobox: Array<{ label: string; value: string }>;
    references: Array<{ text: string; url?: string }>;
    imageUrl: string | null;
    sourceUrl: string;
    sourceLabel: string;
    license: string;
    attribution: string;
}

function extractWikipediaTitleFromUrl(rawUrl: string): string | null {
    try {
        const url = new URL(rawUrl);
        if (!url.hostname.endsWith('wikipedia.org')) return null;
        if (url.pathname.startsWith('/wiki/')) {
            const title = url.pathname.replace('/wiki/', '');
            return title ? decodeURIComponent(title) : null;
        }
        if (url.pathname === '/w/index.php') {
            const title = url.searchParams.get('title');
            return title ? decodeURIComponent(title) : null;
        }
        return null;
    } catch { return null; }
}

function stripHtml(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#\d+;/g, '')
        .trim();
}

function extractTableContent(html: string): string | null {
    const startRe = /<table[^>]*class="[^"]*infobox[^"]*"[^>]*>/i;
    const startMatch = startRe.exec(html);
    if (!startMatch) return null;
    let pos = startMatch.index + startMatch[0].length;
    let depth = 1;
    while (pos < html.length && depth > 0) {
        const openIdx = html.indexOf('<table', pos);
        const closeIdx = html.indexOf('</table>', pos);
        if (closeIdx === -1) break;
        if (openIdx !== -1 && openIdx < closeIdx) { depth++; pos = openIdx + 6; }
        else { depth--; if (depth === 0) return html.slice(startMatch.index + startMatch[0].length, closeIdx); pos = closeIdx + 8; }
    }
    return null;
}

function extractInfobox(html: string): Array<{ label: string; value: string }> {
    const tableInner = extractTableContent(html);
    if (!tableInner) return [];
    const rows: Array<{ label: string; value: string }> = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(tableInner)) !== null) {
        const cells = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
        if (cells.length < 2) continue;
        const label = stripHtml(cells[0][1]).trim();
        if (!label || label.length > 120) continue;
        const valueHtml = cells[cells.length - 1][1];
        const listItems = [...valueHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
        const value = listItems.length > 0
            ? listItems.map(li => stripHtml(li[1]).trim()).filter(Boolean).join(', ')
            : stripHtml(valueHtml).trim();
        if (value && value.length > 0) rows.push({ label, value });
    }
    const seen = new Map<string, string>();
    for (const row of rows) seen.set(row.label, row.value);
    return [...seen.entries()].map(([label, value]) => ({ label, value }));
}

function extractParagraphs(html: string): string {
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m: RegExpExecArray | null;
    while ((m = pRegex.exec(html)) !== null) {
        const text = stripHtml(m[1]).trim();
        if (text.length > 0) paragraphs.push(text);
    }
    return paragraphs.join('\n\n');
}

const SKIP_SECTIONS = new Set([
    'references', 'see also', 'external links', 'notes',
    'further reading', 'footnotes', 'bibliography',
]);

function extractSections(
    sections: Array<{ title?: string; text?: string; depth?: number }>
): Array<{ heading: string; content: string }> {
    const result: Array<{ heading: string; content: string }> = [];
    for (const s of sections) {
        const heading = s.title?.trim();
        if (!heading || SKIP_SECTIONS.has(heading.toLowerCase())) continue;
        const content = extractParagraphs(s.text ?? '');
        if (content.length > 0) result.push({ heading, content });
    }
    return result;
}

async function fetchReferences(encoded: string): Promise<Array<{ text: string; url?: string }>> {
    try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/references/${encoded}`, {
            headers: { 'User-Agent': 'Triplepedia/1.0' },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const refs: Array<{ text: string; url?: string }> = [];
        for (const entry of Object.values(data.references_by_id ?? {})) {
            const ref = entry as { content?: { html?: string }; urls?: string[] };
            const text = stripHtml(ref.content?.html ?? '').trim();
            if (text.length < 5) continue;
            const urlMatch = (ref.content?.html ?? '').match(/href="(https?:\/\/[^"]+)"/i);
            refs.push({ text, ...(urlMatch?.[1] ? { url: urlMatch[1] } : {}) });
        }
        return refs;
    } catch { return []; }
}

async function extractWikipedia(title: string, originalUrl: string): Promise<ExtractedArticle> {
    const encoded = encodeURIComponent(title.replace(/_/g, ' '));
    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}?redirect=true`, {
        headers: { 'User-Agent': 'Triplepedia/1.0' },
    });
    if (!summaryRes.ok) throw new Error(`Wikipedia article not found: "${title}"`);
    const summary = await summaryRes.json();
    const resolvedTitle: string = summary.title ?? title;
    const resolvedEncoded = encodeURIComponent(resolvedTitle.replace(/_/g, ' '));

    const [sectionsRes, references] = await Promise.all([
        fetch(`https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${resolvedEncoded}?redirect=true`, {
            headers: { 'User-Agent': 'Triplepedia/1.0' },
        }),
        fetchReferences(resolvedEncoded),
    ]);

    const sectionsData = sectionsRes.ok ? await sectionsRes.json() : null;
    const leadHtml = sectionsData?.lead?.sections?.[0]?.text ?? '';
    const infobox = extractInfobox(leadHtml);
    const leadContent = extractParagraphs(leadHtml);
    const rawSections: Array<{ heading: string; content: string }> = [];
    if (sectionsData?.sections) rawSections.push(...extractSections(sectionsData.sections));
    if (leadContent.length > 0) rawSections.unshift({ heading: 'Introduction', content: leadContent });

    const imageUrl: string | null = summary.originalimage?.source ?? summary.thumbnail?.source ?? null;
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(resolvedTitle.replace(/ /g, '_'))}`;

    return {
        title: summary.title ?? resolvedTitle,
        summary: summary.extract ?? '',
        sections: rawSections,
        infobox,
        references,
        imageUrl,
        sourceUrl: wikiUrl,
        sourceLabel: 'Wikipedia',
        license: 'CC BY-SA 4.0',
        attribution: `This article uses content from Wikipedia (${wikiUrl}), available under the Creative Commons Attribution-ShareAlike 4.0 International License.`,
    };
}

async function extractGeneric(url: string): Promise<ExtractedArticle> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Triplepedia/1.0)', Accept: 'text/html' },
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Could not fetch the page (HTTP ${res.status}).`);
    const html = await res.text();

    const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ?? html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+(?:property="og:description"|name="description")[^>]+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);

    const sections: Array<{ heading: string; content: string }> = [];
    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
    let hMatch: RegExpExecArray | null;
    while ((hMatch = h2Regex.exec(html)) !== null && sections.length < 20) {
        const heading = stripHtml(hMatch[1]).trim();
        const body = extractParagraphs(hMatch[2]);
        if (heading && body.length > 40) sections.push({ heading, content: body });
    }

    const hostname = new URL(url).hostname.replace('www.', '');

    return {
        title: stripHtml(titleMatch?.[1] ?? hostname),
        summary: stripHtml(descMatch?.[1] ?? ''),
        sections,
        infobox: [],
        references: [],
        imageUrl: imageMatch?.[1] ?? null,
        sourceUrl: url,
        sourceLabel: hostname,
        license: 'All rights reserved',
        attribution: `Source: ${url}`,
    };
}

export async function POST(req: NextRequest) {
    let url: string;
    try {
        const body = await req.json();
        url = body.url?.trim();
        if (!url) throw new Error('URL is required.');
        new URL(url);
    } catch {
        return NextResponse.json({ error: 'A valid URL is required.' }, { status: 400 });
    }

    try {
        const wikiTitle = extractWikipediaTitleFromUrl(url);
        const result = wikiTitle ? await extractWikipedia(wikiTitle, url) : await extractGeneric(url);
        return NextResponse.json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Extraction failed.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
