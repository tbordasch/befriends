-- ============================================
-- Delete ALL Data - Complete Reset
-- ============================================
-- This script deletes ALL data from ALL tables but keeps the table structure
-- 
-- Tables affected:
-- - activities (all activities)
-- - votes (all votes)
-- - proofs (all proofs)
-- - bet_participants (all participants)
-- - bets (all bets)
-- - friends (all friendships)
-- - friend_requests (all friend requests)
-- - profiles (points reset to 1000, achievements_last_viewed_at reset)
--
-- ⚠️ WARNING: This will permanently delete ALL data!
-- ⚠️ User accounts (auth.users) are NOT deleted - only data is cleared
-- Run this script with caution!

BEGIN;

-- Delete all activities (bet-related, friend-related, achievement-related, etc.)
DELETE FROM public.activities;

-- Delete all votes
DELETE FROM public.votes;

-- Delete all proofs
DELETE FROM public.proofs;

-- Delete all bet participants
DELETE FROM public.bet_participants;

-- Delete all bets
DELETE FROM public.bets;

-- Delete all friends
DELETE FROM public.friends;

-- Delete all friend requests
DELETE FROM public.friend_requests;

-- Reset all user profiles:
-- - Points back to 1000 (default starting amount)
-- - achievements_last_viewed_at to NULL (reset achievement tracking)
UPDATE public.profiles
SET 
  current_points = 1000,
  achievements_last_viewed_at = NULL;

COMMIT;

-- Verification queries (uncomment to check)
-- SELECT COUNT(*) as remaining_activities FROM public.activities;
-- SELECT COUNT(*) as remaining_votes FROM public.votes;
-- SELECT COUNT(*) as remaining_proofs FROM public.proofs;
-- SELECT COUNT(*) as remaining_participants FROM public.bet_participants;
-- SELECT COUNT(*) as remaining_bets FROM public.bets;
-- SELECT COUNT(*) as remaining_friends FROM public.friends;
-- SELECT COUNT(*) as remaining_friend_requests FROM public.friend_requests;
-- SELECT COUNT(*) as profiles_count, SUM(current_points) as total_points FROM public.profiles;

