drop policy if exists "Admin can delete own admin avatar" on storage.objects;
create policy "Admin can delete own admin avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'admin-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and app_private.is_admin(auth.uid())
);
