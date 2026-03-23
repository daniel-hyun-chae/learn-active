-- BG-027 learner resume/home experience support.
-- Persists learner last-visited position per enrollment.

alter table public.enrollments
  add column if not exists last_visited_lesson_id text,
  add column if not exists last_visited_block text,
  add column if not exists last_visited_content_page_id text,
  add column if not exists last_visited_exercise_id text,
  add column if not exists last_visited_at timestamptz;

create index if not exists enrollments_user_last_visited_idx
  on public.enrollments(user_id, last_visited_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'enrollments_last_visited_block_check'
  ) then
    alter table public.enrollments
      add constraint enrollments_last_visited_block_check
      check (
        last_visited_block is null
        or last_visited_block in ('summary', 'contentPage', 'exercise')
      );
  end if;
end
$$;
