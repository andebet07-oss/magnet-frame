-- Isolation check for templates and template files.
--
-- Run in the Supabase SQL Editor after the migration. It creates two throwaway users,
-- acts as each of them, and fails with "FAIL: ..." if one can reach the other's data.
-- Everything happens inside a transaction that is rolled back: nothing is left behind.
-- Expected last result: one row, "ALL ISOLATION CHECKS PASSED".

begin;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'rls-check-a@example.invalid'),
  ('00000000-0000-4000-8000-00000000000b', 'rls-check-b@example.invalid');

-- ---- User A creates a template and a file -----------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);

insert into public.templates (id, name, doc)
values ('00000000-0000-4000-8000-0000000000a1', 'A private', '{"format":"magnet-frame-studio"}');

insert into storage.objects (bucket_id, name)
values ('template-files', '00000000-0000-4000-8000-00000000000a/00000000-0000-4000-8000-0000000000a1/assets/logo.png');

do $$
begin
  if (select owner_id from public.templates where id = '00000000-0000-4000-8000-0000000000a1')
     is distinct from '00000000-0000-4000-8000-00000000000a' then
    raise exception 'FAIL: owner_id was not set to the signed-in user';
  end if;

  update public.templates set name = 'A renamed', owner_id = '00000000-0000-4000-8000-00000000000b', revision = 99
  where id = '00000000-0000-4000-8000-0000000000a1';
  if not found then raise exception 'FAIL: owner could not update their own template'; end if;
  if (select owner_id from public.templates where id = '00000000-0000-4000-8000-0000000000a1')
     is distinct from '00000000-0000-4000-8000-00000000000a' then
    raise exception 'FAIL: ownership could be transferred by an update';
  end if;
  if (select revision from public.templates where id = '00000000-0000-4000-8000-0000000000a1') <> 2 then
    raise exception 'FAIL: revision is not controlled by the server';
  end if;

  begin
    insert into public.templates (name, doc, owner_id)
    values ('spoofed', '{}', '00000000-0000-4000-8000-00000000000b');
    raise exception 'FAIL: A created a template owned by B';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---- User B tries to reach A's data, knowing the exact ids -------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);

do $$
begin
  if exists (select 1 from public.templates where id = '00000000-0000-4000-8000-0000000000a1') then
    raise exception 'FAIL: B can read A''s template';
  end if;

  update public.templates set name = 'hacked' where id = '00000000-0000-4000-8000-0000000000a1';
  if found then raise exception 'FAIL: B updated A''s template'; end if;

  delete from public.templates where id = '00000000-0000-4000-8000-0000000000a1';
  if found then raise exception 'FAIL: B deleted A''s template'; end if;

  if exists (select 1 from storage.objects
             where bucket_id = 'template-files' and name like '00000000-0000-4000-8000-00000000000a/%') then
    raise exception 'FAIL: B can list A''s files';
  end if;

  delete from storage.objects where name like '00000000-0000-4000-8000-00000000000a/%';
  if found then raise exception 'FAIL: B deleted A''s files'; end if;

  begin
    insert into storage.objects (bucket_id, name)
    values ('template-files', '00000000-0000-4000-8000-00000000000a/00000000-0000-4000-8000-0000000000a1/assets/evil.png');
    raise exception 'FAIL: B uploaded into A''s folder';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---- Signed-out visitors get nothing -----------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
begin
  begin
    perform 1 from public.templates;
    raise exception 'FAIL: signed-out visitors can query templates';
  exception when insufficient_privilege then null;
  end;

  -- Either "no rows" or "permission denied" is fine; seeing a file is not.
  begin
    if exists (select 1 from storage.objects where bucket_id = 'template-files') then
      raise exception 'FAIL: signed-out visitors can list files';
    end if;
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---- A still has everything -----------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);

do $$
begin
  if not exists (select 1 from public.templates where id = '00000000-0000-4000-8000-0000000000a1' and name = 'A renamed') then
    raise exception 'FAIL: A lost their template';
  end if;
  if not exists (select 1 from storage.objects where name like '00000000-0000-4000-8000-00000000000a/%') then
    raise exception 'FAIL: A lost their file';
  end if;
end $$;

reset role;
rollback;

select 'ALL ISOLATION CHECKS PASSED' as result;
