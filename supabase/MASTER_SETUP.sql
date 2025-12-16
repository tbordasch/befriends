-- ============================================
-- BetFriends - MASTER SETUP SCRIPT
-- Run this ONCE in Supabase SQL Editor
-- This includes everything needed for a complete setup
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in correct order (to avoid foreign key constraints)
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.proofs CASCADE;
DROP TABLE IF EXISTS public.bet_participants CASCADE;
DROP TABLE IF EXISTS public.friend_requests CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.bets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS bet_status CASCADE;
DROP TYPE IF EXISTS participant_status CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.check_bet_creator(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.generate_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.insert_bet_participant_invites(UUID, UUID, UUID[]) CASCADE;
DROP FUNCTION IF EXISTS public.is_user_participant(UUID, UUID) CASCADE;

-- Create custom types
CREATE TYPE bet_status AS ENUM ('open', 'active', 'voting', 'completed');
CREATE TYPE participant_status AS ENUM ('pending', 'accepted', 'declined');

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  current_points INTEGER DEFAULT 1000 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  CONSTRAINT username_format CHECK (
    username IS NULL OR 
    username ~ '^[a-zA-Z0-9_-]{3,20}$'
  )
);

-- Bets table
CREATE TABLE public.bets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stake_amount INTEGER NOT NULL CHECK (stake_amount > 0),
  status bet_status DEFAULT 'open' NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  is_private BOOLEAN DEFAULT false NOT NULL,
  invite_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Bet participants table
CREATE TABLE public.bet_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status participant_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(bet_id, user_id)
);

-- Proofs table
CREATE TABLE public.proofs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(bet_id, user_id)
);

-- Votes table
CREATE TABLE public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  voted_for_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(bet_id, voter_id)
);

