-- Triplepedia articles table
create table if not exists public.triplepedia_articles (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text unique not null,
    summary text not null default '',
    sections jsonb not null default '[]'::jsonb,
    infobox jsonb not null default '[]'::jsonb,
    submitted_by text,
    fact_checked_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    status text not null default 'published'
        check (status in ('published', 'pending', 'rejected'))
);

-- Index for fast slug lookups (used on every article page load)
create index if not exists triplepedia_articles_slug_idx
    on public.triplepedia_articles (slug);

-- Index for title search
create index if not exists triplepedia_articles_title_idx
    on public.triplepedia_articles using gin (title gin_trgm_ops);

-- Enable trigram extension for fast ILIKE search
create extension if not exists pg_trgm;

-- Row Level Security
alter table public.triplepedia_articles enable row level security;

-- Anyone can read published articles
create policy if not exists "Public read published"
    on public.triplepedia_articles
    for select
    using (status = 'published');

-- Anyone can submit articles
create policy if not exists "Public insert"
    on public.triplepedia_articles
    for insert
    with check (true);
