-- Fix search_path for existing notification functions
CREATE OR REPLACE FUNCTION public.create_exchange_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, content, is_read, related_id)
  SELECT books.owner_id, 
         'exchange_request', 
         'Someone has requested to exchange your book: ' || books.title, 
         false, 
         books.id::text
  FROM books
  WHERE books.id = NEW.book_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create notification if this is the first unread message in a while
  IF NOT EXISTS (
    SELECT 1
    FROM notifications
    WHERE user_id = NEW.receiver_id
      AND type = 'message'
      AND related_id = NEW.sender_id::text
      AND is_read = false
      AND created_at > NOW() - INTERVAL '15 minutes'
  ) THEN
    INSERT INTO notifications (user_id, type, content, is_read, related_id)
    SELECT NEW.receiver_id,
           'message',
           'New message from ' || users.username,
           false,
           NEW.sender_id::text
    FROM users
    WHERE users.id = NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$;