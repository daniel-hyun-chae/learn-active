-- Learner exercise attempt persistence for progress tracking.

create table if not exists public.learner_exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  lesson_id text not null,
  exercise_id text not null,
  answers jsonb not null default '{}'::jsonb,
  is_correct boolean not null,
  attempted_at timestamptz not null default timezone('utc', now()),
  unique(user_id, course_id, course_version_id, lesson_id, exercise_id)
);

create index if not exists learner_exercise_attempts_user_course_idx
  on public.learner_exercise_attempts(user_id, course_id);

create index if not exists learner_exercise_attempts_user_version_idx
  on public.learner_exercise_attempts(user_id, course_version_id);

alter table public.learner_exercise_attempts enable row level security;

drop policy if exists learner_exercise_attempts_select_self on public.learner_exercise_attempts;
create policy learner_exercise_attempts_select_self
on public.learner_exercise_attempts
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists learner_exercise_attempts_insert_self on public.learner_exercise_attempts;
create policy learner_exercise_attempts_insert_self
on public.learner_exercise_attempts
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists learner_exercise_attempts_update_self on public.learner_exercise_attempts;
create policy learner_exercise_attempts_update_self
on public.learner_exercise_attempts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
