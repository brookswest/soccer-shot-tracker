-- =====================================================
-- SUPABASE DATABASE SETUP FOR SOCCER SHOT TRACKER
-- =====================================================
-- Run this SQL in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor (left sidebar)
-- 4. Paste this entire script and click "Run"
-- =====================================================

-- =====================================================
-- STEP 1: Create the games table
-- =====================================================
-- This table stores all game data for all users.
-- Each row is one saved game, linked to a user via user_id.

CREATE TABLE IF NOT EXISTS games (
    -- Primary key: auto-generated UUID
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign key: links to the authenticated user
    -- References the built-in Supabase auth.users table
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Game metadata
    game_date DATE NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_color TEXT DEFAULT '#10b981',
    away_color TEXT DEFAULT '#3b82f6',

    -- Team statistics stored as JSON
    -- Contains: goals, onTarget, offTarget, firstHalf, secondHalf
    home_stats JSONB NOT NULL,
    away_stats JSONB NOT NULL,

    -- Shot log and notes stored as JSON arrays
    shot_log JSONB DEFAULT '[]'::jsonb,
    game_notes JSONB DEFAULT '[]'::jsonb,

    -- Final game time
    final_time TEXT,
    final_clock_seconds INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Create an index for faster queries by user
-- =====================================================
-- This makes loading a user's games much faster

CREATE INDEX IF NOT EXISTS games_user_id_idx ON games(user_id);
CREATE INDEX IF NOT EXISTS games_created_at_idx ON games(created_at DESC);

-- =====================================================
-- STEP 3: Enable Row Level Security (RLS)
-- =====================================================
-- RLS ensures users can ONLY see and modify their OWN data.
-- This is critical for data privacy and security.

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create RLS Policies
-- =====================================================
-- These policies define WHO can do WHAT with the data.

-- Policy 1: Users can view their own games
-- auth.uid() returns the currently logged-in user's ID
CREATE POLICY "Users can view their own games"
    ON games
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own games
-- The user_id in the inserted row must match the logged-in user
CREATE POLICY "Users can insert their own games"
    ON games
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own games
CREATE POLICY "Users can update their own games"
    ON games
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own games
CREATE POLICY "Users can delete their own games"
    ON games
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: Create a function to auto-update timestamps
-- =====================================================
-- This automatically sets updated_at when a row is modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function on updates
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES (Optional - run these to verify)
-- =====================================================

-- Check that the table was created:
-- SELECT * FROM games LIMIT 1;

-- Check that RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'games';

-- Check the policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'games';

-- =====================================================
-- NOTES ON SUPABASE AUTH SETTINGS
-- =====================================================
--
-- By default, Supabase requires email confirmation for new signups.
-- If you want users to be able to use the app immediately after
-- signing up (without email confirmation), you can disable this:
--
-- 1. Go to Authentication > Providers in your Supabase dashboard
-- 2. Click on Email
-- 3. Toggle OFF "Confirm email"
--
-- For production apps, it's recommended to keep email confirmation ON.
-- =====================================================
