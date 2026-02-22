-- Add INSERT policy for users table so the signup trigger can create user profiles
CREATE POLICY users_insert_own ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);