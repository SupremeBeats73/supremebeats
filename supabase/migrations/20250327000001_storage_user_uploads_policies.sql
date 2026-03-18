-- Storage RLS for "user-uploads" bucket: reference audio and other user uploads.
-- Path pattern: <user_id>/<project_id>/...
-- Fixes RLS errors when uploading reference audio on new project / studio.

create policy "Users can upload to own user-uploads folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own user-uploads"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own user-uploads"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own user-uploads"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'user-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
