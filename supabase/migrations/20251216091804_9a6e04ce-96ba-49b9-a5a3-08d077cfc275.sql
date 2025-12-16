-- Add RLS policy to allow requester to update exchange requests (for cancel and mark done)
CREATE POLICY "exchange_requests_update_requester" 
ON public.exchange_requests 
FOR UPDATE 
USING (auth.uid() = requester_id);