/**
 * Roster Validation Tests
 * Tests for validating roster and player data structure
 */

import {
    createRoster,
    createPlayer,
    validRosterNames,
    invalidRosterNames,
    validPlayerNames,
    invalidPlayerNames,
    validPlayerNumbers,
    invalidPlayerNumbers,
    rosterWithDuplicateRisk
} from '../fixtures/mockRosters.js';

describe('Roster Validation', () => {
    // =====================================================
    // VALID ROSTER STRUCTURE
    // =====================================================

    describe('Valid Roster Structure', () => {
        it('should have all required properties', () => {
            const roster = createRoster();

            expect(roster).toHaveProperty('id');
            expect(roster).toHaveProperty('user_id');
            expect(roster).toHaveProperty('name');
            expect(roster).toHaveProperty('color');
            expect(roster).toHaveProperty('created_at');
            expect(roster).toHaveProperty('updated_at');
        });

        it('should create roster with default values', () => {
            const roster = createRoster();

            expect(roster.user_id).toBe('test-user-uuid-12345');
            expect(roster.name).toBe('Test Roster');
            expect(roster.color).toBe('#10b981');
            expect(typeof roster.id).toBe('string');
            expect(roster.id).toBeTruthy();
        });

        it('should create roster with custom values', () => {
            const roster = createRoster({
                id: 'custom-id',
                name: 'Custom Roster',
                color: '#ff0000'
            });

            expect(roster.id).toBe('custom-id');
            expect(roster.name).toBe('Custom Roster');
            expect(roster.color).toBe('#ff0000');
        });

        it('should have valid ISO timestamp for created_at', () => {
            const roster = createRoster();
            const date = new Date(roster.created_at);
            expect(date.toISOString()).toBe(roster.created_at);
        });

        it('should have valid ISO timestamp for updated_at', () => {
            const roster = createRoster();
            const date = new Date(roster.updated_at);
            expect(date.toISOString()).toBe(roster.updated_at);
        });
    });

    // =====================================================
    // ROSTER NAME VALIDATION
    // =====================================================

    describe('Roster Name Validation', () => {
        const isValidRosterName = (name) => {
            if (name === null || name === undefined) return false;
            if (typeof name !== 'string') return false;
            const trimmed = name.trim();
            return trimmed.length > 0;
        };

        it('should accept valid roster names', () => {
            validRosterNames.forEach(name => {
                expect(isValidRosterName(name)).toBe(true);
            });
        });

        it('should reject invalid roster names', () => {
            invalidRosterNames.forEach(name => {
                expect(isValidRosterName(name)).toBe(false);
            });
        });

        it('should accept single character names', () => {
            expect(isValidRosterName('A')).toBe(true);
        });

        it('should accept names with numbers', () => {
            expect(isValidRosterName('U12 Eagles')).toBe(true);
            expect(isValidRosterName('Team 123')).toBe(true);
        });

        it('should accept names with special characters', () => {
            expect(isValidRosterName('Team-Name')).toBe(true);
            expect(isValidRosterName('Team_Name')).toBe(true);
        });

        it('should reject empty string', () => {
            expect(isValidRosterName('')).toBe(false);
        });

        it('should reject whitespace-only string', () => {
            expect(isValidRosterName('   ')).toBe(false);
            expect(isValidRosterName('\t\n')).toBe(false);
        });

        it('should reject null', () => {
            expect(isValidRosterName(null)).toBe(false);
        });

        it('should reject undefined', () => {
            expect(isValidRosterName(undefined)).toBe(false);
        });
    });

    // =====================================================
    // ROSTER COLOR VALIDATION
    // =====================================================

    describe('Roster Color Validation', () => {
        const isValidColor = (color) => {
            if (!color || typeof color !== 'string') return false;
            // Accept hex colors (#RGB, #RRGGBB, or #RRGGBBAA)
            return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
        };

        it('should accept 6-digit hex colors', () => {
            expect(isValidColor('#10b981')).toBe(true);
            expect(isValidColor('#FF0000')).toBe(true);
            expect(isValidColor('#ffffff')).toBe(true);
            expect(isValidColor('#000000')).toBe(true);
        });

        it('should accept 3-digit hex colors', () => {
            expect(isValidColor('#FFF')).toBe(true);
            expect(isValidColor('#000')).toBe(true);
            expect(isValidColor('#f00')).toBe(true);
        });

        it('should accept 8-digit hex colors (with alpha)', () => {
            expect(isValidColor('#10b981FF')).toBe(true);
            expect(isValidColor('#FF000080')).toBe(true);
        });

        it('should reject invalid color formats', () => {
            expect(isValidColor('red')).toBe(false);
            expect(isValidColor('rgb(255,0,0)')).toBe(false);
            expect(isValidColor('#GGG')).toBe(false);
            expect(isValidColor('10b981')).toBe(false);
            expect(isValidColor('#12345')).toBe(false);
        });

        it('should reject null and undefined', () => {
            expect(isValidColor(null)).toBe(false);
            expect(isValidColor(undefined)).toBe(false);
        });
    });
});

