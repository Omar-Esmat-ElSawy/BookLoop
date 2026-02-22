-- Create a function to mark both books as unavailable when exchange is accepted
CREATE OR REPLACE FUNCTION public.accept_exchange_and_mark_books_unavailable(
  p_request_id uuid,
  p_book_id uuid,
  p_offered_book_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the requested book to unavailable
  UPDATE books SET is_available = false WHERE id = p_book_id;
  
  -- Update the offered book to unavailable (if provided)
  IF p_offered_book_id IS NOT NULL THEN
    UPDATE books SET is_available = false WHERE id = p_offered_book_id;
  END IF;
END;
$$;