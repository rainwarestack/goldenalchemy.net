-- Golden Alchemy only. Run in the verified Golden Alchemy Supabase project.
-- Authentication and profile foundation; not a payment or membership grant flow.
begin;

create table if not exists public.ga_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~* '^chef[a-z0-9_]{1,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 80),
  biography text not null default '' check (char_length(biography) <= 1000),
  specialty text not null default '' check (char_length(specialty) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ga_profiles_username_casefold
  on public.ga_profiles (lower(username));

create table if not exists public.ga_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'expired')),
  tier text not null default 'none' check (char_length(tier) between 1 and 50),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.ga_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.ga_set_updated_at() from public, anon, authenticated;

drop trigger if exists ga_profiles_updated_at on public.ga_profiles;
create trigger ga_profiles_updated_at before update on public.ga_profiles
  for each row execute function public.ga_set_updated_at();
drop trigger if exists ga_memberships_updated_at on public.ga_memberships;
create trigger ga_memberships_updated_at before update on public.ga_memberships
  for each row execute function public.ga_set_updated_at();

alter table public.ga_profiles enable row level security;
alter table public.ga_memberships enable row level security;

-- Start private: users can only see/edit their own profile.
-- Member-visible profile discovery will be a separate reviewed migration.
revoke all on public.ga_profiles from public, anon, authenticated;
revoke all on public.ga_memberships from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.ga_profiles to authenticated;
grant insert (user_id, username, display_name, biography, specialty)
  on public.ga_profiles to authenticated;
grant update (username, display_name, biography, specialty)
  on public.ga_profiles to authenticated;
grant select on public.ga_memberships to authenticated;
grant all on public.ga_profiles, public.ga_memberships to service_role;

drop policy if exists ga_profiles_read_own on public.ga_profiles;
create policy ga_profiles_read_own on public.ga_profiles for select
  to authenticated using (user_id = (select auth.uid()));
drop policy if exists ga_profiles_create_own on public.ga_profiles;
create policy ga_profiles_create_own on public.ga_profiles for insert
  to authenticated with check (user_id = (select auth.uid()));
drop policy if exists ga_profiles_update_own on public.ga_profiles;
create policy ga_profiles_update_own on public.ga_profiles for update
  to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists ga_memberships_read_own on public.ga_memberships;
create policy ga_memberships_read_own on public.ga_memberships for select
  to authenticated using (user_id = (select auth.uid()));

-- Only reports the current signed-in user's membership; no client-supplied ID.
-- End-user roles cannot insert, update, or delete membership rows.
create or replace function public.ga_is_guild_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ga_memberships
    where user_id = (select auth.uid()) and status = 'active'
      and (valid_until is null or valid_until > now())
  );
$$;
revoke all on function public.ga_is_guild_member() from public, anon, authenticated;
grant execute on function public.ga_is_guild_member() to authenticated;

comment on table public.ga_profiles is 'Golden Alchemy private member profile foundation';
comment on table public.ga_memberships is 'Golden Alchemy membership entitlements; trusted administration only';
commit;
