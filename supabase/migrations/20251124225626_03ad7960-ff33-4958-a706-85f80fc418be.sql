-- Create a public profiles view with only non-sensitive fields
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  created_at
FROM users;

-- Allow everyone to read from the public profiles view
GRANT SELECT ON public_profiles TO anon, authenticated;

-- Create RLS policy for the view
ALTER VIEW public_profiles SET (security_invoker = true);