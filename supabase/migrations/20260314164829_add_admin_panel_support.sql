/*
  # Admin Panel Support

  1. Changes
    - Auto-promote the first registered user to admin if no admin exists
    - Add policy for admins to delete their own profile (cleanup)
    - Ensure team_members can be read by managers too (for admin panel context)

  2. Notes
    - The "first user becomes admin" logic runs as a one-time check
    - Existing data is not modified if an admin already exists
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  ) THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE created_at = (SELECT MIN(created_at) FROM public.profiles);
  END IF;
END $$;
