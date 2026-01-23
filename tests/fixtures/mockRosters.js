/**
 * Mock Roster and Player Data Fixtures
 * Various datasets for testing roster functionality
 */

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create a roster with specified parameters
 */
export function createRoster({
    id = `roster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id = 'test-user-uuid-12345',
    name = 'Test Roster',
    color = '#10b981',
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString()
} = {}) {
    return { id, user_id, name, color, created_at, updated_at };
}

/**
 * Create a player with specified parameters
 */
export function createPlayer({
    id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id = 'test-user-uuid-12345',
    roster_id = null,
    name = 'Test Player',
    number = null,
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString()
} = {}) {
    return { id, user_id, roster_id, name, number, created_at, updated_at };
}

// =====================================================
// EMPTY DATASETS
// =====================================================

export const emptyRosters = [];
export const emptyPlayers = [];

// =====================================================
// SINGLE ROSTER
// =====================================================

export const singleRoster = createRoster({
    id: 'roster-001',
    name: 'U12 Eagles',
    color: '#10b981'
});

// =====================================================
// MULTIPLE ROSTERS
// =====================================================

export const multipleRosters = [
    createRoster({
        id: 'roster-001',
        name: 'U12 Eagles',
        color: '#10b981'
    }),
    createRoster({
        id: 'roster-002',
        name: 'U14 Thunder',
        color: '#3b82f6'
    }),
    createRoster({
        id: 'roster-003',
        name: 'U16 Lightning',
        color: '#f59e0b'
    })
];

// =====================================================
// PLAYERS FOR U12 EAGLES
// =====================================================

export const u12EaglesPlayers = [
    createPlayer({ id: 'player-001', roster_id: 'roster-001', name: 'Alex Johnson', number: 1 }),
    createPlayer({ id: 'player-002', roster_id: 'roster-001', name: 'Jordan Smith', number: 7 }),
    createPlayer({ id: 'player-003', roster_id: 'roster-001', name: 'Taylor Brown', number: 9 }),
    createPlayer({ id: 'player-004', roster_id: 'roster-001', name: 'Casey Davis', number: 10 }),
    createPlayer({ id: 'player-005', roster_id: 'roster-001', name: 'Morgan Wilson', number: 11 }),
    createPlayer({ id: 'player-006', roster_id: 'roster-001', name: 'Riley Martinez', number: 15 }),
    createPlayer({ id: 'player-007', roster_id: 'roster-001', name: 'Jamie Anderson', number: null }), // No number assigned
];

// =====================================================
// PLAYERS FOR U14 THUNDER
// =====================================================

export const u14ThunderPlayers = [
    createPlayer({ id: 'player-101', roster_id: 'roster-002', name: 'Sam Thompson', number: 1 }),
    createPlayer({ id: 'player-102', roster_id: 'roster-002', name: 'Charlie Garcia', number: 5 }),
    createPlayer({ id: 'player-103', roster_id: 'roster-002', name: 'Drew Miller', number: 8 }),
    createPlayer({ id: 'player-104', roster_id: 'roster-002', name: 'Avery White', number: 10 }),
    createPlayer({ id: 'player-105', roster_id: 'roster-002', name: 'Quinn Harris', number: 14 }),
];

// =====================================================
// ALL PLAYERS (Combined)
// =====================================================

export const allPlayers = [...u12EaglesPlayers, ...u14ThunderPlayers];

// =====================================================
// PLAYERS WITH GOALS (For shot log tests)
// =====================================================

export const playersWithGoals = [
    { playerId: 'player-003', playerName: 'Taylor Brown', goals: 3 },
    { playerId: 'player-004', playerName: 'Casey Davis', goals: 2 },
    { playerId: 'player-005', playerName: 'Morgan Wilson', goals: 1 },
];

// =====================================================
// SHOTS WITH PLAYER DATA
// =====================================================

export const shotsWithPlayers = [
    {
        team: 'home',
        teamName: 'U12 Eagles',
        type: 'GOAL!',
        half: '1st Half',
        gameTime: '15:30',
        clockSeconds: 930,
        position: { x: 95, y: 34 },
        playerId: 'player-003',
        playerName: 'Taylor Brown'
    },
    {
        team: 'home',
        teamName: 'U12 Eagles',
        type: 'Shot On Target',
        half: '1st Half',
        gameTime: '22:15',
        clockSeconds: 1335,
        position: { x: 88, y: 40 },
        playerId: null,
        playerName: null
    },
    {
        team: 'home',
        teamName: 'U12 Eagles',
        type: 'GOAL!',
        half: '2nd Half',
        gameTime: '55:00',
        clockSeconds: 3300,
        position: { x: 92, y: 32 },
        playerId: 'player-004',
        playerName: 'Casey Davis'
    },
    {
        team: 'away',
        teamName: 'Opponents FC',
        type: 'GOAL!',
        half: '2nd Half',
        gameTime: '68:30',
        clockSeconds: 4110,
        position: { x: 14, y: 35 },
        playerId: null,
        playerName: null
    }
];

// =====================================================
// MOCK GAME WITH PLAYER DATA
// =====================================================

export const mockGameWithPlayers = {
    id: 'game-with-players-001',
    date: '2024-03-15',
    homeTeam: 'U12 Eagles',
    awayTeam: 'Rivals FC',
    homeColor: '#10b981',
    awayColor: '#ef4444',
    home: {
        goals: 3,
        onTarget: 5,
        offTarget: 2,
        firstHalf: { goals: 2, onTarget: 3, offTarget: 1 },
        secondHalf: { goals: 1, onTarget: 2, offTarget: 1 }
    },
    away: {
        goals: 1,
        onTarget: 3,
        offTarget: 4,
        firstHalf: { goals: 0, onTarget: 1, offTarget: 2 },
        secondHalf: { goals: 1, onTarget: 2, offTarget: 2 }
    },
    log: shotsWithPlayers,
    notes: [],
    finalTime: '90:00',
    finalClockSeconds: 5400,
    rosterId: 'roster-001',
    rosterTeam: 'home'
};

// =====================================================
// VALIDATION TEST DATA
// =====================================================

export const validRosterNames = [
    'U12 Eagles',
    'My Team',
    'A',
    'Team with Numbers 123',
    'Special-Characters_Allowed'
];

export const invalidRosterNames = [
    '',           // Empty
    '   ',        // Only whitespace
    null,         // Null
    undefined,    // Undefined
];

export const validPlayerNames = [
    'John Smith',
    'A',
    'Jean-Pierre',
    "O'Connor",
    'Player 1'
];

export const invalidPlayerNames = [
    '',           // Empty
    '   ',        // Only whitespace
    null,         // Null
    undefined,    // Undefined
];

export const validPlayerNumbers = [
    1,
    10,
    23,
    99,
    null         // No number is valid
];

export const invalidPlayerNumbers = [
    0,           // Too low
    -1,          // Negative
    100,         // Too high
    'ten',       // Not a number
    NaN,         // NaN
];

// =====================================================
// DUPLICATE NUMBER TEST DATA
// =====================================================

export const rosterWithDuplicateRisk = {
    roster: createRoster({ id: 'roster-dup', name: 'Duplicate Test Roster' }),
    existingPlayers: [
        createPlayer({ id: 'p1', roster_id: 'roster-dup', name: 'Player One', number: 7 }),
        createPlayer({ id: 'p2', roster_id: 'roster-dup', name: 'Player Two', number: 10 }),
        createPlayer({ id: 'p3', roster_id: 'roster-dup', name: 'Player Three', number: 15 }),
    ],
    duplicateNumber: 10,
    availableNumber: 8
};

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default {
    createRoster,
    createPlayer,
    emptyRosters,
    emptyPlayers,
    singleRoster,
    multipleRosters,
    u12EaglesPlayers,
    u14ThunderPlayers,
    allPlayers,
    playersWithGoals,
    shotsWithPlayers,
    mockGameWithPlayers,
    validRosterNames,
    invalidRosterNames,
    validPlayerNames,
    invalidPlayerNames,
    validPlayerNumbers,
    invalidPlayerNumbers,
    rosterWithDuplicateRisk
};
