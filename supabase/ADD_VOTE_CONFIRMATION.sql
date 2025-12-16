-- Add confirmed_at column to votes table
-- This tracks when a vote was confirmed (finalized) by the voter

ALTER TABLE public.votes 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_votes_confirmed_at ON public.votes(bet_id, confirmed_at);

