-- ============================================
-- Fix Join Requests Function - Ensure ONLY public bets with join requests
-- ============================================
-- This ensures that join requests ONLY show for PUBLIC bets where someone
-- requested to join (not for private bets where the creator invited someone)
--
-- IMPORTANT: Private bets should NEVER appear in join requests!
-- ============================================

-- Drop and recreate the function with strict filtering
DROP FUNCTION IF EXISTS public.get_join_requests_for_creator(UUID);

CREATE OR REPLACE FUNCTION public.get_join_requests_for_creator(p_creator_id UUID)
RETURNS TABLE (
  request_id UUID,
  bet_id UUID,
  bet_title TEXT,
  bet_stake INTEGER,
  user_id UUID,
  user_name TEXT,
  user_username TEXT,
  requested_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id AS request_id,
    b.id AS bet_id,
    b.title AS bet_title,
    b.stake_amount AS bet_stake,
    bp.user_id,
    p.name AS user_name,
    p.username AS user_username,
    bp.created_at AS requested_at
  FROM public.bets b
  INNER JOIN public.bet_participants bp ON bp.bet_id = b.id
  INNER JOIN public.profiles p ON p.id = bp.user_id
  WHERE b.creator_id = p_creator_id
    AND b.status = 'open'
    AND b.is_private = false  -- CRITICAL: Only public bets can have join requests
    AND bp.status = 'pending'
    -- Additional safety: Ensure this is not a private bet invitation
    -- (private bets = creator invited, public bets = user requested to join)
  ORDER BY bp.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_join_requests_for_creator(UUID) TO authenticated;


