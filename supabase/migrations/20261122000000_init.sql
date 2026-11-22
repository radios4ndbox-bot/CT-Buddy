-- CT Buddy — schema iniziale
-- Regola d'oro: nessun dato identificativo del paziente in queste tabelle.
-- Tutte le tabelle hanno RLS: ogni utente vede e modifica solo i propri record.
-- updated_at / deleted_at servono alla sincronizzazione offline-first (last-write-wins, soft delete).

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Trigger comune: aggiorna updated_at a ogni modifica
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles (1:1 con auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_settings jsonb not null default '{}'::jsonb,
  yeet_sections text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- crea automaticamente il profilo alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- templates: i "pre-referti" della libreria (modelli anonimi)
-- ------------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  modality text not null default 'TC',
  setting text not null check (setting in ('elettiva', 'urgenza')),
  exam_config jsonb not null default '{}'::jsonb,
  findings jsonb not null default '{}'::jsonb,
  conclusioni text not null default '',
  rendered_esteso text not null default '',
  rendered_breve text not null default '',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  data_version integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index templates_owner_updated_idx on public.templates (owner_id, updated_at);
create index templates_tags_idx on public.templates using gin (tags);

create trigger templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- acq_presets: griglie di Acquisizione salvate con "Ricordami"
-- ------------------------------------------------------------
create table public.acq_presets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  matrix jsonb not null default '{}'::jsonb,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index acq_presets_owner_updated_idx on public.acq_presets (owner_id, updated_at);

create trigger acq_presets_updated_at
  before update on public.acq_presets
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- learned_keywords: parole chiave apprese (PACS, protocolli, organi)
-- ------------------------------------------------------------
create table public.learned_keywords (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  scope text not null check (scope in ('pacs', 'protocol', 'organ')),
  target_id text not null,
  keyword text not null check (char_length(keyword) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (owner_id, scope, target_id, keyword)
);

create index learned_keywords_owner_updated_idx on public.learned_keywords (owner_id, updated_at);

create trigger learned_keywords_updated_at
  before update on public.learned_keywords
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.acq_presets enable row level security;
alter table public.learned_keywords enable row level security;

create policy "profiles: lettura propria" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: modifica propria" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "templates: tutto sui propri" on public.templates
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "acq_presets: tutto sui propri" on public.acq_presets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "learned_keywords: tutto sui propri" on public.learned_keywords
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
