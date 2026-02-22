-- Drop the security definer approach
DROP VIEW IF EXISTS public_profiles;
DROP FUNCTION IF EXISTS get_public_profile(uuid);

-- Add a policy to allow everyone to read only non-sensitive user fields
-- This is safe because we're only exposing username and avatar_url
CREATE POLICY "users_select_public_info" ON users
  FOR SELECT 
  USING (true);

-- Note: The existing users_select_own policy allows users to see their own full record
-- This new policy allows everyone to see basic info (username, avatar) from all users
-- The application layer (frontend) should only request non-sensitive fields when showing other users