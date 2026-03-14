-- Stripe checkout pricing and payment audit support.

alter table public.courses
  add column if not exists price_cents integer;

alter table public.courses
  add column if not exists currency text not null default 'eur';

alter table public.courses
  add column if not exists stripe_price_id text;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  stripe_session_id text not null,
  stripe_payment_intent_id text null,
  amount_cents integer not null,
  currency text not null,
  status text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique(stripe_session_id)
);

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_course_id_idx on public.payments(course_id);

alter table public.payments enable row level security;

drop policy if exists payments_select_self on public.payments;
create policy payments_select_self
on public.payments
for select
to authenticated
using (user_id = auth.uid());
