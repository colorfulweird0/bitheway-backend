-- Bi The Way — storage setup for profile photos
-- Run this AFTER creating a bucket called "photos" in the Supabase dashboard
-- (Storage → New bucket → name it "photos" → toggle "Public bucket" ON)
-- Then run this in the SQL editor to lock down who can upload where.

-- Anyone signed in can view photos (bucket is public, but this covers direct API reads too)
create policy "photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'photos');

-- Users can only upload into a folder matching their own user id, e.g. photos/<user_id>/avatar.jpg
create policy "users can upload their own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can replace/delete their own photos
create policy "users can update their own photos"
  on storage.objects for update
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete their own photos"
  on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
