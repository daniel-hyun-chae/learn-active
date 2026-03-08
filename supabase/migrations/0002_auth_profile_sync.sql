-- Auth identity sync for app-level profiles table.

alter table if exists public.profiles
  add column if not exists email text;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_profile on auth.users;

create trigger on_auth_user_created_sync_profile
after insert on auth.users
for each row
execute function public.sync_profile_from_auth_user();
