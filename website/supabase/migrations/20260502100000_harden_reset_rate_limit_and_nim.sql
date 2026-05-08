create or replace function public.consume_password_reset_rate_limit(
  p_rate_keys text[],
  p_window_seconds integer default 900,
  p_max_attempts integer default 5
)
returns table(limited boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_seconds integer := greatest(p_window_seconds, 1);
  v_max_attempts integer := greatest(p_max_attempts, 1);
  v_cutoff timestamptz := now() - make_interval(secs => greatest(p_window_seconds, 1));
  v_limited boolean;
begin
  if p_rate_keys is null or cardinality(p_rate_keys) = 0 then
    raise exception 'rate_keys_required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(keys.rate_key, 0))
  from (
    select distinct unnest(p_rate_keys) as rate_key
    order by rate_key
  ) keys;

  delete from public.password_reset_attempts
  where created_at < v_cutoff;

  select exists (
    select 1
    from public.password_reset_attempts
    where rate_key = any(p_rate_keys)
      and created_at >= v_cutoff
    group by rate_key
    having count(*) >= v_max_attempts
  ) into v_limited;

  if v_limited then
    return query select true, v_window_seconds;
    return;
  end if;

  insert into public.password_reset_attempts (rate_key)
  select distinct unnest(p_rate_keys);

  return query select false, null::integer;
end;
$$;

revoke all on function public.consume_password_reset_rate_limit(text[], integer, integer) from public, anon, authenticated;
grant execute on function public.consume_password_reset_rate_limit(text[], integer, integer) to service_role;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