-- Friends table
CREATE TABLE public.friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Friend requests table
CREATE TABLE public.friend_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_bets_creator_id ON public.bets(creator_id);
CREATE INDEX idx_bets_status ON public.bets(status);
CREATE INDEX idx_bets_deadline ON public.bets(deadline);
CREATE UNIQUE INDEX idx_bets_invite_code ON public.bets(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX idx_bet_participants_bet_id ON public.bet_participants(bet_id);
CREATE INDEX idx_bet_participants_user_id ON public.bet_participants(user_id);
CREATE INDEX idx_proofs_bet_id ON public.proofs(bet_id);
CREATE INDEX idx_votes_bet_id ON public.votes(bet_id);
CREATE INDEX idx_friends_user_id ON public.friends(user_id);
CREATE INDEX idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_friend_requests_requester_id ON public.friend_requests(requester_id);
CREATE INDEX idx_friend_requests_receiver_id ON public.friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON public.friend_requests(status);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, username, current_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    1000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_bets_updated_at ON public.bets;
CREATE TRIGGER update_bets_updated_at
  BEFORE UPDATE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_bet_participants_updated_at ON public.bet_participants;
CREATE TRIGGER update_bet_participants_updated_at
  BEFORE UPDATE ON public.bet_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON public.friend_requests;
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if user is creator (bypasses RLS for bet_participants INSERT)
CREATE OR REPLACE FUNCTION public.check_bet_creator(bet_id_param UUID, creator_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.bets
    WHERE bets.id = bet_id_param
    AND bets.creator_id = creator_id_param
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_bet_creator(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_bet_creator(UUID, UUID) TO service_role;

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to insert bet participant invites (bypasses RLS)
CREATE OR REPLACE FUNCTION public.insert_bet_participant_invites(
  p_bet_id UUID,
  p_creator_id UUID,
  p_user_ids UUID[]
)
RETURNS TABLE(inserted_id UUID, participant_user_id UUID, participant_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify that p_creator_id is the creator of p_bet_id
  IF NOT EXISTS (
    SELECT 1
    FROM public.bets
    WHERE id = p_bet_id
    AND creator_id = p_creator_id
  ) THEN
    RAISE EXCEPTION 'User is not the creator of this bet';
  END IF;

  -- Insert participant records for each user_id
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    -- Check if participant already exists
    IF NOT EXISTS (
      SELECT 1
      FROM public.bet_participants
      WHERE bet_id = p_bet_id
      AND user_id = v_user_id
    ) THEN
      -- Insert new participant record and return it
      RETURN QUERY
      INSERT INTO public.bet_participants (bet_id, user_id, status)
      VALUES (p_bet_id, v_user_id, 'pending')
      RETURNING id AS inserted_id, user_id AS participant_user_id, status::TEXT AS participant_status;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_bet_participant_invites(UUID, UUID, UUID[]) TO authenticated;

-- Function to atomically deduct points (returns new balance or error)
CREATE OR REPLACE FUNCTION public.atomic_deduct_points(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
BEGIN
  -- Get current points (for check)
  SELECT current_points INTO v_current_points
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_points IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_points < p_amount THEN
    RETURN QUERY SELECT false, v_current_points, 'Not enough points'::TEXT;
    RETURN;
  END IF;

  -- Atomic update
  UPDATE public.profiles
  SET current_points = current_points - p_amount
  WHERE id = p_user_id
  RETURNING current_points INTO v_new_points;

  RETURN QUERY SELECT true, v_new_points, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atomic_deduct_points(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_deduct_points(UUID, INTEGER) TO service_role;

-- Function to atomically add/refund points (returns new balance)
CREATE OR REPLACE FUNCTION public.atomic_add_points(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_points INTEGER;
BEGIN
  -- Atomic update (add points)
  UPDATE public.profiles
  SET current_points = current_points + p_amount
  WHERE id = p_user_id
  RETURNING current_points INTO v_new_points;

  IF v_new_points IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_new_points, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atomic_add_points(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_add_points(UUID, INTEGER) TO service_role;

-- Function to atomically refund points to multiple users
CREATE OR REPLACE FUNCTION public.atomic_refund_points_bulk(
  p_user_ids UUID[],
  p_amount INTEGER
)
RETURNS TABLE(user_id UUID, success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_new_points INTEGER;
BEGIN
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    -- Atomic update for each user
    UPDATE public.profiles
    SET current_points = current_points + p_amount
    WHERE id = v_user_id
    RETURNING current_points INTO v_new_points;

    IF v_new_points IS NULL THEN
      RETURN QUERY SELECT v_user_id, false, 0, 'User not found'::TEXT;
    ELSE
      RETURN QUERY SELECT v_user_id, true, v_new_points, NULL::TEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atomic_refund_points_bulk(UUID[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_refund_points_bulk(UUID[], INTEGER) TO service_role;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Bets are viewable if public or by creator" ON public.bets;
DROP POLICY IF EXISTS "Bets are viewable by participants" ON public.bets;
DROP POLICY IF EXISTS "Users can create bets" ON public.bets;
DROP POLICY IF EXISTS "Users can update their own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can delete their own bets" ON public.bets;

DROP POLICY IF EXISTS "Users can see their own participants" ON public.bet_participants;
DROP POLICY IF EXISTS "Users can create participant records" ON public.bet_participants;
DROP POLICY IF EXISTS "Users can update their own participant status" ON public.bet_participants;

DROP POLICY IF EXISTS "Proofs are viewable by participants" ON public.proofs;
DROP POLICY IF EXISTS "Users can upload their own proof" ON public.proofs;

DROP POLICY IF EXISTS "Votes are viewable by participants" ON public.votes;
DROP POLICY IF EXISTS "Users can cast their own vote" ON public.votes;

DROP POLICY IF EXISTS "Friends are viewable by users" ON public.friends;
DROP POLICY IF EXISTS "Users can create friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete friendships" ON public.friends;

DROP POLICY IF EXISTS "Users can see friend requests they sent or received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can create friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update friend requests they received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete their own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete declined requests they received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete accepted requests they sent" ON public.friend_requests;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- BETS POLICIES
-- ============================================

-- Anyone can see public bets, or bets they created
CREATE POLICY "Bets are viewable if public or by creator"
  ON public.bets FOR SELECT
  USING (
    is_private = false OR
    creator_id = auth.uid()
  );

-- Users can see bets they participate in (including pending)
CREATE POLICY "Bets are viewable by participants"
  ON public.bets FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.bet_participants
      WHERE bet_participants.bet_id = bets.id
      AND bet_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bets"
  ON public.bets FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own bets"
  ON public.bets FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own bets"
  ON public.bets FOR DELETE
  USING (auth.uid() = creator_id);

-- ============================================
-- BET_PARTICIPANTS POLICIES
-- ============================================

-- Users can see participants of bets they participate in (using function to avoid recursion)
-- First create the helper function
CREATE OR REPLACE FUNCTION public.is_user_participant(
  p_bet_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  -- This function bypasses RLS to check if user is a participant
  RETURN EXISTS (
    SELECT 1
    FROM public.bet_participants
    WHERE bet_id = p_bet_id
    AND user_id = p_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_user_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_participant(UUID, UUID) TO anon;

-- Users can see participants of bets they participate in
CREATE POLICY "Users can see participants of bets they participate in"
  ON public.bet_participants FOR SELECT
  USING (
    -- Use function to check if user is participant (bypasses RLS, no recursion)
    public.is_user_participant(bet_id, auth.uid())
  );

-- Users can create participant records (allow creator to invite, or user to join)
CREATE POLICY "Users can create participant records"
  ON public.bet_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    public.check_bet_creator(bet_id, auth.uid())
  );

-- Users can update their own participant status
CREATE POLICY "Users can update their own participant status"
  ON public.bet_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- PROOFS POLICIES
-- ============================================

CREATE POLICY "Proofs are viewable by participants"
  ON public.proofs FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM public.bets
      WHERE bets.id = proofs.bet_id
      AND (bets.creator_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.bet_participants
        WHERE bet_participants.bet_id = bets.id
        AND bet_participants.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can upload their own proof"
  ON public.proofs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VOTES POLICIES
-- ============================================

CREATE POLICY "Votes are viewable by participants"
  ON public.votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.bets
      WHERE bets.id = votes.bet_id
      AND (bets.creator_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.bet_participants
        WHERE bet_participants.bet_id = bets.id
        AND bet_participants.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can cast their own vote"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can update their own votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = voter_id)
  WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = voter_id);

-- ============================================
-- FRIENDS POLICIES
-- ============================================

-- Users can see their own friendships (both directions: as user_id or friend_id)
CREATE POLICY "Friends are viewable by users"
  ON public.friends FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can create friendships (when accepting a friend request)
CREATE POLICY "Users can create friendships"
  ON public.friends FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own friendships (both directions)
CREATE POLICY "Users can delete friendships"
  ON public.friends FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- ============================================
-- FRIEND_REQUESTS POLICIES
-- ============================================

CREATE POLICY "Users can see friend requests they sent or received"
  ON public.friend_requests FOR SELECT
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update friend requests they received"
  ON public.friend_requests FOR UPDATE
  USING (receiver_id = auth.uid());

-- Users can delete requests they sent
CREATE POLICY "Users can delete their own friend requests"
  ON public.friend_requests FOR DELETE
  USING (requester_id = auth.uid());

-- Users can delete declined requests they received
CREATE POLICY "Users can delete declined requests they received"
  ON public.friend_requests FOR DELETE
  USING (receiver_id = auth.uid() AND status = 'declined');

-- Users can delete accepted requests they sent (for cleanup)
CREATE POLICY "Users can delete accepted requests they sent"
  ON public.friend_requests FOR DELETE
  USING (requester_id = auth.uid() AND status = 'accepted');

-- ============================================
-- DONE!
-- ============================================

