-- Drop the existing view
DROP VIEW IF EXISTS public_profiles;

-- Create a security definer function to get public profile data
CREATE OR REPLACE FUNCTION get_public_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, avatar_url, created_at
  FROM users
  WHERE id = user_id;
$$;

-- Create a view that uses the security definer function
-- This view will show all users' public information
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  created_at
FROM users;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_public_profile(uuid) TO anon, authenticated;

-- Set the view to use security definer (bypasses RLS)
ALTER VIEW public_profiles OWNER TO postgres;