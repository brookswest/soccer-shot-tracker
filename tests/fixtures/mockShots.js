/**
 * Mock Shot Data Fixtures
 * Various datasets for testing different scenarios
 */

// Helper to generate a shot with specified parameters
export function createShot({
    team = 'home',
    type = 'Shot On Target',
    half = '1st Half',
    x = 90,
    y = 34,
    gameTime = '15:30',
    clockSeconds = 930
} = {}) {
    return {
        team,
        teamName: team === 'home' ? 'Home Team' : 'Away Team',
        type,
        half,
        gameTime,
        clockSeconds,
        position: { x, y }
    };
}

// Helper to generate random position in penalty box
export function randomPenaltyBoxPosition() {
    return {
        x: 88 + Math.random() * 16,  // 88-104
        y: 14 + Math.random() * 40   // 14-54
    };
}

// Helper to generate random position outside penalty box
export function randomMidfieldPosition() {
    return {
        x: 52 + Math.random() * 30,  // 52-82
        y: 10 + Math.random() * 48   // 10-58
    };
}

// =====================================================
// EMPTY DATASET (0 shots)
// =====================================================
export const emptyShots = [];

// =====================================================
// SMALL DATASET (5 shots)
// Used for basic functionality tests
// =====================================================
export const smallDataset = [
    createShot({ team: 'home', type: 'GOAL!', half: '1st Half', x: 95, y: 34 }),
    createShot({ team: 'away', type: 'Shot On Target', half: '1st Half', x: 92, y: 28 }),
    createShot({ team: 'home', type: 'Shot Off Target', half: '1st Half', x: 85, y: 45 }),
    createShot({ team: 'away', type: 'GOAL!', half: '2nd Half', x: 98, y: 36 }),
    createShot({ team: 'home', type: 'Shot On Target', half: '2nd Half', x: 91, y: 32 })
];

// =====================================================
// MEDIUM DATASET (15 shots)
// Triggers heat map (requires 10+ shots)
// =====================================================
export const mediumDataset = [
    // 1st Half - Home Team
    createShot({ team: 'home', type: 'GOAL!', half: '1st Half', x: 96, y: 34, gameTime: '05:23' }),
    createShot({ team: 'home', type: 'Shot On Target', half: '1st Half', x: 92, y: 28, gameTime: '12:45' }),
    createShot({ team: 'home', type: 'Shot Off Target', half: '1st Half', x: 85, y: 42, gameTime: '18:10' }),
    createShot({ team: 'home', type: 'Shot On Target', half: '1st Half', x: 90, y: 38, gameTime: '25:30' }),
    createShot({ team: 'home', type: 'GOAL!', half: '1st Half', x: 94, y: 32, gameTime: '38:15' }),

    // 1st Half - Away Team
    createShot({ team: 'away', type: 'Shot On Target', half: '1st Half', x: 88, y: 30, gameTime: '08:55' }),
    createShot({ team: 'away', type: 'Shot Off Target', half: '1st Half', x: 78, y: 35, gameTime: '22:40' }),
    createShot({ team: 'away', type: 'GOAL!', half: '1st Half', x: 97, y: 36, gameTime: '41:20' }),

    // 2nd Half - Home Team
    createShot({ team: 'home', type: 'Shot Off Target', half: '2nd Half', x: 82, y: 25, gameTime: '52:10' }),
    createShot({ team: 'home', type: 'Shot On Target', half: '2nd Half', x: 91, y: 40, gameTime: '65:45' }),
    createShot({ team: 'home', type: 'GOAL!', half: '2nd Half', x: 95, y: 33, gameTime: '78:30' }),

    // 2nd Half - Away Team
    createShot({ team: 'away', type: 'Shot On Target', half: '2nd Half', x: 89, y: 32, gameTime: '55:20' }),
    createShot({ team: 'away', type: 'Shot Off Target', half: '2nd Half', x: 75, y: 45, gameTime: '62:15' }),
    createShot({ team: 'away', type: 'GOAL!', half: '2nd Half', x: 98, y: 35, gameTime: '85:40' }),
    createShot({ team: 'away', type: 'Shot On Target', half: '2nd Half', x: 93, y: 30, gameTime: '88:55' })
];

