-- Drop the overly permissive policy that allows anyone to read all user data
DROP POLICY IF EXISTS users_select_all ON users;

-- Create a policy that only allows users to see their own complete profile
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);