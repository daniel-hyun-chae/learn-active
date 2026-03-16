-- Learner exercise attempt history for review timeline.

create table if not exists public.learner_exercise_attempt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  lesson_id text not null,
  exercise_id text not null,
  answers jsonb not null default '{}'::jsonb,
  is_correct boolean not null,
  attempted_at timestamptz not null default timezone('utc', now())
);

create index if not exists learner_attempt_history_user_course_idx
  on public.learner_exercise_attempt_history(user_id, course_id);

create index if not exists learner_attempt_history_user_version_idx
  on public.learner_exercise_attempt_history(user_id, course_version_id);

create index if not exists learner_attempt_history_exercise_idx
  on public.learner_exercise_attempt_history(
    user_id,
    course_id,
    course_version_id,
    lesson_id,
    exercise_id,
    attempted_at
  );

alter table public.learner_exercise_attempt_history enable row level security;

drop policy if exists learner_attempt_history_select_self on public.learner_exercise_attempt_history;
create policy learner_attempt_history_select_self
on public.learner_exercise_attempt_history
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists learner_attempt_history_insert_self on public.learner_exercise_attempt_history;
create policy learner_attempt_history_insert_self
on public.learner_exercise_attempt_history
for insert
to authenticated
with check (user_id = auth.uid());
