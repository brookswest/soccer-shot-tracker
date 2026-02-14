-- =====================================================
-- FAN ROLE TABLES MIGRATION
-- Creates tables for fan functionality with real-time game updates
-- =====================================================

-- =====================================================
-- TEAM FANS TABLE
-- Links fans to their single team (one team per fan)
-- =====================================================
CREATE TABLE IF NOT EXISTS team_fans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fan_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure a fan can only be linked to ONE team
    CONSTRAINT unique_fan UNIQUE (fan_id)
);

CREATE INDEX IF NOT EXISTS team_fans_fan_id_idx ON team_fans(fan_id);
CREATE INDEX IF NOT EXISTS team_fans_team_id_idx ON team_fans(team_id);

-- Enable RLS
ALTER TABLE team_fans ENABLE ROW LEVEL SECURITY;

-- Fans can view their own team association
CREATE POLICY "Fans can view own team"
    ON team_fans FOR SELECT
    USING (auth.uid() = fan_id);

-- Coaches can view fans on their teams
CREATE POLICY "Coaches can view team fans"
    ON team_fans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_coaches tc
            WHERE tc.team_id = team_fans.team_id
            AND tc.user_id = auth.uid()
        )
    );

-- Fans can view other fans on their team (for social features)
CREATE POLICY "Fans can view other team fans"
    ON team_fans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_fans tf
            WHERE tf.team_id = team_fans.team_id
            AND tf.fan_id = auth.uid()
        )
    );

-- Allow inserting fans (controlled via application logic)
CREATE POLICY "Allow fan insertion"
    ON team_fans FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- FAN INVITATIONS TABLE
-- Tracks invitation status and tokens
-- =====================================================
CREATE TABLE IF NOT EXISTS fan_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS fan_invitations_token_idx ON fan_invitations(token);
CREATE INDEX IF NOT EXISTS fan_invitations_email_idx ON fan_invitations(email);
CREATE INDEX IF NOT EXISTS fan_invitations_team_id_idx ON fan_invitations(team_id);

-- Enable RLS
ALTER TABLE fan_invitations ENABLE ROW LEVEL SECURITY;

-- Coaches can create invitations for their teams
CREATE POLICY "Coaches can create invitations"
    ON fan_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_coaches tc
            WHERE tc.team_id = fan_invitations.team_id
            AND tc.user_id = auth.uid()
        )
    );

-- Fans can create invitations for their team
CREATE POLICY "Fans can create invitations"
    ON fan_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_fans tf
            WHERE tf.team_id = fan_invitations.team_id
            AND tf.fan_id = auth.uid()
        )
    );

-- Anyone can view invitations (needed for token validation during registration)
CREATE POLICY "Anyone can view invitations"
    ON fan_invitations FOR SELECT
    USING (true);

-- Allow updating invitation status
CREATE POLICY "Allow invitation status update"
    ON fan_invitations FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- ACTIVE GAMES TABLE
-- Real-time game state for fan subscriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS active_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL UNIQUE,
    game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    game_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS active_games_team_id_idx ON active_games(team_id);

-- Enable RLS
ALTER TABLE active_games ENABLE ROW LEVEL SECURITY;

-- Coaches can manage active games for their teams
CREATE POLICY "Coaches can manage active games"
    ON active_games FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM team_coaches tc
            WHERE tc.team_id = active_games.team_id
            AND tc.user_id = auth.uid()
        )
    );

-- Fans can view active games for their team (read-only)
CREATE POLICY "Fans can view active games"
    ON active_games FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_fans tf
            WHERE tf.team_id = active_games.team_id
            AND tf.fan_id = auth.uid()
        )
    );

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_active_games_updated_at ON active_games;
CREATE TRIGGER update_active_games_updated_at
    BEFORE UPDATE ON active_games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Enable Realtime for active_games
-- This allows fans to receive live updates
-- =====================================================
-- Note: Run this in Supabase SQL editor or ensure publication exists
DO $$
BEGIN
    -- Check if the publication exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add active_games to the realtime publication
        ALTER PUBLICATION supabase_realtime ADD TABLE active_games;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Table already in publication, ignore
        NULL;
END $$;

-- =====================================================
-- ADDITIONAL RLS POLICIES FOR EXISTING TABLES
-- Allow fans to view team data
-- =====================================================

-- Fans can view games for their team
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'games'
        AND policyname = 'Fans can view team games'
    ) THEN
        CREATE POLICY "Fans can view team games"
            ON games FOR SELECT
            USING (
                team_id IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM team_fans tf
                    WHERE tf.team_id = games.team_id
                    AND tf.fan_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Fans can view team roster
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'rosters'
        AND policyname = 'Fans can view team roster'
    ) THEN
        CREATE POLICY "Fans can view team roster"
            ON rosters FOR SELECT
            USING (
                team_id IS NOT NULL AND
                EXISTS (
                    SELECT 1 FROM team_fans tf
                    WHERE tf.team_id = rosters.team_id
                    AND tf.fan_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Fans can view players on team roster
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'players'
        AND policyname = 'Fans can view team players'
    ) THEN
        CREATE POLICY "Fans can view team players"
            ON players FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM rosters r
                    JOIN team_fans tf ON tf.team_id = r.team_id
                    WHERE r.id = players.roster_id
                    AND tf.fan_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Fans can view team info
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'teams'
        AND policyname = 'Fans can view team info'
    ) THEN
        CREATE POLICY "Fans can view team info"
            ON teams FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM team_fans tf
                    WHERE tf.team_id = teams.id
                    AND tf.fan_id = auth.uid()
                )
            );
    END IF;
END $$;
