-- Align avatars bucket limits with production (2 MB, image/png/jpeg/webp only).

update storage.buckets
set
  file_size_limit = 2097152,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']::text[]
where id = 'avatars';
