-- Add offered_book_id column to exchange_requests table
ALTER TABLE exchange_requests 
ADD COLUMN offered_book_id UUID REFERENCES books(id) ON DELETE SET NULL;

-- Update the notification trigger to include offered book info
CREATE OR REPLACE FUNCTION public.create_exchange_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offered_book_title TEXT;
  notification_content TEXT;
BEGIN
  -- Get the offered book title if exists
  IF NEW.offered_book_id IS NOT NULL THEN
    SELECT title INTO offered_book_title FROM books WHERE id = NEW.offered_book_id;
  END IF;

  -- Build notification content
  IF offered_book_title IS NOT NULL THEN
    SELECT 'Someone wants to exchange "' || offered_book_title || '" for your book: ' || books.title
    INTO notification_content
    FROM books WHERE books.id = NEW.book_id;
  ELSE
    SELECT 'Someone has requested to exchange your book: ' || books.title
    INTO notification_content
    FROM books WHERE books.id = NEW.book_id;
  END IF;

  INSERT INTO notifications (user_id, type, content, is_read, related_id)
  SELECT books.owner_id, 
         'exchange_request', 
         notification_content, 
         false, 
         NEW.id::text
  FROM books
  WHERE books.id = NEW.book_id;
  
  RETURN NEW;
END;
$$;