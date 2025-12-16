-- ============================================
-- CLEAN SLATE - DROP EVERYTHING EXCEPT AUTH
-- ============================================
-- This script drops ALL tables, types, functions, and policies
-- EXCEPT auth.users and auth-related tables
--
-- Run this FIRST, then run MASTER_SETUP.sql
-- ============================================

-- Disable RLS temporarily (we're dropping everything anyway)
ALTER TABLE IF EXISTS public.bets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bet_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.friends DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.friend_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proofs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.votes DISABLE ROW LEVEL SECURITY;

-- Drop all policies (they'll be recreated by MASTER_SETUP.sql)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Drop all tables in public schema (CASCADE will handle dependencies)
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.proofs CASCADE;
DROP TABLE IF EXISTS public.bet_participants CASCADE;
DROP TABLE IF EXISTS public.bets CASCADE;
DROP TABLE IF EXISTS public.friend_requests CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS public.bet_status CASCADE;
DROP TYPE IF EXISTS public.participant_status CASCADE;
DROP TYPE IF EXISTS public.friend_request_status CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.check_bet_creator(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.generate_invite_code() CASCADE;

-- Note: Sequences are automatically dropped when tables are dropped with CASCADE

-- That's it! Now you can run MASTER_SETUP.sql fresh
-- Your auth.users table and all auth data remain untouched

