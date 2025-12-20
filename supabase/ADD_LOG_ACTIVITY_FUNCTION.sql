-- ============================================
-- Function to log activities (bypasses RLS)
-- ============================================

DROP FUNCTION IF EXISTS public.log_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_message TEXT,
  p_related_bet_id UUID,
  p_related_user_id UUID,
  p_metadata JSONB
);

CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_message TEXT,
  p_related_bet_id UUID DEFAULT NULL,
  p_related_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.activities (
    user_id,
    activity_type,
    related_bet_id,
    related_user_id,
    message,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_related_bet_id,
    p_related_user_id,
    p_message,
    p_metadata,
    TIMEZONE('utc', NOW())
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_activity(UUID, TEXT, TEXT, UUID, UUID, JSONB) TO authenticated;


