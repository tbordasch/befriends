-- ============================================
-- Fix Bet Participants Visibility for Public Bets
-- ============================================
-- This allows non-participants to see participants of public bets
-- so they can see participant count and pot size before joining
--
-- Only shows "accepted" participants (not pending/declined)
-- Uses a SECURITY DEFINER function to avoid recursion

-- Create or replace a function to check if a bet is public (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_bet_public(p_bet_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  -- This function bypasses RLS to check if bet is public
  RETURN EXISTS (
    SELECT 1
    FROM public.bets
    WHERE bets.id = p_bet_id
    AND bets.is_private = false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_bet_public(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bet_public(UUID) TO anon;

-- Drop the policy if it exists (in case it was created before)
DROP POLICY IF EXISTS "Anyone can see accepted participants of public bets" ON public.bet_participants;

-- Add a new policy that allows viewing accepted participants of public bets
CREATE POLICY "Anyone can see accepted participants of public bets"
  ON public.bet_participants FOR SELECT
  USING (
    status = 'accepted' AND
    public.is_bet_public(bet_id)
  );

