-- Create support_messages table for user-admin communication
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  admin_reply BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert their own messages
CREATE POLICY "Users can send support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id AND admin_reply = false);

-- Users can view their own messages and admin replies to them
CREATE POLICY "Users can view their support messages"
ON public.support_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR 
  (admin_reply = true AND EXISTS (
    SELECT 1 FROM support_messages sm 
    WHERE sm.sender_id = auth.uid() 
    AND sm.admin_reply = false
  )) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can insert replies
CREATE POLICY "Admins can reply to support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update support messages"
ON public.support_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can mark their received messages as read
CREATE POLICY "Users can mark messages as read"
ON public.support_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM support_messages sm 
    WHERE sm.sender_id = auth.uid()
  ) AND admin_reply = true
);