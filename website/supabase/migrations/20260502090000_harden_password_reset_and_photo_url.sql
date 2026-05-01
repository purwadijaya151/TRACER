create table if not exists public.password_reset_attempts (
  id uuid primary key default uuid_generate_v4(),
  rate_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_attempts_rate_key_created_at_idx
on public.password_reset_attempts (rate_key, created_at desc);

alter table public.password_reset_attempts enable row level security;
revoke all on public.password_reset_attempts from public, anon, authenticated;
grant select, insert, delete on public.password_reset_attempts to service_role;

create or replace function public.update_own_alumni_photo(p_foto_url text)
returns public.alumni
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.alumni;
  v_object_path text;
  v_object_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  v_object_path := substring(
    p_foto_url from (
      '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/alumni-photos/('
      || auth.uid()::text
      || '/[^?#]+)$'
    )
  );

  if v_object_path is null then
    raise exception 'invalid_photo_url' using errcode = '22000';
  end if;

  select exists (
    select 1
    from storage.objects
    where bucket_id = 'alumni-photos'
      and name = v_object_path
  ) into v_object_exists;

  if not v_object_exists then
    raise exception 'invalid_photo_url' using errcode = '22000';
  end if;

  update public.alumni
  set foto_url = p_foto_url
  where id = auth.uid()
  returning * into v_profile;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  return v_profile;
end;
$$;

revoke all on function public.update_own_alumni_photo(text) from public, anon, authenticated;
grant execute on function public.update_own_alumni_photo(text) to authenticated, service_role;
