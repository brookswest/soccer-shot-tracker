/**
 * Player Management Integration Tests
 * Tests for player CRUD operations, goal attribution, and player stats
 */

import { fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import {
    createRoster,
    createPlayer,
    multipleRosters,
    u12EaglesPlayers,
    u14ThunderPlayers,
    allPlayers,
    playersWithGoals,
    shotsWithPlayers,
    mockGameWithPlayers,
    rosterWithDuplicateRisk
} from '../fixtures/mockRosters.js';
import {
    supabaseClient,
    setMockRosters,
    setMockPlayers,
    setMockUser,
    setMockError,
    resetMocks,
    mockAuthUser
} from '../__mocks__/supabase.js';

// =====================================================
// DOM SETUP HELPERS
// =====================================================

function createPlayerManagementDOM() {
    document.body.innerHTML = `
        <div id="app">
            <!-- Player Selection Modal (for goal attribution) -->
            <div id="player-select-modal-overlay" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Who scored?</h2>
                        <button id="close-player-select-modal">×</button>
                    </div>
                    <div id="player-select-list"></div>
                    <button id="skip-player-select">Unknown / Skip</button>
                </div>
            </div>

            <!-- Shot Log with Player Names -->
            <div id="shot-log">
                <div id="shot-log-entries"></div>
            </div>

            <!-- Player Stats Display -->
            <div id="player-stats">
                <h3>Goal Scorers</h3>
                <div id="goal-scorers-list"></div>
            </div>

            <!-- Roster Players List -->
            <div id="roster-players-modal-overlay" class="modal-overlay hidden">
                <div class="modal">
                    <div id="roster-players-list"></div>
                    <div class="add-player-form">
                        <input type="text" id="new-player-name" placeholder="Player name" />
                        <input type="number" id="new-player-number" placeholder="#" min="1" max="99" />
                        <button id="add-player-btn">Add</button>
                    </div>
                </div>
            </div>

            <!-- Edit Player Modal -->
            <div id="edit-player-modal-overlay" class="modal-overlay hidden">
                <div class="modal">
                    <input type="text" id="edit-player-name" />
                    <input type="number" id="edit-player-number" min="1" max="99" />
                    <button id="save-player-btn">Save</button>
                    <button id="delete-player-btn">Delete</button>
                </div>
            </div>
        </div>
    `;

    return document.getElementById('app');
}

// =====================================================
// STATE MANAGEMENT
// =====================================================

function createPlayerState() {
    return {
        roster: null,
        players: [],
        shots: [],
        playerTrackingEnabled: true,
        rosterTeam: 'home',
        pendingShot: null,
        editingPlayerId: null
    };
}

// =====================================================
// PLAYER CRUD FUNCTIONS
// =====================================================

async function loadPlayers(state, rosterId) {
    const { data, error } = await supabaseClient
        .from('players')
        .select('*')
        .eq('roster_id', rosterId)
        .order('number', { ascending: true, nullsFirst: false });

    if (error) throw error;
    state.players = data || [];
    return state.players;
}

async function addPlayer(state, userId, rosterId, name, number) {
    // Validate name
    if (!name || !name.trim()) {
        throw new Error('Player name is required');
    }

    // Validate number
    if (number !== null && number !== undefined) {
        if (typeof number !== 'number' || isNaN(number)) {
            throw new Error('Invalid player number');
        }
        if (number < 1 || number > 99) {
            throw new Error('Player number must be between 1 and 99');
        }

        // Check for duplicate number in same roster only
        const duplicate = state.players.find(p => p.number === number && p.roster_id === rosterId);
        if (duplicate) {
            throw new Error(`Number ${number} is already taken by ${duplicate.name}`);
        }
    }

    const playerData = {
        user_id: userId,
        roster_id: rosterId,
        name: name.trim(),
        number: number || null
    };

    const { data, error } = await supabaseClient
        .from('players')
        .insert(playerData)
        .select()
        .single();

    if (error) throw error;
    state.players.push(data);
    return data;
}

async function updatePlayer(state, playerId, updates) {
    // Validate number if being updated
    if (updates.number !== undefined && updates.number !== null) {
        if (typeof updates.number !== 'number' || isNaN(updates.number)) {
            throw new Error('Invalid player number');
        }
        if (updates.number < 1 || updates.number > 99) {
            throw new Error('Player number must be between 1 and 99');
        }

        // Check for duplicate (excluding current player)
        const duplicate = state.players.find(p =>
            p.number === updates.number && p.id !== playerId
        );
        if (duplicate) {
            throw new Error(`Number ${updates.number} is already taken by ${duplicate.name}`);
        }
    }

    const { data, error } = await supabaseClient
        .from('players')
        .update(updates)
        .eq('id', playerId);

    if (error) throw error;

    const index = state.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
        state.players[index] = { ...state.players[index], ...updates };
    }

    return state.players[index];
}

