-- ============================================
-- Fix Activities Cascade Delete
-- ============================================
-- This prevents activities from being deleted when a bet is deleted
-- Instead, related_bet_id will be set to NULL

-- Drop the existing foreign key constraint
ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_related_bet_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL instead of CASCADE
ALTER TABLE public.activities
  ADD CONSTRAINT activities_related_bet_id_fkey
  FOREIGN KEY (related_bet_id)
  REFERENCES public.bets(id)
  ON DELETE SET NULL;

