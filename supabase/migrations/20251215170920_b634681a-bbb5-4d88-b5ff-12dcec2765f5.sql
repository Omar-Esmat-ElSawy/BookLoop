-- Drop the old constraint and add a new one with additional status values
ALTER TABLE public.exchange_requests DROP CONSTRAINT exchange_requests_status_check;

ALTER TABLE public.exchange_requests ADD CONSTRAINT exchange_requests_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'cancelled'::text, 'done'::text]));