async function deletePlayer(state, playerId) {
    const { error } = await supabaseClient
        .from('players')
        .delete()
        .eq('id', playerId);

    if (error) throw error;
    state.players = state.players.filter(p => p.id !== playerId);
    return true;
}

// =====================================================
// GOAL ATTRIBUTION FUNCTIONS
// =====================================================

function createShotWithPlayer(shotData, playerId, playerName) {
    return {
        ...shotData,
        playerId: playerId || null,
        playerName: playerName || null
    };
}

function attributeGoalToPlayer(state, shotIndex, playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (state.shots[shotIndex]) {
        state.shots[shotIndex].playerId = playerId;
        state.shots[shotIndex].playerName = player ? player.name : null;
    }
    return state.shots[shotIndex];
}

function getPlayerGoals(shots, playerId) {
    return shots.filter(shot =>
        shot.type === 'GOAL!' && shot.playerId === playerId
    ).length;
}

function getGoalScorers(shots, players) {
    const scorerMap = new Map();

    shots.forEach(shot => {
        if (shot.type === 'GOAL!' && shot.playerId) {
            const current = scorerMap.get(shot.playerId) || 0;
            scorerMap.set(shot.playerId, current + 1);
        }
    });

    return Array.from(scorerMap.entries())
        .map(([playerId, goals]) => {
            const player = players.find(p => p.id === playerId);
            return {
                playerId,
                playerName: player ? player.name : 'Unknown',
                playerNumber: player ? player.number : null,
                goals
            };
        })
        .sort((a, b) => b.goals - a.goals);
}

// =====================================================
// UI RENDERING FUNCTIONS
// =====================================================

