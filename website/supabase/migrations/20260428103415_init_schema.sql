-- TracerStudy FT UNIHAZ Supabase schema
-- Run in Supabase SQL Editor before using the Android app.

create extension if not exists "uuid-ossp";

create schema if not exists app_private;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'alumni-photos',
  'alumni-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'admin-avatars',
  'admin-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  create type public.prodi_type as enum (
    'Teknik Mesin',
    'Teknik Informatika',
    'Teknik Sipil'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.status_kerja_type as enum (
    'Bekerja',
    'Wirausaha',
    'Melanjutkan Studi',
    'Belum Bekerja'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.rentang_gaji_type as enum (
    'Di bawah Rp 2.000.000',
    'Rp 2.000.000 - Rp 5.000.000',
    'Rp 5.000.000 - Rp 10.000.000',
    'Di atas Rp 10.000.000'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.waktu_tunggu_type as enum (
    'Kurang dari 3 bulan',
    '3 - 6 bulan',
    'Lebih dari 6 bulan'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.alumni (
  id uuid primary key references auth.users(id) on delete cascade,
  nim varchar(20) unique not null,
  npp varchar(18),
  nama_lengkap varchar(100) not null,
  prodi public.prodi_type not null,
  tahun_masuk integer not null,
  tahun_lulus integer not null,
  ipk decimal(3,2) check (ipk >= 0.00 and ipk <= 4.00),
  tempat_lahir varchar(100),
  tanggal_lahir date,
  no_hp varchar(15),
  email varchar(100),
  alamat text,
  foto_url text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.alumni add column if not exists npp varchar(18);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'alumni'
      and column_name = 'npp'
      and character_maximum_length is distinct from 18
  ) and not exists (
    select 1
    from public.alumni
    where npp is not null and npp !~ '^[0-9]{18}$'
  ) then
    alter table public.alumni alter column npp type varchar(18);
  end if;
end $$;

alter table public.alumni drop constraint if exists alumni_npp_format_check;
alter table public.alumni
  add constraint alumni_npp_format_check
  check (npp is null or npp ~ '^[0-9]{18}$')
  not valid;

comment on column public.alumni.nim is 'NPM mahasiswa/alumni. Untuk row admin legacy, isi kode staff internal, bukan NPP.';
comment on column public.alumni.npp is 'NPP staff/admin kampus, format asli 18 digit angka. Mahasiswa/alumni tidak memakai kolom ini.';

create table if not exists public.tracer_study (
  id uuid primary key default uuid_generate_v4(),
  alumni_id uuid references public.alumni(id) on delete cascade,
  questionnaire_version varchar(40) not null default 'legacy-v1',
  answers jsonb not null default '{}'::jsonb,
  status_kerja public.status_kerja_type not null,
  nama_perusahaan varchar(150),
  bidang_pekerjaan varchar(100),
  jabatan varchar(100),
  rentang_gaji public.rentang_gaji_type,
  provinsi_kerja varchar(100),
  waktu_tunggu public.waktu_tunggu_type,
  kesesuaian_bidang integer check (kesesuaian_bidang between 1 and 5),
  nilai_hard_skill integer check (nilai_hard_skill between 1 and 5),
  nilai_soft_skill integer check (nilai_soft_skill between 1 and 5),
  nilai_bahasa_asing integer check (nilai_bahasa_asing between 1 and 5),
  nilai_it integer check (nilai_it between 1 and 5),
  nilai_kepemimpinan integer check (nilai_kepemimpinan between 1 and 5),
  saran_kurikulum text,
  kesan_kuliah text,
  is_submitted boolean default false,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(alumni_id)
);

alter table public.tracer_study add column if not exists questionnaire_version varchar(40) not null default 'legacy-v1';
alter table public.tracer_study add column if not exists answers jsonb not null default '{}'::jsonb;

do $$
begin
  alter table public.tracer_study
    add constraint tracer_study_answers_object
    check (jsonb_typeof(answers) = 'object');
exception when duplicate_object then null;
end $$;

create table if not exists public.questionnaire_questions (
  id uuid primary key default uuid_generate_v4(),
  questionnaire_version varchar(40) not null default 'launch-v1',
  code varchar(60) not null,
  section_id varchar(60) not null,
  section_title varchar(120) not null,
  section_order integer not null default 1 check (section_order > 0),
  order_index integer not null default 1 check (order_index > 0),
  question_text text not null,
  description text,
  question_type varchar(30) not null check (
    question_type in (
      'text',
      'textarea',
      'number',
      'date',
      'single_choice',
      'multi_choice',
      'scale',
      'matrix_pair'
    )
  ),
  is_required boolean not null default false,
  is_active boolean not null default true,
  options jsonb not null default '[]'::jsonb,
  required_when jsonb,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(questionnaire_version, code)
);

alter table public.questionnaire_questions add column if not exists questionnaire_version varchar(40) not null default 'launch-v1';
alter table public.questionnaire_questions add column if not exists code varchar(60);
alter table public.questionnaire_questions add column if not exists section_id varchar(60);
alter table public.questionnaire_questions add column if not exists section_title varchar(120);
alter table public.questionnaire_questions add column if not exists section_order integer not null default 1;
alter table public.questionnaire_questions add column if not exists order_index integer not null default 1;
alter table public.questionnaire_questions add column if not exists question_text text;
alter table public.questionnaire_questions add column if not exists description text;
alter table public.questionnaire_questions add column if not exists question_type varchar(30);
alter table public.questionnaire_questions add column if not exists is_required boolean not null default false;
alter table public.questionnaire_questions add column if not exists is_active boolean not null default true;
alter table public.questionnaire_questions add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.questionnaire_questions add column if not exists required_when jsonb;
alter table public.questionnaire_questions add column if not exists metadata jsonb;

do $$
begin
  alter table public.questionnaire_questions
    add constraint questionnaire_questions_type_check
    check (
      question_type in (
        'text',
        'textarea',
        'number',
        'date',
        'single_choice',
        'multi_choice',
        'scale',
        'matrix_pair'
      )
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.questionnaire_questions
    add constraint questionnaire_questions_options_json_check
    check (jsonb_typeof(options) in ('array', 'object'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.questionnaire_questions
    add constraint questionnaire_questions_section_order_check
    check (section_order > 0);
exception when duplicate_object then null;
end $$;

comment on table public.questionnaire_questions is 'Bank pertanyaan tracer study yang dikelola admin web dan dibaca aplikasi Android.';
comment on column public.questionnaire_questions.section_order is 'Urutan halaman/section di aplikasi Android. order_index mengatur urutan pertanyaan di dalam section.';
comment on column public.questionnaire_questions.options is 'JSON opsi sesuai question_type. Choice/scale memakai array {value,label}; multi_choice memakai array {field,value,label}; matrix_pair memakai object {leftLabel,rightLabel,scale,rows}.';
comment on column public.questionnaire_questions.required_when is 'JSON kondisi {field, values[]} untuk menampilkan atau mewajibkan pertanyaan secara kondisional.';

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  alumni_id uuid references public.alumni(id) on delete cascade,
  title varchar(200) not null,
  body text not null,
  is_read boolean default false,
  type varchar(50) default 'info',
  created_at timestamptz default now()
);

alter table public.notifications add column if not exists target_type varchar(30);
alter table public.notifications add column if not exists target_label varchar(120);
alter table public.notifications add column if not exists broadcast_id uuid;

create table if not exists public.notification_broadcasts (
  id uuid primary key default uuid_generate_v4(),
  title varchar(200) not null,
  body text not null,
  target_type varchar(30) not null check (target_type in ('all', 'prodi', 'tahun', 'belum_mengisi')),
  target_label varchar(120) not null,
  total_recipients integer not null default 0 check (total_recipients >= 0),
  read_count integer not null default 0 check (read_count >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

do $$
begin
  alter table public.notifications
    add constraint notifications_broadcast_id_fkey
    foreign key (broadcast_id)
    references public.notification_broadcasts(id)
    on delete set null;
exception
  when duplicate_object then null;
end $$;

create table if not exists public.pengaturan_sistem (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  tracer_study_open boolean not null default true,
  periode_tahun_mulai integer not null default ((extract(year from now())::integer) - 5),
  periode_tahun_akhir integer not null default (extract(year from now())::integer),
  pesan_pengingat text not null default 'Mohon lengkapi data tracer study Anda melalui aplikasi TracerStudy FT UNIHAZ.',
  auto_reminder boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.pengaturan_sistem (id)
values ('00000000-0000-0000-0000-000000000001'::uuid)
on conflict (id) do nothing;

create or replace view public.admin_alumni_with_status
with (security_invoker = true)
as
select
  a.*,
  exists (
    select 1
    from public.tracer_study ts
    where ts.alumni_id = a.id
      and ts.is_submitted = true
  ) as tracer_submitted
from public.alumni a
where a.is_admin = false;

revoke all on public.admin_alumni_with_status from public, anon, authenticated;
grant select on public.admin_alumni_with_status to service_role;

create index if not exists alumni_prodi_tahun_lulus_idx on public.alumni(prodi, tahun_lulus);
create unique index if not exists alumni_npp_unique_idx on public.alumni(npp) where npp is not null;
create index if not exists alumni_admin_npp_idx on public.alumni(npp) where is_admin = true;
create index if not exists tracer_study_status_idx on public.tracer_study(status_kerja, is_submitted);
create index if not exists tracer_study_answers_gin_idx on public.tracer_study using gin (answers);
create unique index if not exists questionnaire_questions_version_code_idx on public.questionnaire_questions(questionnaire_version, code);
create index if not exists questionnaire_questions_active_idx on public.questionnaire_questions(questionnaire_version, is_active, section_order, order_index);
create index if not exists questionnaire_questions_options_gin_idx on public.questionnaire_questions using gin (options);
create index if not exists notifications_alumni_read_idx on public.notifications(alumni_id, is_read, created_at desc);
create index if not exists notifications_broadcast_idx on public.notifications(broadcast_id, is_read);
create index if not exists notification_broadcasts_created_idx on public.notification_broadcasts(created_at desc);

alter table public.alumni enable row level security;
alter table public.tracer_study enable row level security;
alter table public.questionnaire_questions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_broadcasts enable row level security;
alter table public.pengaturan_sistem enable row level security;

create or replace function app_private.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.alumni
    where id = user_id and is_admin = true
  );
$$;

revoke all on function app_private.is_admin(uuid) from public;
grant usage on schema app_private to anon, authenticated;
grant execute on function app_private.is_admin(uuid) to anon, authenticated;

drop policy if exists "Alumni can view own profile" on public.alumni;
create policy "Alumni can view own profile"
on public.alumni for select
using (auth.uid() = id);

drop policy if exists "Alumni can insert own profile" on public.alumni;
create policy "Alumni can insert own profile"
on public.alumni for insert
with check (auth.uid() = id);

drop policy if exists "Alumni can update own profile" on public.alumni;
create policy "Alumni can update own profile"
on public.alumni for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admin can view all alumni" on public.alumni;
create policy "Admin can view all alumni"
on public.alumni for select
using (app_private.is_admin(auth.uid()));

drop policy if exists "Alumni can manage own tracer study" on public.tracer_study;
create policy "Alumni can manage own tracer study"
on public.tracer_study for all
using (auth.uid() = alumni_id)
with check (auth.uid() = alumni_id);

drop policy if exists "Admin can view all tracer study" on public.tracer_study;
create policy "Admin can view all tracer study"
on public.tracer_study for select
using (app_private.is_admin(auth.uid()));

drop policy if exists "Authenticated can view active questionnaire questions" on public.questionnaire_questions;
create policy "Authenticated can view active questionnaire questions"
on public.questionnaire_questions for select
to authenticated
using (is_active = true);

drop policy if exists "Admin can manage questionnaire questions" on public.questionnaire_questions;
create policy "Admin can manage questionnaire questions"
on public.questionnaire_questions for all
using (app_private.is_admin(auth.uid()))
with check (app_private.is_admin(auth.uid()));

grant select on public.questionnaire_questions to authenticated;
grant all on public.questionnaire_questions to service_role;

drop policy if exists "Admin can manage notification broadcasts" on public.notification_broadcasts;
create policy "Admin can manage notification broadcasts"
on public.notification_broadcasts for all
using (app_private.is_admin(auth.uid()))
with check (app_private.is_admin(auth.uid()));

drop policy if exists "Admin can manage system settings" on public.pengaturan_sistem;
create policy "Admin can manage system settings"
on public.pengaturan_sistem for all
using (app_private.is_admin(auth.uid()))
with check (app_private.is_admin(auth.uid()));

drop policy if exists "Authenticated can view system settings" on public.pengaturan_sistem;
create policy "Authenticated can view system settings"
on public.pengaturan_sistem for select
to authenticated
using (true);

drop policy if exists "Alumni can view own notifications" on public.notifications;
create policy "Alumni can view own notifications"
on public.notifications for select
using (auth.uid() = alumni_id);

drop policy if exists "Alumni can update own notifications" on public.notifications;
create policy "Alumni can update own notifications"
on public.notifications for update
using (auth.uid() = alumni_id)
with check (auth.uid() = alumni_id);

drop policy if exists "Admin can manage all notifications" on public.notifications;
create policy "Admin can manage all notifications"
on public.notifications for all
using (app_private.is_admin(auth.uid()))
with check (app_private.is_admin(auth.uid()));

drop policy if exists "Alumni can view own photos" on storage.objects;
create policy "Alumni can view own photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'alumni-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Alumni can upload own photos" on storage.objects;
create policy "Alumni can upload own photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'alumni-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Alumni can update own photos" on storage.objects;
create policy "Alumni can update own photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'alumni-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'alumni-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admin can view own admin avatar" on storage.objects;
create policy "Admin can view own admin avatar"
on storage.objects for select
to authenticated
using (
  bucket_id = 'admin-avatars'
  and app_private.is_admin(auth.uid())
);

drop policy if exists "Admin can upload own admin avatar" on storage.objects;
create policy "Admin can upload own admin avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'admin-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and app_private.is_admin(auth.uid())
);

drop policy if exists "Admin can update own admin avatar" on storage.objects;
create policy "Admin can update own admin avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'admin-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and app_private.is_admin(auth.uid())
)
with check (
  bucket_id = 'admin-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and app_private.is_admin(auth.uid())
);

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists alumni_updated_at on public.alumni;
create trigger alumni_updated_at
before update on public.alumni
for each row execute function public.update_updated_at();

drop trigger if exists tracer_study_updated_at on public.tracer_study;
create trigger tracer_study_updated_at
before update on public.tracer_study
for each row execute function public.update_updated_at();

drop trigger if exists questionnaire_questions_updated_at on public.questionnaire_questions;
create trigger questionnaire_questions_updated_at
before update on public.questionnaire_questions
for each row execute function public.update_updated_at();

drop trigger if exists pengaturan_sistem_updated_at on public.pengaturan_sistem;
create trigger pengaturan_sistem_updated_at
before update on public.pengaturan_sistem
for each row execute function public.update_updated_at();

create or replace function app_private.enforce_tracer_study_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.pengaturan_sistem%rowtype;
  v_tahun_lulus integer;
  v_should_check boolean := false;
begin
  if auth.uid() is null or app_private.is_admin(auth.uid()) then
    return new;
  end if;

  if new.is_submitted is true then
    if tg_op = 'INSERT' then
      v_should_check := true;
    elsif tg_op = 'UPDATE' then
      v_should_check := old.is_submitted is distinct from true;
    end if;
  end if;

  if v_should_check then
    select *
    into v_settings
    from public.pengaturan_sistem
    where id = '00000000-0000-0000-0000-000000000001'::uuid;

    if coalesce(v_settings.tracer_study_open, true) = false then
      raise exception 'tracer_study_closed';
    end if;

    select tahun_lulus
    into v_tahun_lulus
    from public.alumni
    where id = new.alumni_id;

    if v_tahun_lulus is not null and (
      v_tahun_lulus < v_settings.periode_tahun_mulai
      or v_tahun_lulus > v_settings.periode_tahun_akhir
    ) then
      raise exception 'tracer_study_period_closed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tracer_study_enforce_settings on public.tracer_study;
create trigger tracer_study_enforce_settings
before insert or update on public.tracer_study
for each row execute function app_private.enforce_tracer_study_settings();

create or replace function app_private.refresh_broadcast_read_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.broadcast_id is not null then
    update public.notification_broadcasts
    set read_count = (
      select count(*)
      from public.notifications
      where broadcast_id = new.broadcast_id
        and is_read = true
    )
    where id = new.broadcast_id;
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_refresh_broadcast_read_count on public.notifications;
create trigger notifications_refresh_broadcast_read_count
after update of is_read on public.notifications
for each row execute function app_private.refresh_broadcast_read_count();

create or replace function public.admin_count_notification_recipients(
  p_target_type text,
  p_prodi text[] default null,
  p_tahun_mulai integer default null,
  p_tahun_akhir integer default null
)
returns integer
language sql
security invoker
set search_path = public
as $$
  select count(*)::integer
  from public.alumni a
  where a.is_admin = false
    and (
      p_target_type <> 'prodi'
      or a.prodi::text = any(coalesce(p_prodi, array[]::text[]))
    )
    and (
      p_target_type <> 'tahun'
      or (
        (p_tahun_mulai is null or a.tahun_lulus >= p_tahun_mulai)
        and (p_tahun_akhir is null or a.tahun_lulus <= p_tahun_akhir)
      )
    )
    and (
      p_target_type <> 'belum_mengisi'
      or not exists (
        select 1
        from public.tracer_study ts
        where ts.alumni_id = a.id
          and ts.is_submitted = true
      )
    );
$$;

revoke all on function public.admin_count_notification_recipients(text, text[], integer, integer) from public, anon, authenticated;
grant execute on function public.admin_count_notification_recipients(text, text[], integer, integer) to service_role;

create or replace function public.admin_broadcast_notifications(
  p_title text,
  p_body text,
  p_target_type text,
  p_prodi text[] default null,
  p_tahun_mulai integer default null,
  p_tahun_akhir integer default null,
  p_created_by uuid default null
)
returns table(broadcast_id uuid, sent integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_broadcast_id uuid := uuid_generate_v4();
  v_target_label text;
  v_sent integer;
  v_latest_created_at timestamptz;
begin
  if p_target_type not in ('all', 'prodi', 'tahun', 'belum_mengisi') then
    raise exception 'invalid_target';
  end if;

  if p_target_type = 'prodi' and coalesce(array_length(p_prodi, 1), 0) = 0 then
    raise exception 'empty_prodi_target';
  end if;

  select nb.created_at
  into v_latest_created_at
  from public.notification_broadcasts nb
  order by nb.created_at desc
  limit 1;

  if v_latest_created_at is not null and now() - v_latest_created_at < interval '1 minute' then
    raise exception 'rate_limit';
  end if;

  v_target_label := case
    when p_target_type = 'prodi' then 'Prodi: ' || array_to_string(p_prodi, ', ')
    when p_target_type = 'tahun' then 'Tahun lulus ' || coalesce(p_tahun_mulai::text, '-') || ' - ' || coalesce(p_tahun_akhir::text, '-')
    when p_target_type = 'belum_mengisi' then 'Belum Mengisi Saja'
    else 'Semua Alumni'
  end;

  select public.admin_count_notification_recipients(
    p_target_type,
    p_prodi,
    p_tahun_mulai,
    p_tahun_akhir
  )
  into v_sent;

  if v_sent = 0 then
    raise exception 'no_recipients';
  end if;

  insert into public.notification_broadcasts (
    id,
    title,
    body,
    target_type,
    target_label,
    total_recipients,
    read_count,
    created_by
  ) values (
    v_broadcast_id,
    p_title,
    p_body,
    p_target_type,
    v_target_label,
    v_sent,
    0,
    p_created_by
  );

  insert into public.notifications (
    alumni_id,
    title,
    body,
    type,
    target_type,
    target_label,
    broadcast_id
  )
  select
    a.id,
    p_title,
    p_body,
    'broadcast',
    p_target_type,
    v_target_label,
    v_broadcast_id
  from public.alumni a
  where a.is_admin = false
    and (
      p_target_type <> 'prodi'
      or a.prodi::text = any(coalesce(p_prodi, array[]::text[]))
    )
    and (
      p_target_type <> 'tahun'
      or (
        (p_tahun_mulai is null or a.tahun_lulus >= p_tahun_mulai)
        and (p_tahun_akhir is null or a.tahun_lulus <= p_tahun_akhir)
      )
    )
    and (
      p_target_type <> 'belum_mengisi'
      or not exists (
        select 1
        from public.tracer_study ts
        where ts.alumni_id = a.id
          and ts.is_submitted = true
      )
    );

  return query select v_broadcast_id, v_sent;
end;
$$;

revoke all on function public.admin_broadcast_notifications(text, text, text, text[], integer, integer, uuid) from public, anon, authenticated;
grant execute on function public.admin_broadcast_notifications(text, text, text, text[], integer, integer, uuid) to service_role;

create or replace function public.admin_delete_notification_broadcast(
  p_broadcast_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.notifications
  where broadcast_id = p_broadcast_id;

  delete from public.notification_broadcasts
  where id = p_broadcast_id;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.admin_delete_notification_broadcast(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_notification_broadcast(uuid) to service_role;

-- Atomic profile creation after Supabase Auth signup.
-- SignUp metadata keys expected from Android student flow:
-- nim contains NPM mahasiswa/alumni. npp is only for staff/admin seed.
create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.alumni (
    id,
    nim,
    npp,
    nama_lengkap,
    prodi,
    tahun_masuk,
    tahun_lulus,
    email
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nim', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'npp', ''),
    coalesce(new.raw_user_meta_data ->> 'nama_lengkap', 'Alumni FT UNIHAZ'),
    coalesce(new.raw_user_meta_data ->> 'prodi', 'Teknik Informatika')::public.prodi_type,
    coalesce((new.raw_user_meta_data ->> 'tahun_masuk')::integer, extract(year from now())::integer - 4),
    coalesce((new.raw_user_meta_data ->> 'tahun_lulus')::integer, extract(year from now())::integer),
    coalesce(new.raw_user_meta_data ->> 'email', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();
