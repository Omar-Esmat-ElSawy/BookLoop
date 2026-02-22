-- Drop the get_books_with_distance function
DROP FUNCTION IF EXISTS public.get_books_with_distance(NUMERIC, NUMERIC, NUMERIC, UUID);

-- Drop the public_user_profiles view
DROP VIEW IF EXISTS public.public_user_profiles;

-- Recreate the users_select_public_info policy to allow public read access
CREATE POLICY "users_select_public_info" ON public.users
FOR SELECT USING (true);