function renderPlayerSelectList(players) {
    const listEl = document.getElementById('player-select-list');
    if (!listEl) return;

    listEl.innerHTML = players.map(player => `
        <button class="player-select-btn" data-id="${player.id}">
            ${player.number ? `#${player.number} ` : ''}${player.name}
        </button>
    `).join('');
}

function renderShotLogWithPlayers(shots) {
    const entriesEl = document.getElementById('shot-log-entries');
    if (!entriesEl) return;

    entriesEl.innerHTML = shots.map((shot, index) => `
        <div class="shot-entry" data-index="${index}">
            <span class="shot-time">${shot.gameTime}</span>
            <span class="shot-team">${shot.teamName}</span>
            <span class="shot-type">${shot.type}</span>
            ${shot.playerName ? `<span class="shot-player">(${shot.playerName})</span>` : ''}
        </div>
    `).join('');
}

function renderGoalScorers(scorers) {
    const listEl = document.getElementById('goal-scorers-list');
    if (!listEl) return;

    if (scorers.length === 0) {
        listEl.innerHTML = '<p class="empty-message">No goals scored yet</p>';
        return;
    }

    listEl.innerHTML = scorers.map(scorer => `
        <div class="scorer-item">
            <span class="scorer-name">
                ${scorer.playerNumber ? `#${scorer.playerNumber} ` : ''}${scorer.playerName}
            </span>
            <span class="scorer-goals">${scorer.goals} ${scorer.goals === 1 ? 'goal' : 'goals'}</span>
        </div>
    `).join('');
}

function renderPlayersList(players) {
    const listEl = document.getElementById('roster-players-list');
    if (!listEl) return;

    if (players.length === 0) {
        listEl.innerHTML = '<p class="empty-message">No players in roster</p>';
        return;
    }

    // Sort by number (nulls last)
    const sorted = [...players].sort((a, b) => {
        if (a.number === null && b.number === null) return 0;
        if (a.number === null) return 1;
        if (b.number === null) return -1;
        return a.number - b.number;
    });

    listEl.innerHTML = sorted.map(player => `
        <div class="player-row" data-id="${player.id}">
            <span class="player-number">${player.number || '-'}</span>
            <span class="player-name">${player.name}</span>
            <button class="edit-player-btn" data-id="${player.id}">Edit</button>
            <button class="delete-player-btn" data-id="${player.id}">×</button>
        </div>
    `).join('');
}

// =====================================================
// TESTS
// =====================================================

describe('Player Management Integration', () => {
    let app;
    let state;

    beforeEach(() => {
        resetMocks();
        app = createPlayerManagementDOM();
        state = createPlayerState();
        setMockUser(mockAuthUser);
    });

    // =====================================================
    // PLAYER LOADING
    // =====================================================

    describe('Player Loading', () => {
        it('should load players for a roster', async () => {
            setMockPlayers([...u12EaglesPlayers]);

            const players = await loadPlayers(state, 'roster-001');

            expect(players).toHaveLength(u12EaglesPlayers.length);
            expect(state.players).toHaveLength(u12EaglesPlayers.length);
        });

        it('should filter players by roster ID', async () => {
            setMockPlayers([...allPlayers]);

            const players = await loadPlayers(state, 'roster-001');

            // Only U12 Eagles players should be returned
            expect(players.every(p => p.roster_id === 'roster-001')).toBe(true);
        });

        it('should handle empty player list', async () => {
            setMockPlayers([]);

            const players = await loadPlayers(state, 'roster-003');

            expect(players).toHaveLength(0);
        });

        it('should order players by number', async () => {
            setMockPlayers([...u12EaglesPlayers]);

            const players = await loadPlayers(state, 'roster-001');
            renderPlayersList(players);

            const numberEls = document.querySelectorAll('.player-number');
            const numbers = Array.from(numberEls).map(el => el.textContent);

            // Players with numbers should come first, sorted
            expect(numbers[0]).toBe('1');
        });
    });

    // =====================================================
    // PLAYER CREATION
    // =====================================================

    describe('Player Creation', () => {
        beforeEach(() => {
            setMockPlayers([]);
            state.players = [];
        });

        it('should create a new player with name and number', async () => {
            const player = await addPlayer(state, mockAuthUser.id, 'roster-001', 'John Smith', 10);

            expect(player.name).toBe('John Smith');
            expect(player.number).toBe(10);
            expect(player.roster_id).toBe('roster-001');
            expect(state.players).toHaveLength(1);
        });

        it('should create a player without number', async () => {
            const player = await addPlayer(state, mockAuthUser.id, 'roster-001', 'Jane Doe', null);

            expect(player.name).toBe('Jane Doe');
            expect(player.number).toBeNull();
        });

        it('should trim whitespace from name', async () => {
            const player = await addPlayer(state, mockAuthUser.id, 'roster-001', '  Spaced Name  ', 5);

            expect(player.name).toBe('Spaced Name');
        });

        it('should reject empty name', async () => {
            await expect(
                addPlayer(state, mockAuthUser.id, 'roster-001', '', 10)
            ).rejects.toThrow('Player name is required');
        });

        it('should reject whitespace-only name', async () => {
            await expect(
                addPlayer(state, mockAuthUser.id, 'roster-001', '   ', 10)
            ).rejects.toThrow('Player name is required');
        });

        it('should reject number less than 1', async () => {
            await expect(
                addPlayer(state, mockAuthUser.id, 'roster-001', 'Test', 0)
            ).rejects.toThrow('Player number must be between 1 and 99');
        });

        it('should reject number greater than 99', async () => {
            await expect(
                addPlayer(state, mockAuthUser.id, 'roster-001', 'Test', 100)
            ).rejects.toThrow('Player number must be between 1 and 99');
        });

        it('should reject duplicate number in roster', async () => {
            state.players = [createPlayer({ id: 'p1', name: 'Existing', number: 10, roster_id: 'roster-001' })];

            await expect(
                addPlayer(state, mockAuthUser.id, 'roster-001', 'New Player', 10)
            ).rejects.toThrow('Number 10 is already taken');
        });

        it('should allow same number in different rosters', async () => {
            state.players = [createPlayer({ id: 'p1', name: 'Other', number: 10, roster_id: 'roster-002' })];

            // This should work since we're adding to roster-001
            const player = await addPlayer(state, mockAuthUser.id, 'roster-001', 'New Player', 10);
            expect(player.number).toBe(10);
        });

        it('should allow multiple players without numbers', async () => {
            await addPlayer(state, mockAuthUser.id, 'roster-001', 'Player A', null);
            const player2 = await addPlayer(state, mockAuthUser.id, 'roster-001', 'Player B', null);

            expect(player2.number).toBeNull();
            expect(state.players).toHaveLength(2);
        });
    });

    // =====================================================
    // PLAYER UPDATE
    // =====================================================

    describe('Player Update', () => {
        beforeEach(() => {
            state.players = [...u12EaglesPlayers];
            setMockPlayers([...u12EaglesPlayers]);
        });

        it('should update player name', async () => {
            const updated = await updatePlayer(state, 'player-001', { name: 'Updated Name' });

            expect(updated.name).toBe('Updated Name');
            expect(state.players.find(p => p.id === 'player-001').name).toBe('Updated Name');
        });

        it('should update player number', async () => {
            // Player 001 has number 1, update to 99
            const updated = await updatePlayer(state, 'player-001', { number: 99 });

            expect(updated.number).toBe(99);
        });

        it('should reject duplicate number on update', async () => {
            // Player 001 has #1, Player 002 has #7
            // Try to change Player 001's number to 7
            await expect(
                updatePlayer(state, 'player-001', { number: 7 })
            ).rejects.toThrow('Number 7 is already taken');
        });

        it('should allow keeping same number on update', async () => {
            // Player 001 has #1, update name while keeping number
            const updated = await updatePlayer(state, 'player-001', { name: 'New Name', number: 1 });

            expect(updated.number).toBe(1);
            expect(updated.name).toBe('New Name');
        });

        it('should allow removing number (set to null)', async () => {
            const updated = await updatePlayer(state, 'player-001', { number: null });

            expect(updated.number).toBeNull();
        });
    });

    // =====================================================
    // PLAYER DELETION
    // =====================================================

    describe('Player Deletion', () => {
        beforeEach(() => {
            state.players = [...u12EaglesPlayers];
            setMockPlayers([...u12EaglesPlayers]);
        });

        it('should delete player from state', async () => {
            const initialCount = state.players.length;

            await deletePlayer(state, 'player-001');

            expect(state.players).toHaveLength(initialCount - 1);
            expect(state.players.find(p => p.id === 'player-001')).toBeUndefined();
        });

        it('should update UI after deletion', async () => {
            renderPlayersList(state.players);
            const initialRows = document.querySelectorAll('.player-row').length;

            await deletePlayer(state, 'player-001');
            renderPlayersList(state.players);

            const newRows = document.querySelectorAll('.player-row').length;
            expect(newRows).toBe(initialRows - 1);
        });
    });

    // =====================================================
    // GOAL ATTRIBUTION
    // =====================================================

    describe('Goal Attribution', () => {
        beforeEach(() => {
            state.players = [...u12EaglesPlayers];
            state.shots = [];
        });

        it('should create shot with player attribution', () => {
            const shotData = {
                team: 'home',
                teamName: 'U12 Eagles',
                type: 'GOAL!',
                half: '1st Half',
                gameTime: '15:30',
                clockSeconds: 930,
                position: { x: 95, y: 34 }
            };

            const shot = createShotWithPlayer(shotData, 'player-003', 'Taylor Brown');

            expect(shot.playerId).toBe('player-003');
            expect(shot.playerName).toBe('Taylor Brown');
        });

        it('should create shot without player (null attribution)', () => {
            const shotData = {
                team: 'home',
                type: 'GOAL!',
                gameTime: '20:00'
            };

            const shot = createShotWithPlayer(shotData, null, null);

            expect(shot.playerId).toBeNull();
            expect(shot.playerName).toBeNull();
        });

        it('should attribute goal to player after the fact', () => {
            state.shots = [{
                team: 'home',
                type: 'GOAL!',
                playerId: null,
                playerName: null
            }];

            const updated = attributeGoalToPlayer(state, 0, 'player-003');

            expect(updated.playerId).toBe('player-003');
            expect(updated.playerName).toBe('Taylor Brown');
        });

        it('should render player name in shot log', () => {
            state.shots = [...shotsWithPlayers];
            renderShotLogWithPlayers(state.shots);

            const playerEls = document.querySelectorAll('.shot-player');
            expect(playerEls.length).toBeGreaterThan(0);
            expect(playerEls[0].textContent).toContain('Taylor Brown');
        });

        it('should not show player name for unattributed shots', () => {
            state.shots = [{
                team: 'home',
                teamName: 'Test',
                type: 'Shot On Target',
                gameTime: '10:00',
                playerId: null,
                playerName: null
            }];
            renderShotLogWithPlayers(state.shots);

            const playerEls = document.querySelectorAll('.shot-player');
            expect(playerEls).toHaveLength(0);
        });
    });

    // =====================================================
    // PLAYER SELECT MODAL
    // =====================================================

    describe('Player Select Modal', () => {
        beforeEach(() => {
            state.players = [...u12EaglesPlayers];
        });

        it('should render player selection buttons', () => {
            renderPlayerSelectList(state.players);

            const buttons = document.querySelectorAll('.player-select-btn');
            expect(buttons).toHaveLength(u12EaglesPlayers.length);
        });

        it('should display player number and name', () => {
            const testPlayers = [createPlayer({ id: 'p1', name: 'Test Player', number: 10 })];
            renderPlayerSelectList(testPlayers);

            const button = document.querySelector('.player-select-btn');
            expect(button.textContent).toContain('#10');
            expect(button.textContent).toContain('Test Player');
        });

        it('should display name only for players without number', () => {
            const testPlayers = [createPlayer({ id: 'p1', name: 'No Number', number: null })];
            renderPlayerSelectList(testPlayers);

            const button = document.querySelector('.player-select-btn');
            expect(button.textContent).not.toContain('#');
            expect(button.textContent).toContain('No Number');
        });

        it('should have data-id attribute for selection', () => {
            renderPlayerSelectList(state.players);

            const button = document.querySelector('.player-select-btn');
            expect(button.dataset.id).toBeDefined();
        });
    });

    // =====================================================
    // GOAL SCORERS STATS
    // =====================================================

    describe('Goal Scorers Stats', () => {
        beforeEach(() => {
            state.players = [...u12EaglesPlayers];
            state.shots = [...shotsWithPlayers];
        });

        it('should count goals per player', () => {
            const taylorGoals = getPlayerGoals(state.shots, 'player-003');
            const caseyGoals = getPlayerGoals(state.shots, 'player-004');

            expect(taylorGoals).toBe(1); // Taylor has 1 goal in mock data
            expect(caseyGoals).toBe(1);  // Casey has 1 goal in mock data
        });

        it('should return 0 for player with no goals', () => {
            const goals = getPlayerGoals(state.shots, 'player-001');
            expect(goals).toBe(0);
        });

        it('should get sorted goal scorers list', () => {
            // Add more goals for testing sorting
            state.shots.push({
                team: 'home',
                type: 'GOAL!',
                playerId: 'player-003',
                playerName: 'Taylor Brown'
            });

            const scorers = getGoalScorers(state.shots, state.players);

            expect(scorers[0].playerName).toBe('Taylor Brown'); // 2 goals
            expect(scorers[0].goals).toBe(2);
        });

        it('should render goal scorers list', () => {
            const scorers = getGoalScorers(state.shots, state.players);
            renderGoalScorers(scorers);

            const scorerItems = document.querySelectorAll('.scorer-item');
            expect(scorerItems.length).toBeGreaterThan(0);
        });

        it('should show empty message when no goals', () => {
            state.shots = [];
            const scorers = getGoalScorers(state.shots, state.players);
            renderGoalScorers(scorers);

            const emptyMessage = document.querySelector('.empty-message');
            expect(emptyMessage).toBeTruthy();
            expect(emptyMessage.textContent).toContain('No goals');
        });

        it('should handle unknown player (deleted after scoring)', () => {
            state.shots = [{
                team: 'home',
                type: 'GOAL!',
                playerId: 'deleted-player-id',
                playerName: 'Deleted Player'
            }];
            state.players = []; // Player no longer exists

            const scorers = getGoalScorers(state.shots, state.players);

            expect(scorers).toHaveLength(1);
            expect(scorers[0].playerName).toBe('Unknown');
        });

        it('should not count non-goal shots', () => {
            state.shots = [
                { type: 'Shot On Target', playerId: 'player-001' },
                { type: 'Shot Off Target', playerId: 'player-001' },
                { type: 'GOAL!', playerId: 'player-001' }
            ];

            const goals = getPlayerGoals(state.shots, 'player-001');
            expect(goals).toBe(1);
        });

        it('should not count goals without player attribution', () => {
            state.shots = [
                { type: 'GOAL!', playerId: null },
                { type: 'GOAL!', playerId: 'player-001' }
            ];

            const scorers = getGoalScorers(state.shots, state.players);

            // Only one entry for player-001
            expect(scorers).toHaveLength(1);
        });
    });

    // =====================================================
    // GAME DATA WITH PLAYERS
    // =====================================================

    describe('Game Data With Players', () => {
        it('should store roster ID with game', () => {
            const game = { ...mockGameWithPlayers };

            expect(game.rosterId).toBe('roster-001');
            expect(game.rosterTeam).toBe('home');
        });

        it('should store player data in shot log', () => {
            const game = { ...mockGameWithPlayers };
            const goalsWithPlayers = game.log.filter(shot =>
                shot.type === 'GOAL!' && shot.playerId
            );

            expect(goalsWithPlayers.length).toBeGreaterThan(0);
            expect(goalsWithPlayers[0].playerId).toBeDefined();
            expect(goalsWithPlayers[0].playerName).toBeDefined();
        });

        it('should serialize game data with player info to JSON', () => {
            const game = { ...mockGameWithPlayers };
            const serialized = JSON.stringify(game);
            const deserialized = JSON.parse(serialized);

            expect(deserialized.log[0].playerId).toBe(game.log[0].playerId);
            expect(deserialized.log[0].playerName).toBe(game.log[0].playerName);
        });

        it('should save game with player data to localStorage', () => {
            const game = { ...mockGameWithPlayers };
            localStorage.setItem('testGame', JSON.stringify(game));

            const restored = JSON.parse(localStorage.getItem('testGame'));
            expect(restored.rosterId).toBe('roster-001');
            expect(restored.log[0].playerName).toBe('Taylor Brown');
        });
    });

    // =====================================================
    // PLAYER TRACKING TOGGLE
    // =====================================================

    describe('Player Tracking Toggle', () => {
        it('should track whether player tracking is enabled', () => {
            state.playerTrackingEnabled = true;
            expect(state.playerTrackingEnabled).toBe(true);

            state.playerTrackingEnabled = false;
            expect(state.playerTrackingEnabled).toBe(false);
        });

        it('should track which team has the roster', () => {
            state.rosterTeam = 'home';
            expect(state.rosterTeam).toBe('home');

            state.rosterTeam = 'away';
            expect(state.rosterTeam).toBe('away');
        });

        it('should only prompt for player on roster team goals', () => {
            state.rosterTeam = 'home';
            state.playerTrackingEnabled = true;

            const homeGoal = { team: 'home', type: 'GOAL!' };
            const awayGoal = { team: 'away', type: 'GOAL!' };

            const shouldPromptHome = state.playerTrackingEnabled && homeGoal.team === state.rosterTeam && homeGoal.type === 'GOAL!';
            const shouldPromptAway = state.playerTrackingEnabled && awayGoal.team === state.rosterTeam && awayGoal.type === 'GOAL!';

            expect(shouldPromptHome).toBe(true);
            expect(shouldPromptAway).toBe(false);
        });

        it('should not prompt when player tracking disabled', () => {
            state.rosterTeam = 'home';
            state.playerTrackingEnabled = false;

            const homeGoal = { team: 'home', type: 'GOAL!' };
            const shouldPrompt = state.playerTrackingEnabled && homeGoal.team === state.rosterTeam;

            expect(shouldPrompt).toBe(false);
        });
    });

    // =====================================================
    // DUPLICATE NUMBER HANDLING
    // =====================================================

    describe('Duplicate Number Handling', () => {
        const { existingPlayers, duplicateNumber, availableNumber } = rosterWithDuplicateRisk;

        beforeEach(() => {
            state.players = [...existingPlayers];
            setMockPlayers([...existingPlayers]);
        });

        it('should detect when number is already taken', () => {
            const isTaken = state.players.some(p => p.number === duplicateNumber);
            expect(isTaken).toBe(true);
        });

        it('should allow available number', async () => {
            const player = await addPlayer(
                state,
                mockAuthUser.id,
                'roster-dup',
                'New Player',
                availableNumber
            );

            expect(player.number).toBe(availableNumber);
        });

        it('should reject duplicate number', async () => {
            await expect(
                addPlayer(state, mockAuthUser.id, 'roster-dup', 'Conflict', duplicateNumber)
            ).rejects.toThrow(`Number ${duplicateNumber} is already taken`);
        });

        it('should find owner of duplicate number', () => {
            const owner = state.players.find(p => p.number === duplicateNumber);
            expect(owner).toBeDefined();
            expect(owner.name).toBe('Player Two');
        });
    });
});
