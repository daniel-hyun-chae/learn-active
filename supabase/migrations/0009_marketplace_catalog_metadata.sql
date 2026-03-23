-- BG-030 marketplace catalog discovery metadata.
-- Adds category, tag, language, and free preview lesson metadata to courses.

alter table public.courses
  add column if not exists category_ids text[] not null default '{}'::text[],
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists language_code text not null default 'en',
  add column if not exists preview_lesson_id text;

create index if not exists courses_category_ids_gin_idx
  on public.courses using gin(category_ids);

create index if not exists courses_language_code_idx
  on public.courses(language_code);

create index if not exists courses_preview_lesson_id_idx
  on public.courses(preview_lesson_id)
  where preview_lesson_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'courses_language_code_format_check'
  ) then
    alter table public.courses
      add constraint courses_language_code_format_check
      check (language_code ~ '^[a-z]{2}(-[a-z]{2})?$');
  end if;
end
$$;
