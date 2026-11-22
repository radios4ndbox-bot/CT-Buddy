-- CT Buddy — sincronizzazione della libreria e collegamento del telefono tramite QR
--
-- 1) templates: `updated_at` diventa il timestamp del CLIENT (serve a decidere quale modifica
--    vince, last-write-wins), mentre `server_updated_at` è impostato dal server a ogni scrittura
--    e fa da cursore per scaricare le novità (immune agli orologi sbagliati dei dispositivi).
-- 2) upsert_templates(): carica un lotto di modelli applicando una modifica solo se è più
--    recente di quella già sul server.
-- 3) device_pairings + create_pairing() / claim_pairing(): il sito genera un codice monouso
--    (mostrato come QR), il telefono lo riscatta tramite la Edge Function `claim-pairing`.

-- ------------------------------------------------------------
-- 1) templates: cursore di sincronizzazione lato server
-- ------------------------------------------------------------
alter table public.templates
  add column server_updated_at timestamptz not null default clock_timestamp();

create index templates_owner_server_updated_idx
  on public.templates (owner_id, server_updated_at);

-- updated_at non viene più sovrascritto dal server: lo decide il client
drop trigger templates_updated_at on public.templates;

create or replace function public.set_server_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.server_updated_at = clock_timestamp();
  return new;
end;
$$;

create trigger templates_server_updated_at
  before insert or update on public.templates
  for each row execute function public.set_server_updated_at();

-- ------------------------------------------------------------
-- 2) upsert in blocco con last-write-wins
-- ------------------------------------------------------------
-- security invoker: valgono le policy RLS dell'utente che chiama (owner_id = auth.uid()).
create or replace function public.upsert_templates(items jsonb)
returns setof public.templates
language sql
security invoker
set search_path = public
as $$
  insert into public.templates as t (
    id, owner_id, title, modality, setting, exam_config, findings, conclusioni,
    rendered_esteso, rendered_breve, tags, is_favorite, data_version,
    created_at, updated_at, deleted_at
  )
  select
    (i ->> 'id')::uuid,
    auth.uid(),
    i ->> 'title',
    coalesce(i ->> 'modality', 'TC'),
    i ->> 'setting',
    coalesce(i -> 'exam_config', '{}'::jsonb),
    coalesce(i -> 'findings', '{}'::jsonb),
    coalesce(i ->> 'conclusioni', ''),
    coalesce(i ->> 'rendered_esteso', ''),
    coalesce(i ->> 'rendered_breve', ''),
    coalesce(array(select jsonb_array_elements_text(i -> 'tags')), '{}'),
    coalesce((i ->> 'is_favorite')::boolean, false),
    (i ->> 'data_version')::integer,
    (i ->> 'created_at')::timestamptz,
    (i ->> 'updated_at')::timestamptz,
    (i ->> 'deleted_at')::timestamptz
  from jsonb_array_elements(items) as i
  on conflict (id) do update set
    title = excluded.title,
    modality = excluded.modality,
    setting = excluded.setting,
    exam_config = excluded.exam_config,
    findings = excluded.findings,
    conclusioni = excluded.conclusioni,
    rendered_esteso = excluded.rendered_esteso,
    rendered_breve = excluded.rendered_breve,
    tags = excluded.tags,
    is_favorite = excluded.is_favorite,
    data_version = excluded.data_version,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at
  where t.updated_at < excluded.updated_at
  returning t.*;
$$;

revoke all on function public.upsert_templates(jsonb) from public, anon;
grant execute on function public.upsert_templates(jsonb) to authenticated;

-- ------------------------------------------------------------
-- 3) collegamento dispositivi
-- ------------------------------------------------------------
create table public.device_pairings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- sha256 del codice: il codice in chiaro non viene mai salvato
  code_hash text not null unique,
  expires_at timestamptz not null default now() + interval '3 minutes',
  claimed_at timestamptz,
  device_name text check (char_length(device_name) <= 100),
  created_at timestamptz not null default now()
);

create index device_pairings_user_idx on public.device_pairings (user_id, created_at desc);

alter table public.device_pairings enable row level security;

-- il sito legge lo stato dei propri codici (per mostrare "telefono collegato")
create policy "device_pairings: lettura propria" on public.device_pairings
  for select using (user_id = auth.uid());

-- Genera un codice monouso di 12 caratteri (alfabeto senza caratteri ambigui, ~60 bit),
-- valido 3 minuti; annulla gli eventuali codici precedenti non usati.
create or replace function public.create_pairing()
returns table (id uuid, code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  bytes bytea := gen_random_bytes(12);
  new_code text := '';
  uid uuid := auth.uid();
  i int;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  for i in 0..11 loop
    new_code := new_code || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;

  delete from public.device_pairings p
    where p.user_id = uid and p.claimed_at is null;

  return query
    insert into public.device_pairings as p (user_id, code_hash)
    values (uid, encode(digest(new_code, 'sha256'), 'hex'))
    returning p.id, new_code, p.expires_at;
end;
$$;

revoke all on function public.create_pairing() from public, anon;
grant execute on function public.create_pairing() to authenticated;

-- Riscatta un codice (una sola volta, entro la scadenza) e restituisce l'utente a cui
-- appartiene. Chiamabile SOLO dalla Edge Function con la chiave segreta.
create or replace function public.claim_pairing(p_code_hash text, p_device_name text)
returns uuid
language sql
security definer
set search_path = public
as $$
  update public.device_pairings
     set claimed_at = now(),
         device_name = left(coalesce(p_device_name, ''), 100)
   where code_hash = p_code_hash
     and claimed_at is null
     and expires_at > now()
  returning user_id;
$$;

revoke all on function public.claim_pairing(text, text) from public, anon, authenticated;
grant execute on function public.claim_pairing(text, text) to service_role;
