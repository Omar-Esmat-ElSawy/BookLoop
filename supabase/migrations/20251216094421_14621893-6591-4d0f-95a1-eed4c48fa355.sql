-- Create a function to mark both books as available when exchange is cancelled
CREATE OR REPLACE FUNCTION public.cancel_exchange_and_mark_books_available(
  p_book_id uuid,
  p_offered_book_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the requested book to available
  UPDATE books SET is_available = true WHERE id = p_book_id;
  
  -- Update the offered book to available (if provided)
  IF p_offered_book_id IS NOT NULL THEN
    UPDATE books SET is_available = true WHERE id = p_offered_book_id;
  END IF;
END;
$$;