-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their support messages" ON public.support_messages;

-- Create a simpler, more reliable SELECT policy for users
CREATE POLICY "Users can view own thread messages"
ON public.support_messages
FOR SELECT
USING (auth.uid() = sender_id);

-- Create a separate SELECT policy for admins
CREATE POLICY "Admins can view all support messages"
ON public.support_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);