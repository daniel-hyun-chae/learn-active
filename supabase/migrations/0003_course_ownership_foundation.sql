-- Ownership foundation for publisher-managed resources.
-- Management access is owner/member based.
-- Learner/public read access remains a separate concern.

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('user', 'organization', 'system')),
  personal_user_id uuid null references public.profiles(user_id) on delete cascade,
  name text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint owners_personal_user_type_check check (
    (type = 'user' and personal_user_id is not null)
    or (type in ('organization', 'system') and personal_user_id is null)
  )
);

create unique index if not exists owners_personal_user_id_unique
  on public.owners(personal_user_id)
  where personal_user_id is not null;

create unique index if not exists owners_single_system_owner_unique
  on public.owners(type)
  where type = 'system';

create index if not exists owners_type_idx on public.owners(type);

create table if not exists public.owner_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  unique(owner_id, user_id)
);

create index if not exists owner_members_owner_id_idx on public.owner_members(owner_id);
create index if not exists owner_members_user_id_idx on public.owner_members(user_id);
create index if not exists owner_members_owner_user_idx on public.owner_members(owner_id, user_id);

alter table public.courses
  add column if not exists owner_id uuid references public.owners(id) on delete restrict;

insert into public.owners (type, name)
select 'system', '__bootstrap_system_owner__'
where not exists (
  select 1 from public.owners where type = 'system'
);

with system_owner as (
  select id from public.owners where type = 'system' limit 1
)
update public.courses
set owner_id = system_owner.id
from system_owner
where public.courses.owner_id is null;

alter table public.courses
  alter column owner_id set not null;

create index if not exists courses_owner_id_idx on public.courses(owner_id);

create or replace function public.provision_personal_owner(
  p_user_id uuid,
  p_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  insert into public.profiles (user_id, email)
  values (p_user_id, p_email)
  on conflict (user_id)
  do update
    set email = coalesce(excluded.email, public.profiles.email),
        updated_at = timezone('utc', now());

  insert into public.owners (type, personal_user_id)
  values ('user', p_user_id)
  on conflict do nothing;

  select id into v_owner_id
  from public.owners
  where type = 'user'
    and personal_user_id = p_user_id
  limit 1;

  if v_owner_id is null then
    raise exception 'Failed to provision personal owner for user %', p_user_id;
  end if;

  insert into public.owner_members (owner_id, user_id, role)
  values (v_owner_id, p_user_id, 'owner')
  on conflict (owner_id, user_id)
  do update set role = 'owner';

  return v_owner_id;
end;
$$;

create or replace function public.ensure_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists owners_ensure_updated_at on public.owners;
create trigger owners_ensure_updated_at
before update on public.owners
for each row execute function public.ensure_updated_at();

create or replace function public.ensure_personal_owner_membership_consistency()
returns trigger
language plpgsql
as $$
declare
  broken_count integer;
begin
  select count(*) into broken_count
  from public.owners o
  where o.type = 'user'
    and not exists (
      select 1
      from public.owner_members om
      where om.owner_id = o.id
        and om.user_id = o.personal_user_id
        and om.role = 'owner'
    );

  if broken_count > 0 then
    raise exception 'Personal owner invariant violation: each user owner must have matching owner_members row with role owner.';
  end if;

  return null;
end;
$$;

drop trigger if exists owners_personal_membership_guard on public.owners;
create constraint trigger owners_personal_membership_guard
after insert or update on public.owners
deferrable initially deferred
for each row execute function public.ensure_personal_owner_membership_consistency();

drop trigger if exists owner_members_personal_membership_guard on public.owner_members;
create constraint trigger owner_members_personal_membership_guard
after insert or update or delete on public.owner_members
deferrable initially deferred
for each row execute function public.ensure_personal_owner_membership_consistency();

alter table public.owners enable row level security;
alter table public.owner_members enable row level security;
alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists owners_select_member on public.owners;
create policy owners_select_member
on public.owners
for select
to authenticated
using (
  exists (
    select 1
    from public.owner_members om
    where om.owner_id = owners.id
      and om.user_id = auth.uid()
  )
  or owners.type = 'system'
);

drop policy if exists owner_members_select_same_owner on public.owner_members;
create policy owner_members_select_same_owner
on public.owner_members
for select
to authenticated
using (
  exists (
    select 1
    from public.owner_members own
    where own.owner_id = owner_members.owner_id
      and own.user_id = auth.uid()
  )
);

drop policy if exists courses_select_public_or_member on public.courses;
create policy courses_select_public_or_member
on public.courses
for select
to authenticated
using (
  exists (
    select 1
    from public.owners o
    where o.id = courses.owner_id
      and o.type = 'system'
  )
  or exists (
    select 1
    from public.owner_members om
    where om.owner_id = courses.owner_id
      and om.user_id = auth.uid()
  )
);

drop policy if exists courses_manage_owner_member on public.courses;
create policy courses_manage_owner_member
on public.courses
for all
to authenticated
using (
  exists (
    select 1
    from public.owner_members om
    where om.owner_id = courses.owner_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.owner_members om
    where om.owner_id = courses.owner_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  )
);
