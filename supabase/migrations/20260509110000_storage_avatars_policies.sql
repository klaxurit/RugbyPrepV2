-- WS2 Décision #51 — Storage RLS for the `avatars` bucket
--
-- Path pattern (defined in src/services/auth/authService.ts:197):
--   `{user.id}/{timestamp}.{ext}`
--
-- The first folder segment is therefore the auth user id, which matches the
-- canonical `(storage.foldername(name))[1]` extraction used by Supabase.
--
-- Bucket itself is created via Supabase dashboard (one-shot, no migration
-- needed). This file declares only the RLS policies on storage.objects so
-- they live in the repo and stay in sync with the codebase.

-- Public read so getPublicUrl() works without auth (avatars are intentionally
-- public — they appear on the profile page and may be shown in club/staff UIs).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_public_read'
  ) then
    create policy "avatars_public_read"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;
end $$;

-- Authenticated user can upload only into a folder named after their own uid.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_user_insert_own'
  ) then
    create policy "avatars_user_insert_own"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

-- Same scoping for upserts (authService uses upsert:true on every avatar
-- update so the latest file replaces the previous one in the user's folder).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_user_update_own'
  ) then
    create policy "avatars_user_update_own"
      on storage.objects for update
      to authenticated
      using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      )
      with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

-- Delete only your own avatar files (used by /delete-account cascade and by
-- the user manually replacing their image).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_user_delete_own'
  ) then
    create policy "avatars_user_delete_own"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
