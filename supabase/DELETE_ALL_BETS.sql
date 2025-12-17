-- ============================================
-- Delete All Bets (Keep Users/Profiles)
-- ============================================
-- This script deletes ALL bets and all related data:
-- - bet_participants (CASCADE)
-- - votes (CASCADE)
-- - proofs (CASCADE)
--
-- ✅ User profiles, friends, and friend_requests remain untouched.
-- ✅ Points in profiles.current_points remain unchanged.
-- ✅ After deletion: Locked points = 0 (no bets exist anymore)
--
-- ⚠️  WARNING: This action cannot be undone!
-- ============================================

-- Show current counts BEFORE deletion
SELECT 'BEFORE DELETION' AS status;
SELECT COUNT(*) AS total_bets FROM public.bets;
SELECT COUNT(*) AS total_participants FROM public.bet_participants;
SELECT COUNT(*) AS total_votes FROM public.votes;
SELECT COUNT(*) AS total_proofs FROM public.proofs;

-- Delete all bets (CASCADE will automatically delete related records)
DELETE FROM public.bets;

-- Show counts AFTER deletion
SELECT 'AFTER DELETION' AS status;

-- Verify deletion (should all return 0)
SELECT COUNT(*) AS remaining_bets FROM public.bets;
SELECT COUNT(*) AS remaining_participants FROM public.bet_participants;
SELECT COUNT(*) AS remaining_votes FROM public.votes;
SELECT COUNT(*) AS remaining_proofs FROM public.proofs;

-- Show that profiles and friends are still intact (should be unchanged)
SELECT COUNT(*) AS total_profiles FROM public.profiles;
SELECT COUNT(*) AS total_friends FROM public.friends;
SELECT COUNT(*) AS total_friend_requests FROM public.friend_requests;

-- Show points summary (all points remain, just no locked points anymore)
SELECT 
  COUNT(*) AS total_users,
  SUM(current_points) AS total_points,
  AVG(current_points) AS avg_points
FROM public.profiles;