describe('Player Validation', () => {
    // =====================================================
    // VALID PLAYER STRUCTURE
    // =====================================================

    describe('Valid Player Structure', () => {
        it('should have all required properties', () => {
            const player = createPlayer();

            expect(player).toHaveProperty('id');
            expect(player).toHaveProperty('user_id');
            expect(player).toHaveProperty('roster_id');
            expect(player).toHaveProperty('name');
            expect(player).toHaveProperty('number');
            expect(player).toHaveProperty('created_at');
            expect(player).toHaveProperty('updated_at');
        });

        it('should create player with default values', () => {
            const player = createPlayer();

            expect(player.user_id).toBe('test-user-uuid-12345');
            expect(player.name).toBe('Test Player');
            expect(player.roster_id).toBeNull();
            expect(player.number).toBeNull();
        });

        it('should create player with custom values', () => {
            const player = createPlayer({
                id: 'custom-player-id',
                name: 'John Smith',
                roster_id: 'roster-001',
                number: 10
            });

            expect(player.id).toBe('custom-player-id');
            expect(player.name).toBe('John Smith');
            expect(player.roster_id).toBe('roster-001');
            expect(player.number).toBe(10);
        });

        it('should allow player without roster assignment', () => {
            const player = createPlayer({ roster_id: null });
            expect(player.roster_id).toBeNull();
        });

        it('should allow player without number assignment', () => {
            const player = createPlayer({ number: null });
            expect(player.number).toBeNull();
        });
    });

    // =====================================================
    // PLAYER NAME VALIDATION
    // =====================================================

    describe('Player Name Validation', () => {
        const isValidPlayerName = (name) => {
            if (name === null || name === undefined) return false;
            if (typeof name !== 'string') return false;
            const trimmed = name.trim();
            return trimmed.length > 0;
        };

        it('should accept valid player names', () => {
            validPlayerNames.forEach(name => {
                expect(isValidPlayerName(name)).toBe(true);
            });
        });

        it('should reject invalid player names', () => {
            invalidPlayerNames.forEach(name => {
                expect(isValidPlayerName(name)).toBe(false);
            });
        });

        it('should accept names with hyphens', () => {
            expect(isValidPlayerName('Jean-Pierre')).toBe(true);
        });

        it('should accept names with apostrophes', () => {
            expect(isValidPlayerName("O'Connor")).toBe(true);
        });

        it('should accept single character names', () => {
            expect(isValidPlayerName('A')).toBe(true);
        });
    });

    // =====================================================
    // PLAYER NUMBER VALIDATION
    // =====================================================

    describe('Player Number Validation', () => {
        const isValidPlayerNumber = (number) => {
            // null is valid (no number assigned)
            if (number === null) return true;
            // Must be a number
            if (typeof number !== 'number') return false;
            // Must not be NaN
            if (isNaN(number)) return false;
            // Must be between 1 and 99
            return number >= 1 && number <= 99;
        };

        it('should accept valid player numbers', () => {
            validPlayerNumbers.forEach(number => {
                expect(isValidPlayerNumber(number)).toBe(true);
            });
        });

        it('should reject invalid player numbers', () => {
            invalidPlayerNumbers.forEach(number => {
                expect(isValidPlayerNumber(number)).toBe(false);
            });
        });

        it('should accept numbers 1-99', () => {
            expect(isValidPlayerNumber(1)).toBe(true);
            expect(isValidPlayerNumber(50)).toBe(true);
            expect(isValidPlayerNumber(99)).toBe(true);
        });

        it('should accept null (no number assigned)', () => {
            expect(isValidPlayerNumber(null)).toBe(true);
        });

        it('should reject 0', () => {
            expect(isValidPlayerNumber(0)).toBe(false);
        });

        it('should reject negative numbers', () => {
            expect(isValidPlayerNumber(-1)).toBe(false);
            expect(isValidPlayerNumber(-10)).toBe(false);
        });

        it('should reject numbers above 99', () => {
            expect(isValidPlayerNumber(100)).toBe(false);
            expect(isValidPlayerNumber(999)).toBe(false);
        });

        it('should reject non-numeric values', () => {
            expect(isValidPlayerNumber('10')).toBe(false);
            expect(isValidPlayerNumber('ten')).toBe(false);
            expect(isValidPlayerNumber(undefined)).toBe(false);
        });

        it('should reject NaN', () => {
            expect(isValidPlayerNumber(NaN)).toBe(false);
        });
    });

    // =====================================================
    // DUPLICATE NUMBER DETECTION
    // =====================================================

    describe('Duplicate Number Detection', () => {
        const hasDuplicateNumber = (players, newNumber, excludePlayerId = null) => {
            if (newNumber === null) return false; // null numbers don't conflict
            return players.some(player =>
                player.number === newNumber && player.id !== excludePlayerId
            );
        };

        const { existingPlayers, duplicateNumber, availableNumber } = rosterWithDuplicateRisk;

        it('should detect duplicate number in roster', () => {
            expect(hasDuplicateNumber(existingPlayers, duplicateNumber)).toBe(true);
        });

        it('should not flag available number', () => {
            expect(hasDuplicateNumber(existingPlayers, availableNumber)).toBe(false);
        });

        it('should not flag null number as duplicate', () => {
            expect(hasDuplicateNumber(existingPlayers, null)).toBe(false);
        });

        it('should exclude player when checking for edit', () => {
            // Player p2 has number 10
            expect(hasDuplicateNumber(existingPlayers, 10, 'p2')).toBe(false);
        });

        it('should still detect duplicate when editing different player', () => {
            // Player p1 has number 7, checking if 10 is duplicate (it is, owned by p2)
            expect(hasDuplicateNumber(existingPlayers, 10, 'p1')).toBe(true);
        });

        it('should handle empty player list', () => {
            expect(hasDuplicateNumber([], 10)).toBe(false);
        });
    });

    // =====================================================
    // PLAYER-ROSTER ASSOCIATION
    // =====================================================

    describe('Player-Roster Association', () => {
        it('should associate player with roster via roster_id', () => {
            const player = createPlayer({
                roster_id: 'roster-001'
            });
            expect(player.roster_id).toBe('roster-001');
        });

        it('should filter players by roster', () => {
            const players = [
                createPlayer({ id: 'p1', roster_id: 'roster-001' }),
                createPlayer({ id: 'p2', roster_id: 'roster-001' }),
                createPlayer({ id: 'p3', roster_id: 'roster-002' }),
                createPlayer({ id: 'p4', roster_id: null })
            ];

            const roster001Players = players.filter(p => p.roster_id === 'roster-001');
            expect(roster001Players).toHaveLength(2);
            expect(roster001Players.map(p => p.id)).toEqual(['p1', 'p2']);
        });

        it('should find orphaned players (no roster)', () => {
            const players = [
                createPlayer({ id: 'p1', roster_id: 'roster-001' }),
                createPlayer({ id: 'p2', roster_id: null }),
                createPlayer({ id: 'p3', roster_id: null })
            ];

            const orphanedPlayers = players.filter(p => p.roster_id === null);
            expect(orphanedPlayers).toHaveLength(2);
        });
    });
});

