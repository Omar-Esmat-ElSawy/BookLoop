-- Allow admins to manage genres
CREATE POLICY "Admins can insert genres" ON public.book_genres
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update genres" ON public.book_genres
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete genres" ON public.book_genres
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));