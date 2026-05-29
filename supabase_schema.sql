-- Create the records table
create table public.records (
  -- Primary Key
  id text primary key,
  
  -- Clerk User ID for Row Level Security
  user_id text not null,
  
  -- Basic Info
  name text not null default '',
  phone text default '',
  date text default '',
  garment text default '',
  
  -- Measurements
  "halfBack" text default '',
  "fullBack" text default '',
  chest text default '',
  stomach text default '',
  sleeves text default '',
  "topLength" text default '',
  arm text default '',
  shoulder text default '',
  waist text default '',
  "downLength" text default '',
  hip text default '',
  bass text default '',
  thigh text default '',
  knee text default '',
  
  -- Financial & Tracking
  charged text default '',
  paid text default '',
  collection text default '',
  "receivedDate" text default '',
  received boolean default false,
  notes text default '',
  
  -- Timestamps
  "updatedAt" text not null,
  "createdAt" text not null
);

-- Enable Row Level Security (RLS)
alter table public.records enable row level security;

-- Create policy to allow users to ONLY see their own records
create policy "Users can view their own records"
  on public.records for select
  using ( auth.jwt()->>'sub' = user_id );

-- Create policy to allow users to ONLY insert their own records
create policy "Users can insert their own records"
  on public.records for insert
  with check ( auth.jwt()->>'sub' = user_id );

-- Create policy to allow users to ONLY update their own records
create policy "Users can update their own records"
  on public.records for update
  using ( auth.jwt()->>'sub' = user_id )
  with check ( auth.jwt()->>'sub' = user_id );

-- Create policy to allow users to ONLY delete their own records
create policy "Users can delete their own records"
  on public.records for delete
  using ( auth.jwt()->>'sub' = user_id );

-- IMPORTANT: Enable Realtime for the records table so the app can listen for changes
alter publication supabase_realtime add table public.records;
