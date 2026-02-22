
-- Create tables

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT
);

-- Book Genres table
CREATE TABLE book_genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  genre TEXT REFERENCES book_genres(name),
  condition TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE
);

-- Exchange Requests table
CREATE TABLE exchange_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id TEXT
);

-- Insert some default book genres
INSERT INTO book_genres (name) VALUES
  ('Fiction'),
  ('Non-Fiction'),
  ('Mystery'),
  ('Science Fiction'),
  ('Fantasy'),
  ('Romance'),
  ('Thriller'),
  ('Horror'),
  ('Biography'),
  ('History'),
  ('Self-Help'),
  ('Poetry'),
  ('Children'),
  ('Young Adult'),
  ('Business'),
  ('Travel'),
  ('Cookbooks'),
  ('Art'),
  ('Religion'),
  ('Philosophy'),
  ('Manga/Comics'),
  ('Other');

-- Create indexes for better performance
CREATE INDEX idx_books_owner_id ON books(owner_id);
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_exchange_requests_book_id ON exchange_requests(book_id);
CREATE INDEX idx_exchange_requests_requester_id ON exchange_requests(requester_id);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_genres ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Users policies
CREATE POLICY users_select_all ON users
  FOR SELECT USING (true);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Books policies
CREATE POLICY books_select_all ON books
  FOR SELECT USING (true);

CREATE POLICY books_insert_own ON books
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY books_update_own ON books
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY books_delete_own ON books
  FOR DELETE USING (auth.uid() = owner_id);

-- Exchange Requests policies
CREATE POLICY exchange_requests_select_own ON exchange_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR 
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = exchange_requests.book_id AND books.owner_id = auth.uid()
    )
  );

CREATE POLICY exchange_requests_insert_own ON exchange_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY exchange_requests_update_owner ON exchange_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = exchange_requests.book_id AND books.owner_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY messages_select_own ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY messages_insert_own ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY messages_update_received ON messages
  FOR UPDATE USING (
    auth.uid() = receiver_id AND 
    OLD.is_read = false
  );

-- Notifications policies
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Book Genres policies
CREATE POLICY book_genres_select_all ON book_genres
  FOR SELECT USING (true);

-- Create a trigger function to create a notification when an exchange request is made
CREATE OR REPLACE FUNCTION create_exchange_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, content, is_read, related_id)
  SELECT books.owner_id, 
         'exchange_request', 
         'Someone has requested to exchange your book: ' || books.title, 
         false, 
         books.id
  FROM books
  WHERE books.id = NEW.book_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to fire the function when an exchange request is inserted
CREATE TRIGGER on_exchange_request_created
AFTER INSERT ON exchange_requests
FOR EACH ROW
EXECUTE FUNCTION create_exchange_request_notification();

-- Create a trigger function to create a notification when a message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create a trigger to fire the function when a message is inserted
CREATE TRIGGER on_message_created
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();
