create table public.account_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  revision integer not null check (revision > 0),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and snapshot ?& array['progress', 'collection', 'preferences']
    and jsonb_typeof(snapshot -> 'progress') = 'object'
    and jsonb_typeof(snapshot -> 'collection') = 'object'
    and jsonb_typeof(snapshot -> 'preferences') = 'object'
    and octet_length(snapshot::text) <= 3200000
  )
);

alter table public.account_saves enable row level security;
revoke all on public.account_saves from public, anon, authenticated;
grant select, insert, update on public.account_saves to authenticated;

create policy "Read own saves" on public.account_saves for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Create own saves" on public.account_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Update own saves" on public.account_saves for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
