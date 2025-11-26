-- Create user_ratings table
CREATE TABLE public.user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  rated_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  UNIQUE(rated_user_id, rater_user_id)
);

-- Enable RLS
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view ratings
CREATE POLICY "user_ratings_select_all" ON public.user_ratings
  FOR SELECT
  USING (true);

-- Only subscribed users can insert ratings (and not rate themselves)
CREATE POLICY "user_ratings_insert_subscribed" ON public.user_ratings
  FOR INSERT
  WITH CHECK (
    auth.uid() = rater_user_id 
    AND rated_user_id != rater_user_id
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND subscription_status = 'active'
    )
  );

-- Users can update their own ratings
CREATE POLICY "user_ratings_update_own" ON public.user_ratings
  FOR UPDATE
  USING (auth.uid() = rater_user_id);

-- Users can delete their own ratings
CREATE POLICY "user_ratings_delete_own" ON public.user_ratings
  FOR DELETE
  USING (auth.uid() = rater_user_id);

-- Create index for faster queries
CREATE INDEX idx_user_ratings_rated_user ON public.user_ratings(rated_user_id);
CREATE INDEX idx_user_ratings_rater_user ON public.user_ratings(rater_user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_ratings_updated_at
  BEFORE UPDATE ON public.user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_ratings_updated_at();