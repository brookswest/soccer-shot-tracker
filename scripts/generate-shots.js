#!/usr/bin/env node

/**
 * Shot Data Generator for Intent Soccer App
 *
 * Generates realistic soccer shot data and saves it to Supabase.
 *
 * Usage:
 *   npm run generate-shots                           # 20 realistic shots
 *   npm run generate-shots -- --count 100 --clear    # 100 shots, clear existing first
 *   npm run generate-shots -- --scenario heat-test --count 200
 *
 * Options:
 *   --count <number>    Number of shots to generate (default: 20)
 *   --clear             Clear existing games before generating
 *   --scenario <type>   Presets: 'realistic', 'all-goals', 'all-misses', 'heat-test'
 *   --user <id>         Supabase user ID (optional, for testing)
 *   --team <name>       Which team to generate shots for: 'home', 'away', 'both' (default: 'both')
 *   --help              Show this help message
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration (same as in index.html)
const SUPABASE_URL = 'https://dwjwtmvzhxuzhdihmwqp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_k1YD9txQsrT-XsoqW3g1Zw_Wy0frWpq';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Field dimensions (SVG viewBox: 105 x 68)
const FIELD_WIDTH = 105;
const FIELD_HEIGHT = 68;

// Penalty box dimensions (approximate)
const PENALTY_BOX = {
    // Right side (attacking goal at x=105)
    xMin: 88,
    xMax: 105,
    yMin: 13.84,
    yMax: 54.16
};

// Just outside penalty box
const EDGE_BOX = {
    xMin: 75,
    xMax: 88,
    yMin: 10,
    yMax: 58
};

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        count: 20,
        clear: false,
        scenario: 'realistic',
        user: null,
        email: null,
        password: null,
        team: 'both',
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--count':
                options.count = parseInt(args[++i], 10) || 20;
                break;
            case '--clear':
                options.clear = true;
                break;
            case '--scenario':
                options.scenario = args[++i] || 'realistic';
                break;
            case '--user':
                options.user = args[++i];
                break;
            case '--email':
                options.email = args[++i];
                break;
            case '--password':
                options.password = args[++i];
                break;
            case '--team':
                options.team = args[++i] || 'both';
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

// Show help message
function showHelp() {
    console.log(`
Shot Data Generator for Intent Soccer App

Usage:
  npm run generate-shots                              # 20 realistic shots (preview)
  npm run generate-shots -- --count 100 --clear       # 100 shots, clear existing
  npm run generate-shots -- --scenario heat-test --count 200
  npm run generate-shots -- --email user@example.com --password pass123 --count 50

Options:
  --count <number>    Number of shots to generate (default: 20)
  --clear             Clear existing games before generating
  --scenario <type>   Presets: 'realistic', 'all-goals', 'all-misses', 'heat-test'
  --email <email>     Supabase account email (required to save to database)
  --password <pass>   Supabase account password (required to save to database)
  --team <name>       Which team: 'home', 'away', 'both' (default: 'both')
  --help              Show this help message

Scenarios:
  realistic    Normal distribution (40% goals, 35% saved, 25% miss)
  all-goals    All shots are goals (testing)
  all-misses   All shots miss (testing)
  heat-test    Tightly clustered shots for heat map testing

Example:
  npm run generate-shots -- --email your@email.com --password yourpass --count 100 --scenario heat-test
`);
}

// Generate random number in range with optional bias toward center
function randomInRange(min, max, centerBias = 0) {
    if (centerBias > 0) {
        // Use normal-ish distribution for center bias
        const center = (min + max) / 2;
        const range = (max - min) / 2;
        let value = center;
        for (let i = 0; i < 3; i++) {
            value += (Math.random() - 0.5) * range * (1 - centerBias);
        }
        return Math.max(min, Math.min(max, value));
    }
    return min + Math.random() * (max - min);
}

// Generate a shot position based on zone probabilities
function generatePosition(scenario) {
    let x, y;
    const zoneRoll = Math.random();

    if (scenario === 'heat-test') {
        // Tightly clustered shots for heat map testing
        // Create 2-3 hot spots
        const hotSpot = Math.floor(Math.random() * 3);
        switch (hotSpot) {
            case 0: // Penalty spot area
                x = randomInRange(90, 96, 0.7);
                y = randomInRange(28, 40, 0.7);
                break;
            case 1: // Top of the box
                x = randomInRange(85, 92, 0.6);
                y = randomInRange(20, 30, 0.5);
                break;
            case 2: // Bottom of the box
                x = randomInRange(85, 92, 0.6);
                y = randomInRange(38, 48, 0.5);
                break;
        }
    } else {
        // Normal distribution
        if (zoneRoll < 0.70) {
            // 70% in penalty box
            x = randomInRange(PENALTY_BOX.xMin, PENALTY_BOX.xMax - 1, 0.3);
            y = randomInRange(PENALTY_BOX.yMin + 5, PENALTY_BOX.yMax - 5, 0.4);
        } else if (zoneRoll < 0.90) {
            // 20% just outside penalty box
            x = randomInRange(EDGE_BOX.xMin, EDGE_BOX.xMax, 0.2);
            y = randomInRange(EDGE_BOX.yMin, EDGE_BOX.yMax, 0.3);
        } else {
            // 10% from distance
            x = randomInRange(55, 75, 0);
            y = randomInRange(15, 53, 0.2);
        }
    }

    // Add slight random variation to avoid perfect patterns
    x += (Math.random() - 0.5) * 2;
    y += (Math.random() - 0.5) * 2;

    // Clamp to field boundaries
    x = Math.max(0.5, Math.min(104.5, x));
    y = Math.max(0.5, Math.min(67.5, y));

    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

// Determine shot result based on scenario and position
function determineResult(position, scenario) {
    if (scenario === 'all-goals') return 'goal';
    if (scenario === 'all-misses') return 'miss';

    // More goals from central positions closer to goal
    const distanceFromGoal = 105 - position.x;
    const distanceFromCenter = Math.abs(position.y - 34);

    // Base probabilities
    let goalProb = 0.40;
    let savedProb = 0.35;
    // missProb = 0.25 (remainder)

    // Adjust based on position
    if (distanceFromGoal < 10 && distanceFromCenter < 10) {
        // Close and central - more goals
        goalProb = 0.55;
        savedProb = 0.30;
    } else if (distanceFromGoal > 25) {
        // Long distance - fewer goals
        goalProb = 0.20;
        savedProb = 0.35;
    }

    const roll = Math.random();
    if (roll < goalProb) return 'goal';
    if (roll < goalProb + savedProb) return 'saved';
    return 'miss';
}

// Map result to shot type label
function resultToType(result) {
    switch (result) {
        case 'goal': return 'GOAL!';
        case 'saved': return 'Shot On Target';
        case 'miss': return 'Shot Off Target';
        default: return 'Shot Off Target';
    }
}

// Generate a timestamp string (MM:SS format)
function generateTimestamp(half, index, totalInHalf) {
    // Distribute shots throughout the half (0-45 or 45-90)
    const baseMinutes = half === '1st Half' ? 0 : 45;
    const minuteOffset = Math.floor((index / totalInHalf) * 45) + Math.floor(Math.random() * 3);
    const minutes = baseMinutes + minuteOffset;
    const seconds = Math.floor(Math.random() * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Generate all shots
function generateShots(options) {
    const shots = [];
    const stats = {
        home: { goals: 0, onTarget: 0, offTarget: 0, firstHalf: { goals: 0, onTarget: 0, offTarget: 0 }, secondHalf: { goals: 0, onTarget: 0, offTarget: 0 } },
        away: { goals: 0, onTarget: 0, offTarget: 0, firstHalf: { goals: 0, onTarget: 0, offTarget: 0 }, secondHalf: { goals: 0, onTarget: 0, offTarget: 0 } }
    };

    const count = options.count;
    const firstHalfCount = Math.floor(count / 2);
    const secondHalfCount = count - firstHalfCount;

    let firstHalfIndex = 0;
    let secondHalfIndex = 0;

    for (let i = 0; i < count; i++) {
        // Determine half (roughly 50/50)
        const half = i < firstHalfCount ? '1st Half' : '2nd Half';
        const currentIndex = half === '1st Half' ? firstHalfIndex++ : secondHalfIndex++;
        const totalInHalf = half === '1st Half' ? firstHalfCount : secondHalfCount;

        // Determine team
        let team;
        if (options.team === 'home') {
            team = 'home';
        } else if (options.team === 'away') {
            team = 'away';
        } else {
            team = Math.random() < 0.5 ? 'home' : 'away';
        }

        // Generate position and result
        const position = generatePosition(options.scenario);
        const result = determineResult(position, options.scenario);
        const type = resultToType(result);

        // Update stats
        const teamStats = stats[team];
        const halfStats = half === '1st Half' ? teamStats.firstHalf : teamStats.secondHalf;

        if (result === 'goal') {
            teamStats.goals++;
            halfStats.goals++;
            teamStats.onTarget++;
            halfStats.onTarget++;
        } else if (result === 'saved') {
            teamStats.onTarget++;
            halfStats.onTarget++;
        } else {
            teamStats.offTarget++;
            halfStats.offTarget++;
        }

        const timestamp = generateTimestamp(half, currentIndex, totalInHalf);
        const clockSeconds = parseInt(timestamp.split(':')[0]) * 60 + parseInt(timestamp.split(':')[1]);

        shots.push({
            team,
            teamName: team === 'home' ? 'Home Team' : 'Away Team',
            type,
            half,
            gameTime: timestamp,
            clockSeconds,
            position
        });

        // Show progress every 10 shots
        if ((i + 1) % 10 === 0 || i === count - 1) {
            process.stdout.write(`\rGenerating shots... ${i + 1}/${count}`);
        }
    }

    console.log(' Done!');

    return { shots, stats };
}

// Save game to Supabase
async function saveToSupabase(userId, shots, stats, options) {
    const gameData = {
        user_id: userId,
        game_date: new Date().toISOString().split('T')[0],
        home_team: 'Home Team',
        away_team: 'Away Team',
        home_color: '#10b981',
        away_color: '#3b82f6',
        home_stats: stats.home,
        away_stats: stats.away,
        shot_log: shots,
        game_notes: [
            {
                timestamp: new Date().toLocaleTimeString(),
                text: `Generated ${shots.length} test shots using scenario: ${options.scenario}`
            }
        ],
        final_time: '90:00',
        final_clock_seconds: 5400
    };

    console.log('\nSaving to Supabase...');

    const { data, error } = await supabase
        .from('games')
        .insert([gameData])
        .select();

    if (error) {
        throw new Error(`Failed to save game: ${error.message}`);
    }

    return data[0];
}

// Clear existing games for a user
async function clearGames(userId) {
    console.log('Clearing existing games...');

    const { error } = await supabase
        .from('games')
        .delete()
        .eq('user_id', userId);

    if (error) {
        throw new Error(`Failed to clear games: ${error.message}`);
    }

    console.log('Existing games cleared.');
}

// Display summary
function displaySummary(shots, stats) {
    const totalGoals = stats.home.goals + stats.away.goals;
    const totalOnTarget = stats.home.onTarget + stats.away.onTarget;
    const totalOffTarget = stats.home.offTarget + stats.away.offTarget;
    const totalShots = shots.length;

    const firstHalfShots = shots.filter(s => s.half === '1st Half').length;
    const secondHalfShots = shots.filter(s => s.half === '2nd Half').length;

    const homeShots = shots.filter(s => s.team === 'home').length;
    const awayShots = shots.filter(s => s.team === 'away').length;

    console.log(`
\u2713 Generated ${totalShots} shots
  - ${totalGoals} goals (${Math.round(totalGoals / totalShots * 100)}%)
  - ${totalOnTarget - totalGoals} saved (${Math.round((totalOnTarget - totalGoals) / totalShots * 100)}%)
  - ${totalOffTarget} missed (${Math.round(totalOffTarget / totalShots * 100)}%)
  - Coverage: 1st half (${firstHalfShots}), 2nd half (${secondHalfShots})
  - Teams: Home (${homeShots}), Away (${awayShots})

Final Score: Home ${stats.home.goals} - ${stats.away.goals} Away
`);
}

// Authenticate with Supabase
async function authenticate(email, password) {
    console.log('Authenticating with Supabase...');

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw new Error(`Authentication failed: ${error.message}`);
    }

    console.log(`\u2713 Authenticated as ${email}`);
    return data.user;
}

// Main function
async function main() {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        process.exit(0);
    }

    console.log(`
Intent Soccer - Shot Data Generator
====================================
Scenario: ${options.scenario}
Count: ${options.count}
Team: ${options.team}
Clear existing: ${options.clear}
`);

    // Check for credentials
    const hasCredentials = options.email && options.password;

    if (!hasCredentials) {
        console.log(`
Note: No login credentials provided.

To save to Supabase, provide your account credentials:
  npm run generate-shots -- --email your@email.com --password yourpass --count 50

For now, generating shots in preview mode (not saved to database)...
`);
    }

    // Generate shots
    const { shots, stats } = generateShots(options);

    // Display summary
    displaySummary(shots, stats);

    // Save to Supabase if credentials provided
    if (hasCredentials) {
        try {
            // Authenticate first
            const user = await authenticate(options.email, options.password);

            if (options.clear) {
                await clearGames(user.id);
            }

            const savedGame = await saveToSupabase(user.id, shots, stats, options);
            console.log(`\u2713 Game saved with ID: ${savedGame.id}`);

            // Sign out
            await supabase.auth.signOut();
        } catch (err) {
            console.error(`\nError: ${err.message}`);
            process.exit(1);
        }
    } else {
        console.log('Preview mode - no data saved to database.');
        console.log('\nSample shot data:');
        console.log(JSON.stringify(shots.slice(0, 3), null, 2));
    }
}

// Run
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
