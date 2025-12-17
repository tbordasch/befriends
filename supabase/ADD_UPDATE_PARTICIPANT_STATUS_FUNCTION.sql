-- ============================================
-- Function to update participant status (bypasses RLS for creator accepting join requests)
-- ============================================

DROP FUNCTION IF EXISTS public.update_bet_participant_status(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.update_bet_participant_status(
  p_request_id UUID,
  p_creator_id UUID,
  p_new_status TEXT
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bet_id UUID;
  v_user_id UUID;
  v_current_status TEXT;
  v_bet_creator_id UUID;
BEGIN
  -- Get the participant record
  SELECT bet_id, user_id, status INTO v_bet_id, v_user_id, v_current_status
  FROM public.bet_participants
  WHERE id = p_request_id;

  IF v_bet_id IS NULL THEN
    RETURN QUERY SELECT false, 'Join request not found'::TEXT;
    RETURN;
  END IF;

  -- Verify status is pending
  IF v_current_status != 'pending' THEN
    RETURN QUERY SELECT false, 'Request is not pending'::TEXT;
    RETURN;
  END IF;

  -- Verify creator owns this bet
  SELECT creator_id INTO v_bet_creator_id
  FROM public.bets
  WHERE id = v_bet_id;

  IF v_bet_creator_id != p_creator_id THEN
    RETURN QUERY SELECT false, 'You are not the creator of this bet'::TEXT;
    RETURN;
  END IF;

  -- Verify new status is valid
  IF p_new_status NOT IN ('accepted', 'declined') THEN
    RETURN QUERY SELECT false, 'Invalid status. Must be accepted or declined.'::TEXT;
    RETURN;
  END IF;

  -- Update the participant status
  UPDATE public.bet_participants
  SET status = p_new_status::participant_status
  WHERE id = p_request_id;

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_bet_participant_status(UUID, UUID, TEXT) TO authenticated;

