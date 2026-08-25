-- ==========================================================
-- LEMAIRE ATELIER SUPABASE SCHEMA & STORAGE CONFIGURATION
-- ==========================================================

-- 1. Create the records table (if not exists)
create table if not exists public.records (
  -- Primary Key
  id text primary key,
  
  -- Clerk User ID for Row Level Security
  user_id text not null,
  
  -- Basic Info
  name text not null default '',
  phone text default '',
  date text default '',
  garment text default '',
  "imageUrl" text default '',
  
  -- Measurements
  "halfBack" text default '',
  "fullBack" text default '',
  chest text default '',
  stomach text default '',
  sleeves text default '',
  "topLength" text default '',
  arm text default '',
  shoulder text default '',
  neck text default '',
  wrist text default '',
  agbada text default '',
  cap text default '',
  waist text default '',
  "downLength" text default '',
  hip text default '',
  bass text default '',
  thigh text default '',
  knee text default '',
  inseam text default '',
  outseam text default '',
  
  -- Financial & Tracking
  charged text default '',
  paid text default '',
  collection text default '',
  "receivedDate" text default '',
  received boolean default false,
  notes text default '',
  
  -- Timestamps
  "updatedAt" text not null default '',
  "createdAt" text not null default ''
);

-- ==========================================================
-- 2. SCHEMA MIGRATION: Ensure ALL columns exist on existing tables
-- ==========================================================
alter table public.records add column if not exists name text not null default '';
alter table public.records add column if not exists phone text default '';
alter table public.records add column if not exists date text default '';
alter table public.records add column if not exists garment text default '';
alter table public.records add column if not exists "imageUrl" text default '';
alter table public.records add column if not exists "halfBack" text default '';
alter table public.records add column if not exists "fullBack" text default '';
alter table public.records add column if not exists chest text default '';
alter table public.records add column if not exists stomach text default '';
alter table public.records add column if not exists sleeves text default '';
alter table public.records add column if not exists "topLength" text default '';
alter table public.records add column if not exists arm text default '';
alter table public.records add column if not exists shoulder text default '';
alter table public.records add column if not exists neck text default '';
alter table public.records add column if not exists wrist text default '';
alter table public.records add column if not exists agbada text default '';
alter table public.records add column if not exists cap text default '';
alter table public.records add column if not exists waist text default '';
alter table public.records add column if not exists "downLength" text default '';
alter table public.records add column if not exists hip text default '';
alter table public.records add column if not exists bass text default '';
alter table public.records add column if not exists thigh text default '';
alter table public.records add column if not exists knee text default '';
alter table public.records add column if not exists inseam text default '';
alter table public.records add column if not exists outseam text default '';
alter table public.records add column if not exists charged text default '';
alter table public.records add column if not exists paid text default '';
alter table public.records add column if not exists collection text default '';
alter table public.records add column if not exists "receivedDate" text default '';
alter table public.records add column if not exists received boolean default false;
alter table public.records add column if not exists notes text default '';
alter table public.records add column if not exists "updatedAt" text default '';
alter table public.records add column if not exists "createdAt" text default '';

-- ==========================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
alter table public.records enable row level security;

drop policy if exists "Users can view their own records" on public.records;
create policy "Users can view their own records"
  on public.records for select
  using ( auth.jwt()->>'sub' = user_id );

drop policy if exists "Users can insert their own records" on public.records;
create policy "Users can insert their own records"
  on public.records for insert
  with check ( auth.jwt()->>'sub' = user_id );

drop policy if exists "Users can update their own records" on public.records;
create policy "Users can update their own records"
  on public.records for update
  using ( auth.jwt()->>'sub' = user_id )
  with check ( auth.jwt()->>'sub' = user_id );

drop policy if exists "Users can delete their own records" on public.records;
create policy "Users can delete their own records"
  on public.records for delete
  using ( auth.jwt()->>'sub' = user_id );

-- ==========================================================
-- 4. REALTIME REPLICATION (Idempotent check)
-- ==========================================================
do $$
begin
  if not exists (
    select 1 
    from pg_publication_tables 
    where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'records'
  ) then
    alter publication supabase_realtime add table public.records;
  end if;
end $$;

-- ==========================================================
-- 5. STORAGE BUCKET CONFIGURATION FOR REFERENCE DESIGNS
-- ==========================================================

-- Create the public storage bucket for garment reference designs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'garment-designs',
  'garment-designs',
  true,
  10485760, -- 10 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
)
on conflict (id) do update set 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];

-- Storage Policy: Users can view/read all designs from public bucket
drop policy if exists "Garment design images are publicly viewable" on storage.objects;
create policy "Garment design images are publicly viewable"
  on storage.objects for select
  using ( bucket_id = 'garment-designs' );

-- Storage Policy: Users can upload to their own user folder (folder name matches user_id)
drop policy if exists "Users can upload their own garment designs" on storage.objects;
create policy "Users can upload their own garment designs"
  on storage.objects for insert
  with check (
    bucket_id = 'garment-designs' 
    and (auth.jwt()->>'sub') = (storage.foldername(name))[1]
  );

-- Storage Policy: Users can update their own garment designs
drop policy if exists "Users can update their own garment designs" on storage.objects;
create policy "Users can update their own garment designs"
  on storage.objects for update
  using (
    bucket_id = 'garment-designs' 
    and (auth.jwt()->>'sub') = (storage.foldername(name))[1]
  );

-- Storage Policy: Users can delete their own garment designs
drop policy if exists "Users can delete their own garment designs" on storage.objects;
create policy "Users can delete their own garment designs"
  on storage.objects for delete
  using (
    bucket_id = 'garment-designs' 
    and (auth.jwt()->>'sub') = (storage.foldername(name))[1]
  );
