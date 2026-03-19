create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  diseases text[] default '{}',
  allergies text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id)
);

create table if not exists public.ingredient_rules (
  id uuid primary key default gen_random_uuid(),
  ingredient_name text not null,
  aliases text[] default '{}',
  harmful_for text[] not null,
  severity text not null check (severity in ('critical', 'warning', 'info')),
  reason text
);

create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text,
  ingredients text[] not null default '{}',
  verdict text not null check (verdict in ('safe', 'caution', 'avoid')),
  warnings jsonb not null default '[]'::jsonb,
  image_url text,
  created_at timestamp with time zone default now()
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamp with time zone not null,
  request_count integer not null default 1,
  unique (user_id, window_start)
);

alter table public.user_profiles enable row level security;
alter table public.scan_history enable row level security;
alter table public.rate_limits enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'profiles_own'
  ) then
    execute 'create policy "profiles_own"
      on public.user_profiles
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'scan_history'
      and policyname = 'scan_history_own'
  ) then
    execute 'create policy "scan_history_own"
      on public.scan_history
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rate_limits'
      and policyname = 'rate_limits_own'
  ) then
    execute 'create policy "rate_limits_own"
      on public.rate_limits
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;
