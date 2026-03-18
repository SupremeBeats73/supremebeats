-- Extend project_assets with file metadata for reference uploads and advanced assets.
-- Run in Supabase SQL Editor or via: supabase db push

alter table public.project_assets
  add column if not exists asset_type text,
  add column if not exists file_url text,
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists mime_type text;