// =====================================================
// LARGE DATASET (100 shots)
// For performance and stress testing
// =====================================================
export const largeDataset = generateLargeDataset(100);

function generateLargeDataset(count) {
    const shots = [];
    const types = ['GOAL!', 'Shot On Target', 'Shot Off Target'];
    const halves = ['1st Half', '2nd Half'];
    const teams = ['home', 'away'];

    for (let i = 0; i < count; i++) {
        const half = i < count / 2 ? '1st Half' : '2nd Half';
        const baseMinute = half === '1st Half' ? Math.floor(i / (count / 2) * 45) : 45 + Math.floor((i - count / 2) / (count / 2) * 45);

        // Weighted type distribution: 40% goals, 35% saved, 25% miss
        const typeRoll = Math.random();
        const type = typeRoll < 0.4 ? 'GOAL!' : typeRoll < 0.75 ? 'Shot On Target' : 'Shot Off Target';

        // Position biased toward penalty box
        const posRoll = Math.random();
        let position;
        if (posRoll < 0.7) {
            position = randomPenaltyBoxPosition();
        } else {
            position = randomMidfieldPosition();
        }

        shots.push(createShot({
            team: teams[i % 2],
            type,
            half,
            x: position.x,
            y: position.y,
            gameTime: `${String(baseMinute).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            clockSeconds: baseMinute * 60 + Math.floor(Math.random() * 60)
        }));
    }

    return shots;
}

// =====================================================
// HEAT MAP TEST DATASET
// Tightly clustered shots for testing heat map visualization
// =====================================================
export const heatMapTestData = [
    // Cluster 1: Penalty spot area (10 shots)
    ...Array(10).fill(null).map((_, i) => createShot({
        team: 'home',
        type: i < 4 ? 'GOAL!' : i < 7 ? 'Shot On Target' : 'Shot Off Target',
        half: i < 5 ? '1st Half' : '2nd Half',
        x: 93 + (Math.random() - 0.5) * 4,
        y: 34 + (Math.random() - 0.5) * 6
    })),

    // Cluster 2: Top of the box (5 shots)
    ...Array(5).fill(null).map((_, i) => createShot({
        team: 'away',
        type: i < 2 ? 'GOAL!' : i < 4 ? 'Shot On Target' : 'Shot Off Target',
        half: i < 3 ? '1st Half' : '2nd Half',
        x: 88 + (Math.random() - 0.5) * 3,
        y: 22 + (Math.random() - 0.5) * 4
    }))
];

// =====================================================
// SINGLE TEAM DATASETS
// For testing team filtering
// =====================================================
export const homeTeamOnly = Array(12).fill(null).map((_, i) => createShot({
    team: 'home',
    type: i % 3 === 0 ? 'GOAL!' : i % 3 === 1 ? 'Shot On Target' : 'Shot Off Target',
    half: i < 6 ? '1st Half' : '2nd Half',
    x: 88 + Math.random() * 15,
    y: 20 + Math.random() * 28
}));

export const awayTeamOnly = Array(12).fill(null).map((_, i) => createShot({
    team: 'away',
    type: i % 3 === 0 ? 'GOAL!' : i % 3 === 1 ? 'Shot On Target' : 'Shot Off Target',
    half: i < 6 ? '1st Half' : '2nd Half',
    x: 88 + Math.random() * 15,
    y: 20 + Math.random() * 28
}));

// =====================================================
// EDGE CASE DATASETS
// =====================================================

// Shots with invalid data (for error handling tests)
export const invalidShots = [
    { team: 'home', type: 'GOAL!', position: null },  // Missing position
    { team: 'home', type: 'GOAL!', position: { x: 'invalid', y: 34 } },  // Invalid x
    { team: 'home', type: 'GOAL!', position: { x: 90, y: NaN } },  // NaN y
    { team: 'home', type: 'GOAL!', position: { x: -10, y: 34 } },  // Out of bounds x
    { team: 'home', type: 'GOAL!', position: { x: 90, y: 100 } },  // Out of bounds y
    { team: null, type: 'GOAL!', position: { x: 90, y: 34 } },  // Missing team
];

// Shots exactly at boundaries
export const boundaryShots = [
    createShot({ x: 0, y: 0 }),      // Top-left corner
    createShot({ x: 105, y: 0 }),    // Top-right corner
    createShot({ x: 0, y: 68 }),     // Bottom-left corner
    createShot({ x: 105, y: 68 }),   // Bottom-right corner
    createShot({ x: 52.5, y: 34 }),  // Center of field
];

// =====================================================
// GAME DATA FIXTURES
// Complete game objects for integration tests
// =====================================================

export const mockGame = {
    id: 'test-game-123',
    date: '2024-01-15',
    homeTeam: 'Lions FC',
    awayTeam: 'Tigers United',
    homeColor: '#10b981',
    awayColor: '#3b82f6',
    home: {
        goals: 3,
        onTarget: 5,
        offTarget: 2,
        firstHalf: { goals: 2, onTarget: 3, offTarget: 1 },
        secondHalf: { goals: 1, onTarget: 2, offTarget: 1 }
    },
    away: {
        goals: 2,
        onTarget: 4,
        offTarget: 3,
        firstHalf: { goals: 1, onTarget: 2, offTarget: 1 },
        secondHalf: { goals: 1, onTarget: 2, offTarget: 2 }
    },
    log: mediumDataset,
    notes: [
        { timestamp: '15:30', text: 'Yellow card - Player #7' },
        { timestamp: '45:00', text: 'Half time' }
    ],
    finalTime: '90:00',
    finalClockSeconds: 5400
};

export const mockEmptyGame = {
    id: 'empty-game-456',
    date: '2024-01-16',
    homeTeam: 'Home Team',
    awayTeam: 'Away Team',
    homeColor: '#10b981',
    awayColor: '#3b82f6',
    home: {
        goals: 0,
        onTarget: 0,
        offTarget: 0,
        firstHalf: { goals: 0, onTarget: 0, offTarget: 0 },
        secondHalf: { goals: 0, onTarget: 0, offTarget: 0 }
    },
    away: {
        goals: 0,
        onTarget: 0,
        offTarget: 0,
        firstHalf: { goals: 0, onTarget: 0, offTarget: 0 },
        secondHalf: { goals: 0, onTarget: 0, offTarget: 0 }
    },
    log: [],
    notes: [],
    finalTime: '00:00',
    finalClockSeconds: 0
};

// =====================================================
// STATS CALCULATION TEST DATA
// =====================================================

export const statsTestData = {
    // Input: array of shots
    shots: [
        createShot({ team: 'home', type: 'GOAL!', half: '1st Half' }),
        createShot({ team: 'home', type: 'GOAL!', half: '1st Half' }),
        createShot({ team: 'home', type: 'Shot On Target', half: '1st Half' }),
        createShot({ team: 'home', type: 'Shot Off Target', half: '2nd Half' }),
        createShot({ team: 'away', type: 'GOAL!', half: '1st Half' }),
        createShot({ team: 'away', type: 'Shot On Target', half: '2nd Half' }),
        createShot({ team: 'away', type: 'Shot Off Target', half: '2nd Half' }),
    ],
    // Expected stats
    expected: {
        home: {
            goals: 2,
            onTarget: 3,  // 2 goals + 1 on target
            offTarget: 1,
            total: 4
        },
        away: {
            goals: 1,
            onTarget: 2,  // 1 goal + 1 on target
            offTarget: 1,
            total: 3
        }
    }
};
