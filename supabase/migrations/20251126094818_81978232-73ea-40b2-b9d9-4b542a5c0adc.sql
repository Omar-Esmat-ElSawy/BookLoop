-- Add phone_number column to users table
ALTER TABLE public.users 
ADD COLUMN phone_number TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.users.phone_number IS 'User phone number for contact purposes';