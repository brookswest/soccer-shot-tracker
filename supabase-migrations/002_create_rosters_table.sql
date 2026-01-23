-- Migration: Create rosters table and update players table
-- Run this in your Supabase SQL Editor AFTER 001_create_players_table.sql

-- Create the rosters table
CREATE TABLE IF NOT EXISTS rosters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#10b981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_rosters_user_id ON rosters(user_id);

-- Enable Row Level Security
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own rosters
CREATE POLICY "Users can view their own rosters"
    ON rosters
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own rosters
CREATE POLICY "Users can insert their own rosters"
    ON rosters
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own rosters
CREATE POLICY "Users can update their own rosters"
    ON rosters
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own rosters
CREATE POLICY "Users can delete their own rosters"
    ON rosters
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_rosters_updated_at ON rosters;
CREATE TRIGGER update_rosters_updated_at
    BEFORE UPDATE ON rosters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add roster_id column to players table
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE;

-- Create index for faster queries by roster
CREATE INDEX IF NOT EXISTS idx_players_roster_id ON players(roster_id);

-- Note: If you have existing players without a roster_id, you may want to:
-- 1. Create a default roster for each user
-- 2. Migrate existing players to that default roster
-- Or simply leave roster_id as NULL for legacy players