describe('Data Integrity', () => {
    // =====================================================
    // USER OWNERSHIP
    // =====================================================

    describe('User Ownership', () => {
        it('roster should belong to a user', () => {
            const roster = createRoster({ user_id: 'user-123' });
            expect(roster.user_id).toBe('user-123');
        });

        it('player should belong to a user', () => {
            const player = createPlayer({ user_id: 'user-123' });
            expect(player.user_id).toBe('user-123');
        });

        it('should filter rosters by user', () => {
            const rosters = [
                createRoster({ id: 'r1', user_id: 'user-A' }),
                createRoster({ id: 'r2', user_id: 'user-A' }),
                createRoster({ id: 'r3', user_id: 'user-B' })
            ];

            const userARosters = rosters.filter(r => r.user_id === 'user-A');
            expect(userARosters).toHaveLength(2);
        });
    });

    // =====================================================
    // CASCADING OPERATIONS
    // =====================================================

    describe('Cascading Operations', () => {
        it('should simulate cascading delete of players when roster deleted', () => {
            const rosters = [
                createRoster({ id: 'roster-to-delete' })
            ];
            let players = [
                createPlayer({ id: 'p1', roster_id: 'roster-to-delete' }),
                createPlayer({ id: 'p2', roster_id: 'roster-to-delete' }),
                createPlayer({ id: 'p3', roster_id: 'other-roster' })
            ];

            // Simulate delete roster
            const rosterIdToDelete = 'roster-to-delete';
            const remainingRosters = rosters.filter(r => r.id !== rosterIdToDelete);
            players = players.filter(p => p.roster_id !== rosterIdToDelete);

            expect(remainingRosters).toHaveLength(0);
            expect(players).toHaveLength(1);
            expect(players[0].id).toBe('p3');
        });
    });

    // =====================================================
    // TIMESTAMP HANDLING
    // =====================================================

    describe('Timestamp Handling', () => {
        it('should have created_at timestamp on new roster', () => {
            const roster = createRoster();
            expect(roster.created_at).toBeDefined();
            expect(new Date(roster.created_at).getTime()).not.toBeNaN();
        });

        it('should have updated_at timestamp on new roster', () => {
            const roster = createRoster();
            expect(roster.updated_at).toBeDefined();
            expect(new Date(roster.updated_at).getTime()).not.toBeNaN();
        });

        it('should simulate updating updated_at on edit', () => {
            const originalUpdatedAt = '2024-01-01T00:00:00.000Z';
            const roster = createRoster({ updated_at: originalUpdatedAt });

            // Simulate update
            const newUpdatedAt = new Date().toISOString();
            const updatedRoster = { ...roster, name: 'Updated Name', updated_at: newUpdatedAt };

            expect(updatedRoster.updated_at).not.toBe(originalUpdatedAt);
            expect(new Date(updatedRoster.updated_at).getTime()).toBeGreaterThan(
                new Date(originalUpdatedAt).getTime()
            );
        });
    });
});
