-- Migration: Create players table for roster management
-- Run this in your Supabase SQL Editor

-- Create the players table
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    number INTEGER CHECK (number IS NULL OR (number >= 1 AND number <= 99)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);

-- Create index for sorting by number
CREATE INDEX IF NOT EXISTS idx_players_number ON players(user_id, number);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own players
CREATE POLICY "Users can view their own players"
    ON players
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own players
CREATE POLICY "Users can insert their own players"
    ON players
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own players
CREATE POLICY "Users can update their own players"
    ON players
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own players
CREATE POLICY "Users can delete their own players"
    ON players
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint for number per user (no duplicate numbers for same user)
-- Note: NULL numbers are allowed and don't conflict
ALTER TABLE players
    ADD CONSTRAINT unique_player_number_per_user
    UNIQUE (user_id, number);
