create table if not exists public.tracer_study_history (
  id uuid primary key default uuid_generate_v4(),
  source_tracer_study_id uuid references public.tracer_study(id) on delete set null,
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
  is_submitted boolean not null default true,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  recorded_at timestamptz default now()
);

alter table public.tracer_study_history add column if not exists source_tracer_study_id uuid references public.tracer_study(id) on delete set null;
alter table public.tracer_study_history add column if not exists questionnaire_version varchar(40) not null default 'legacy-v1';
alter table public.tracer_study_history add column if not exists answers jsonb not null default '{}'::jsonb;

do $$
begin
  alter table public.tracer_study_history
    add constraint tracer_study_history_answers_object
    check (jsonb_typeof(answers) = 'object');
exception when duplicate_object then null;
end $$;

create index if not exists tracer_study_history_alumni_submitted_idx on public.tracer_study_history(alumni_id, submitted_at desc, recorded_at desc);

alter table public.tracer_study_history enable row level security;

drop policy if exists "Alumni can view own tracer study history" on public.tracer_study_history;
create policy "Alumni can view own tracer study history"
on public.tracer_study_history for select
using (auth.uid() = alumni_id);

drop policy if exists "Admin can view all tracer study history" on public.tracer_study_history;
create policy "Admin can view all tracer study history"
on public.tracer_study_history for select
using (app_private.is_admin(auth.uid()));

grant select on public.tracer_study_history to authenticated;
grant all on public.tracer_study_history to service_role;

create or replace function app_private.append_tracer_study_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_submitted is true and (
    tg_op = 'INSERT'
    or (
      tg_op = 'UPDATE'
      and (
        old.is_submitted is distinct from true
        or old.submitted_at is distinct from new.submitted_at
      )
    )
  ) then
    insert into public.tracer_study_history (
      source_tracer_study_id,
      alumni_id,
      questionnaire_version,
      answers,
      status_kerja,
      nama_perusahaan,
      bidang_pekerjaan,
      jabatan,
      rentang_gaji,
      provinsi_kerja,
      waktu_tunggu,
      kesesuaian_bidang,
      nilai_hard_skill,
      nilai_soft_skill,
      nilai_bahasa_asing,
      nilai_it,
      nilai_kepemimpinan,
      saran_kurikulum,
      kesan_kuliah,
      is_submitted,
      submitted_at
    ) values (
      new.id,
      new.alumni_id,
      new.questionnaire_version,
      new.answers,
      new.status_kerja,
      new.nama_perusahaan,
      new.bidang_pekerjaan,
      new.jabatan,
      new.rentang_gaji,
      new.provinsi_kerja,
      new.waktu_tunggu,
      new.kesesuaian_bidang,
      new.nilai_hard_skill,
      new.nilai_soft_skill,
      new.nilai_bahasa_asing,
      new.nilai_it,
      new.nilai_kepemimpinan,
      new.saran_kurikulum,
      new.kesan_kuliah,
      true,
      new.submitted_at
    );
  end if;

  return new;
end;
$$;

drop trigger if exists tracer_study_append_history on public.tracer_study;
create trigger tracer_study_append_history
after insert or update on public.tracer_study
for each row execute function app_private.append_tracer_study_history();
