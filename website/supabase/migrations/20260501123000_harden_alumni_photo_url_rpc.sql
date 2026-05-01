create or replace function public.update_own_alumni_photo(p_foto_url text)
returns public.alumni
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.alumni;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_foto_url is null
    or p_foto_url !~ (
      '^https://efutimhekjhqrwmrzmew\.supabase\.co/storage/v1/object/public/alumni-photos/'
      || auth.uid()::text
      || '/[^?#]+$'
    )
  then
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
