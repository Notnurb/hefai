#!/usr/bin/env node
/**
 * Seed Triplepedia with Wikipedia articles.
 *
 * Usage:
 *   node scripts/seed-triplepedia.mjs --count 50
 *
 * Options:
 *   --count N         Number of articles to fetch (default: 50, use 0 for infinite)
 *   --rps N           Requests per second to Wikipedia (default: 5)
 *   --concurrency N   Parallel workers (default: 8)
 *   --submitted-by X  Attribution string
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_RPS = 5;
const DEFAULT_CONCURRENCY = 8;
const RANDOM_BATCH = 50;
const QUEUE_TARGET = 300;
const USER_AGENT = 'Triplepedia/1.0';

// ── Env loading ──────────────────────────────────────────────────────────────

function loadEnvFile(filePath) {
    if (!existsSync(filePath)) return;
    const raw = readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}

function loadEnv() {
    const root = resolve(process.cwd());
    for (const file of ['.env.local', '.env', '.env.development.local', '.env.development']) {
        loadEnvFile(resolve(root, file));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseArgs(argv) {
    const args = new Map();
    for (let i = 0; i < argv.length; i++) {
        const key = argv[i];
        if (!key.startsWith('--')) continue;
        const value = argv[i + 1];
        if (value && !value.startsWith('--')) { args.set(key.slice(2), value); i++; }
        else args.set(key.slice(2), 'true');
    }
    return args;
}

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function stripHtml(html) {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
        .replace(/&#\d+;/g, '').trim();
}

function extractTableContent(html) {
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

function extractInfobox(html) {
    const tableInner = extractTableContent(html);
    if (!tableInner) return [];
    const rows = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
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
        if (value) rows.push({ label, value });
    }
    const seen = new Map();
    for (const row of rows) seen.set(row.label, row.value);
    return [...seen.entries()].map(([label, value]) => ({ label, value }));
}

function extractParagraphs(html) {
    const paragraphs = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
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

function extractSections(sections) {
    const result = [];
    for (const s of sections) {
        const heading = s.title?.trim();
        if (!heading || SKIP_SECTIONS.has(heading.toLowerCase())) continue;
        const content = extractParagraphs(s.text ?? '');
        if (content.length > 0) result.push({ heading, content });
    }
    return result;
}

// ── Wikipedia fetching ───────────────────────────────────────────────────────

async function extractWikipedia(title) {
    const encoded = encodeURIComponent(title.replace(/_/g, ' '));
    const summaryRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}?redirect=true`,
        { headers: { 'User-Agent': USER_AGENT } }
    );
    if (!summaryRes.ok) throw new Error(`Not found: "${title}"`);
    const summary = await summaryRes.json();
    const resolvedTitle = summary.title ?? title;
    const resolvedEncoded = encodeURIComponent(resolvedTitle.replace(/_/g, ' '));

    const sectionsRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${resolvedEncoded}?redirect=true`,
        { headers: { 'User-Agent': USER_AGENT } }
    );
    const sectionsData = sectionsRes.ok ? await sectionsRes.json() : null;
    const leadHtml = sectionsData?.lead?.sections?.[0]?.text ?? '';
    const infobox = extractInfobox(leadHtml);
    const leadContent = extractParagraphs(leadHtml);

    const rawSections = [];
    if (sectionsData?.sections) rawSections.push(...extractSections(sectionsData.sections));
    if (leadContent.length > 0) rawSections.unshift({ heading: 'Introduction', content: leadContent });

    const imageUrl = summary.originalimage?.source ?? summary.thumbnail?.source ?? null;
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(resolvedTitle.replace(/ /g, '_'))}`;

    return { title: summary.title ?? resolvedTitle, summary: summary.extract ?? '', sections: rawSections, infobox, imageUrl, sourceUrl: wikiUrl };
}

async function fetchRandomWikipediaUrls(count) {
    const target = Math.max(1, Math.floor(count));
    const batches = Math.ceil(target / RANDOM_BATCH);

    const fetchBatch = async (limit) => {
        const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit=${limit}`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        if (res.ok) return res.json();
        throw new Error('Wikipedia API error');
    };

    const results = await Promise.all(
        Array.from({ length: batches }, (_, i) => {
            const remaining = target - i * RANDOM_BATCH;
            const limit = Math.max(1, Math.min(remaining, RANDOM_BATCH));
            return fetchBatch(limit).then((data) =>
                (data?.query?.random ?? []).map((r) =>
                    `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`
                )
            );
        })
    );
    return Array.from(new Set(results.flat())).slice(0, target);
}

function extractTitleFromUrl(url) {
    try {
        const u = new URL(url);
        if (!u.hostname.endsWith('wikipedia.org')) return null;
        if (u.pathname.startsWith('/wiki/')) return decodeURIComponent(u.pathname.replace('/wiki/', ''));
        return null;
    } catch { return null; }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    loadEnv();
    const args = parseArgs(process.argv.slice(2));
    const rps = Number(args.get('rps') ?? DEFAULT_RPS);
    const concurrency = Number(args.get('concurrency') ?? DEFAULT_CONCURRENCY);
    const total = Number(args.get('count') ?? 50);
    const submittedBy = args.get('submitted-by') ?? 'Triplepedia Bot';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Ensure table exists
    console.log('Ensuring triplepedia_articles table exists...');
    const { error: tableCheck } = await supabase.from('triplepedia_articles').select('id').limit(1);
    if (tableCheck) {
        console.error('Table triplepedia_articles does not exist. Run the migration SQL first:');
        console.error('  supabase/migrations/20240101000000_create_triplepedia_articles.sql');
        process.exit(1);
    }

    const intervalMs = 1000 / rps;
    let nextAllowed = Date.now();
    const queue = [];
    const active = new Set();
    let processed = 0, inserted = 0, failed = 0;

    async function rateLimit() {
        const now = Date.now();
        if (now < nextAllowed) await sleep(nextAllowed - now);
        nextAllowed = Math.max(nextAllowed + intervalMs, Date.now() + intervalMs);
    }

    async function processUrl(url) {
        try {
            const title = extractTitleFromUrl(url);
            if (!title) return;
            const data = await extractWikipedia(title);
            const slug = `${slugify(data.title || 'article')}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

            const finalInfobox = [
                ...(data.imageUrl ? [{ label: '__image__', value: data.imageUrl }] : []),
                ...(data.infobox ?? []),
                { label: 'Source', value: data.sourceUrl },
            ];

            const { error } = await supabase.from('triplepedia_articles').insert({
                title: data.title, slug,
                summary: data.summary,
                sections: data.sections,
                infobox: finalInfobox,
                submitted_by: submittedBy,
                fact_checked_at: new Date().toISOString(),
                status: 'published',
            });

            if (error) { failed++; console.error(`  FAIL: ${data.title} - ${error.message}`); }
            else { inserted++; }
        } catch (e) {
            failed++;
        } finally {
            processed++;
        }
    }

    console.log(`Seeding ${total} articles | rps=${rps} | concurrency=${concurrency}\n`);

    // Fill queue
    const urls = await fetchRandomWikipediaUrls(total);
    queue.push(...urls);

    while (queue.length > 0 || active.size > 0) {
        while (active.size < concurrency && queue.length > 0) {
            const url = queue.shift();
            if (!url) break;
            await rateLimit();
            const p = processUrl(url).finally(() => active.delete(p));
            active.add(p);
        }
        if (active.size > 0) await Promise.race(active);

        process.stdout.write(`\r  processed ${processed}/${total} | inserted ${inserted} | failed ${failed} | in-flight ${active.size}`);
    }

    await Promise.all(active);
    console.log(`\n\nDone! Inserted ${inserted} articles (${failed} failed).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
