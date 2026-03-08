-- Baseline schema for Supabase-managed PostgreSQL.
-- Source of truth: supabase/migrations/*

create extension if not exists "pgcrypto";

do $$
begin
  create type public.profile_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.courses (
  id text primary key,
  title text not null,
  description text not null,
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint courses_title_nonempty check (char_length(btrim(title)) > 0),
  constraint courses_description_nonempty check (char_length(btrim(description)) > 0),
  constraint courses_content_is_object check (jsonb_typeof(content) = 'object')
);

create index if not exists courses_updated_at_idx
  on public.courses (updated_at desc);

create table if not exists public.profiles (
  user_id uuid primary key,
  status public.profile_status not null default 'active',
  display_name text,
  locale text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_locale_format check (
    locale is null
    or locale ~ '^[a-z]{2}(-[A-Z]{2})?$'
  )
);

create index if not exists profiles_status_idx
  on public.profiles (status);

comment on table public.profiles is
  'Future auth compatibility table. user_id is intended to map to auth.users.id in a later phase.';

comment on column public.profiles.user_id is
  'UUID compatible with Supabase auth.users.id (FK wiring deferred to auth phase).';
