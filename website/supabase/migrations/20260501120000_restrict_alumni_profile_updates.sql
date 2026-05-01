revoke update on public.alumni from authenticated;
grant select, insert on public.alumni to authenticated;
grant update (email, no_hp) on public.alumni to authenticated;
grant all on public.alumni to service_role;
