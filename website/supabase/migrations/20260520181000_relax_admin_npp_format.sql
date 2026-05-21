alter table public.alumni drop constraint if exists alumni_npp_format_check;

alter table public.alumni
  add constraint alumni_npp_format_check
  check (npp is null or npp ~ '^[0-9]{8,18}$')
  not valid;

comment on column public.alumni.npp is 'NPP staff/admin kampus, 8 sampai 18 digit angka. Mahasiswa/alumni tidak memakai kolom ini.';
