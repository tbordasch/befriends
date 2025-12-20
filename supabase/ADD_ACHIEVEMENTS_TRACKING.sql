-- ============================================
-- Add Achievement Tracking to Profiles
-- ============================================
-- Track when user last viewed their achievements to detect new ones

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS achievements_last_viewed_at TIMESTAMPTZ;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_achievements_last_viewed 
ON public.profiles(achievements_last_viewed_at);


