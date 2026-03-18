-- Storage RLS for "assets" bucket: allow authenticated users to upload/read/update/delete
-- their own profile files at path profile/<user_id>/...
-- Fixes "new row violates row-level security policy" on profile photo upload.

-- Allow insert (upload) to assets bucket only under profile/<own uid>/
create policy "Users can upload own profile assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = 'profile'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow select (read / create signed URL) for own profile folder
create policy "Users can read own profile assets"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = 'profile'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow update (upsert overwrite) for own profile folder
create policy "Users can update own profile assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = 'profile'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = 'profile'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow delete for own profile folder
create policy "Users can delete own profile assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = 'profile'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
