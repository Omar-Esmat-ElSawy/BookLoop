-- Add Arabic name column to book_genres table
ALTER TABLE public.book_genres 
ADD COLUMN IF NOT EXISTS name_ar TEXT;