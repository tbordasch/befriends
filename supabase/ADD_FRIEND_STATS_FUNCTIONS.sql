-- ============================================
-- Functions to get friend stats (bypasses RLS for viewing friend's bet participation)
-- ============================================

-- Function to get locked points for any user (for friend profiles)
CREATE OR REPLACE FUNCTION public.get_user_locked_points(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_locked_points INTEGER := 0;
BEGIN
  -- Sum up stake amounts from active bets where user is a participant
  SELECT COALESCE(SUM(b.stake_amount), 0)
  INTO v_locked_points
  FROM public.bet_participants bp
  INNER JOIN public.bets b ON bp.bet_id = b.id
  WHERE bp.user_id = p_user_id
    AND bp.status = 'accepted'
    AND b.status IN ('open', 'active', 'voting');

  RETURN v_locked_points;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_locked_points(UUID) TO authenticated;

-- Function to get potential win for any user (for friend profiles)
CREATE OR REPLACE FUNCTION public.get_user_potential_win(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_potential_win INTEGER := 0;
  v_bet_record RECORD;
  v_participant_count INTEGER;
BEGIN
  -- Get all active bets where user is a participant
  FOR v_bet_record IN
    SELECT DISTINCT b.id, b.stake_amount
    FROM public.bet_participants bp
    INNER JOIN public.bets b ON bp.bet_id = b.id
    WHERE bp.user_id = p_user_id
      AND bp.status = 'accepted'
      AND b.status IN ('open', 'active', 'voting')
  LOOP
    -- Count participants for this bet
    SELECT COUNT(*)
    INTO v_participant_count
    FROM public.bet_participants
    WHERE bet_id = v_bet_record.id
      AND status = 'accepted';

    -- Add pot size (stake_amount * participant_count)
    v_potential_win := v_potential_win + (v_bet_record.stake_amount * v_participant_count);
  END LOOP;

  RETURN v_potential_win;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_potential_win(UUID) TO authenticated;

