-- Magnet Frame Studio: templates in the cloud, owned by the signed-in user.
--
--   public.templates          one row per template; `doc` is the template.json, unchanged
--   storage "template-files"  private bucket; files live under {owner_id}/{template_id}/...
--
-- Every read and write is limited to the owner by row level security, so a user who
-- knows another user's template id still gets nothing back.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 200),
  doc         jsonb not null check (octet_length(doc::text) <= 512000), -- images are never embedded
  revision    integer not null default 1,                                 -- bumped on every save
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.templates is 'Magnet frame templates. doc holds template.json; images are in the template-files bucket.';
comment on column public.templates.revision is 'Incremented by trigger on every update. Clients save with "where revision = <last seen>" so two open tabs never silently overwrite each other.';

create index templates_owner_updated_idx on public.templates (owner_id, updated_at desc);

-- Server-controlled fields: the client can't change the owner, the creation time or the revision.
create function public.templates_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.owner_id   := old.owner_id;
  new.created_at := old.created_at;
  new.revision   := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger templates_before_update
before update on public.templates
for each row execute function public.templates_before_update();

-- ---------------------------------------------------------------------------
-- Access: signed-in owners only. Anonymous visitors get no access at all.
-- ---------------------------------------------------------------------------

alter table public.templates enable row level security;

revoke all on public.templates from anon;
grant select, insert, update, delete on public.templates to authenticated;

create policy "Owners can read their templates"
  on public.templates for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Owners can create templates"
  on public.templates for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners can update their templates"
  on public.templates for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their templates"
  on public.templates for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- File storage: private bucket, one folder per user.
--   {owner_id}/{template_id}/assets/<file>
--   {owner_id}/{template_id}/thumbnail.png
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'template-files',
  'template-files',
  false,
  20971520, -- 20 MB per file
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "Owners can read their files"
  on storage.objects for select to authenticated
  using (bucket_id = 'template-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners can upload their files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'template-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners can replace their files"
  on storage.objects for update to authenticated
  using (bucket_id = 'template-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'template-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners can delete their files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'template-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
