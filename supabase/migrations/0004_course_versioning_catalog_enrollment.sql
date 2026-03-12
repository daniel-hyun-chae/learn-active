-- Course identity/version/enrollment model.
-- Publisher management (owners) stays separate from learner/public access.

create table if not exists public.courses_next (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete restrict,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists courses_next_owner_id_idx on public.courses_next(owner_id);

create table if not exists public.course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses_next(id) on delete cascade,
  version integer not null,
  status text not null check (status in ('draft', 'published', 'archived')),
  title text not null,
  description text not null,
  content jsonb not null,
  change_note text null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  published_at timestamptz null,
  archived_at timestamptz null,
  unique(course_id, version)
);

create index if not exists course_versions_course_id_idx
  on public.course_versions(course_id);
create index if not exists course_versions_course_status_idx
  on public.course_versions(course_id, status);

create table if not exists public.course_publications (
  course_id uuid primary key references public.courses_next(id) on delete cascade,
  published_version_id uuid not null references public.course_versions(id) on delete cascade,
  published_at timestamptz not null default timezone('utc', now())
);

create index if not exists course_publications_version_idx
  on public.course_publications(published_version_id);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  course_id uuid not null references public.courses_next(id) on delete cascade,
  enrolled_at timestamptz not null default timezone('utc', now()),
  status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
  unique(user_id, course_id)
);

create index if not exists enrollments_user_id_idx on public.enrollments(user_id);
create index if not exists enrollments_course_id_idx on public.enrollments(course_id);

create temp table course_identity_map (
  legacy_id text primary key,
  new_id uuid not null
) on commit drop;

insert into course_identity_map(legacy_id, new_id)
select c.id, gen_random_uuid()
from public.courses c;

insert into public.courses_next (id, owner_id, slug, created_at, updated_at)
select
  m.new_id,
  c.owner_id,
  concat(
    regexp_replace(lower(coalesce(nullif(c.title, ''), 'course')), '[^a-z0-9]+', '-', 'g'),
    '-',
    substring(md5(c.id), 1, 6)
  ) as slug,
  coalesce(c.created_at, timezone('utc', now())),
  coalesce(c.updated_at, timezone('utc', now()))
from public.courses c
join course_identity_map m on m.legacy_id = c.id;

-- Ensure created_by backfill always has a deterministic profile fallback.
insert into public.profiles (user_id, email, display_name)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'system-migration@local.invalid',
  'System Migration Profile'
)
on conflict (user_id) do nothing;

with inserted_versions as (
  insert into public.course_versions (
    course_id,
    version,
    status,
    title,
    description,
    content,
    change_note,
    created_at,
    created_by,
    published_at,
    archived_at
  )
  select
    m.new_id,
    1,
    'published',
    c.title,
    c.description,
    c.content,
    'Initial migrated published version',
    coalesce(c.created_at, timezone('utc', now())),
    coalesce(
      (
        select o.personal_user_id
        from public.owners o
        join public.profiles p on p.user_id = o.personal_user_id
        where o.id = c.owner_id
          and o.personal_user_id is not null
        limit 1
      ),
      (
        select om.user_id
        from public.owner_members om
        join public.profiles p on p.user_id = om.user_id
        where om.owner_id = c.owner_id
        order by
          case when om.role in ('owner', 'admin', 'editor') then 0 else 1 end,
          om.created_at asc nulls last
        limit 1
      ),
      '00000000-0000-0000-0000-000000000001'::uuid
    ),
    timezone('utc', now()),
    null
  from public.courses c
  join course_identity_map m on m.legacy_id = c.id
  returning course_id, id, published_at
)
insert into public.course_publications (course_id, published_version_id, published_at)
select course_id, id, coalesce(published_at, timezone('utc', now()))
from inserted_versions;

drop policy if exists courses_select_public_or_member on public.courses;
drop policy if exists courses_manage_owner_member on public.courses;

drop table public.courses;
alter table public.courses_next rename to courses;

alter index if exists courses_next_owner_id_idx rename to courses_owner_id_idx;

create or replace function public.ensure_course_publication_integrity()
returns trigger
language plpgsql
as $$
declare
  publication_course_id uuid;
begin
  select course_id into publication_course_id
  from public.course_versions
  where id = new.published_version_id;

  if publication_course_id is null or publication_course_id <> new.course_id then
    raise exception 'course_publications.published_version_id must belong to the same course_id';
  end if;

  return new;
end;
$$;

drop trigger if exists course_publications_integrity_guard on public.course_publications;
create trigger course_publications_integrity_guard
before insert or update on public.course_publications
for each row execute function public.ensure_course_publication_integrity();

drop trigger if exists enrollments_version_integrity_guard on public.enrollments;
drop function if exists public.ensure_enrollment_version_integrity();

create or replace function public.touch_course_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.courses
  set updated_at = timezone('utc', now())
  where id = new.course_id;
  return new;
end;
$$;

drop trigger if exists course_versions_touch_course on public.course_versions;
create trigger course_versions_touch_course
after insert or update on public.course_versions
for each row execute function public.touch_course_updated_at();

alter table public.course_versions enable row level security;
alter table public.course_publications enable row level security;
alter table public.enrollments enable row level security;

drop policy if exists courses_select_public_or_member on public.courses;
create policy courses_select_public_or_member
on public.courses
for select
to anon, authenticated
using (
  exists (
    select 1 from public.course_publications cp where cp.course_id = courses.id
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

drop policy if exists course_versions_select_published_or_owner on public.course_versions;
create policy course_versions_select_published_or_owner
on public.course_versions
for select
to anon, authenticated
using (
  status = 'published'
  or exists (
    select 1
    from public.courses c
    join public.owner_members om on om.owner_id = c.owner_id
    where c.id = course_versions.course_id
      and om.user_id = auth.uid()
  )
);

drop policy if exists course_versions_manage_owner_member on public.course_versions;
create policy course_versions_manage_owner_member
on public.course_versions
for all
to authenticated
using (
  exists (
    select 1
    from public.courses c
    join public.owner_members om on om.owner_id = c.owner_id
    where c.id = course_versions.course_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.courses c
    join public.owner_members om on om.owner_id = c.owner_id
    where c.id = course_versions.course_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  )
);

drop policy if exists course_publications_select_all on public.course_publications;
create policy course_publications_select_all
on public.course_publications
for select
to anon, authenticated
using (true);

drop policy if exists course_publications_manage_owner_member on public.course_publications;
create policy course_publications_manage_owner_member
on public.course_publications
for all
to authenticated
using (
  exists (
    select 1
    from public.courses c
    join public.owner_members om on om.owner_id = c.owner_id
    where c.id = course_publications.course_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.courses c
    join public.owner_members om on om.owner_id = c.owner_id
    where c.id = course_publications.course_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  )
);

drop policy if exists enrollments_select_self on public.enrollments;
create policy enrollments_select_self
on public.enrollments
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists enrollments_insert_self on public.enrollments;
create policy enrollments_insert_self
on public.enrollments
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists enrollments_update_self on public.enrollments;
create policy enrollments_update_self
on public.enrollments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
