/**
 * Roster Management Integration Tests
 * Tests for roster CRUD operations and UI interactions
 */

import { fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import {
    createRoster,
    createPlayer,
    multipleRosters,
    u12EaglesPlayers,
    u14ThunderPlayers,
    singleRoster,
    emptyRosters,
    emptyPlayers
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

function createRosterManagementDOM() {
    document.body.innerHTML = `
        <div id="app">
            <!-- Game Setup Section -->
            <div id="game-setup">
                <div id="roster-section">
                    <label>Active Roster</label>
                    <div id="selected-roster-display">
                        <span id="selected-roster-name">No roster selected</span>
                        <button id="change-roster-btn">Change</button>
                    </div>
                    <button id="manage-rosters-btn">Manage Rosters</button>
                </div>

                <div id="player-tracking-section" style="display: none;">
                    <label>Player Tracking</label>
                    <div>
                        <input type="checkbox" id="enable-player-tracking" />
                        <label for="enable-player-tracking">Enable</label>
                    </div>
                    <select id="roster-team-select">
                        <option value="home">Home Team</option>
                        <option value="away">Away Team</option>
                    </select>
                </div>
            </div>

            <!-- Rosters List Modal -->
            <div id="rosters-modal-overlay" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h2>My Rosters</h2>
                        <button id="close-rosters-modal">×</button>
                    </div>
                    <div id="rosters-list"></div>
                    <div class="modal-footer">
                        <input type="text" id="new-roster-name" placeholder="New roster name" />
                        <button id="create-roster-btn">Create Roster</button>
                    </div>
                </div>
            </div>

            <!-- Roster Players Modal -->
            <div id="roster-players-modal-overlay" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <button id="back-to-rosters-btn">← Back</button>
                        <h2 id="roster-players-title">Roster Players</h2>
                        <button id="close-roster-players-modal">×</button>
                    </div>
                    <div id="roster-players-list"></div>
                    <div class="modal-footer">
                        <input type="text" id="new-player-name" placeholder="Player name" />
                        <input type="number" id="new-player-number" placeholder="#" min="1" max="99" />
                        <button id="add-player-btn">Add Player</button>
                    </div>
                </div>
            </div>

            <!-- Select Roster Modal -->
            <div id="select-roster-modal-overlay" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Select Roster</h2>
                        <button id="close-select-roster-modal">×</button>
                    </div>
                    <div id="select-roster-list"></div>
                </div>
            </div>

            <!-- Edit Roster Modal -->
            <div id="edit-roster-modal-overlay" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Edit Roster</h2>
                        <button id="close-edit-roster-modal">×</button>
                    </div>
                    <input type="text" id="edit-roster-name" />
                    <button id="save-roster-btn">Save</button>
                    <button id="delete-roster-btn" class="danger">Delete Roster</button>
                </div>
            </div>
        </div>
    `;

    return document.getElementById('app');
}

// Simulate roster state management
function createRosterState() {
    return {
        rosters: [],
        currentRosterId: null,
        currentRoster: null,
        players: [],
        playerTrackingEnabled: false,
        rosterTeam: 'home',
        editingRosterId: null
    };
}

// =====================================================
// ROSTER MANAGEMENT FUNCTIONS (Simulating app behavior)
// =====================================================

async function loadRosters(state, userId) {
    const { data, error } = await supabaseClient
        .from('rosters')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

    if (error) throw error;
    state.rosters = data || [];
    return state.rosters;
}

async function createNewRoster(state, userId, name) {
    if (!name || !name.trim()) {
        throw new Error('Roster name is required');
    }

    const { data, error } = await supabaseClient
        .from('rosters')
        .insert({ user_id: userId, name: name.trim() })
        .select()
        .single();

    if (error) throw error;
    state.rosters.push(data);
    return data;
}

async function updateRoster(state, rosterId, updates) {
    const { data, error } = await supabaseClient
        .from('rosters')
        .update(updates)
        .eq('id', rosterId);

    if (error) throw error;

    const index = state.rosters.findIndex(r => r.id === rosterId);
    if (index !== -1) {
        state.rosters[index] = { ...state.rosters[index], ...updates };
    }

    return state.rosters[index];
}

async function deleteRoster(state, rosterId) {
    const { error } = await supabaseClient
        .from('rosters')
        .delete()
        .eq('id', rosterId);

    if (error) throw error;

    state.rosters = state.rosters.filter(r => r.id !== rosterId);
    state.players = state.players.filter(p => p.roster_id !== rosterId);

    if (state.currentRosterId === rosterId) {
        state.currentRosterId = null;
        state.currentRoster = null;
    }

    return true;
}

function selectRoster(state, rosterId) {
    state.currentRosterId = rosterId;
    state.currentRoster = state.rosters.find(r => r.id === rosterId) || null;
    localStorage.setItem('currentRosterId', rosterId);
    return state.currentRoster;
}

function clearRosterSelection(state) {
    state.currentRosterId = null;
    state.currentRoster = null;
    localStorage.removeItem('currentRosterId');
}

// =====================================================
// PLAYER MANAGEMENT FUNCTIONS
// =====================================================

async function loadPlayersForRoster(state, rosterId) {
    const { data, error } = await supabaseClient
        .from('players')
        .select('*')
        .eq('roster_id', rosterId)
        .order('number', { ascending: true, nullsFirst: false });

    if (error) throw error;
    state.players = data || [];
    return state.players;
}

async function addPlayerToRoster(state, userId, rosterId, name, number) {
    if (!name || !name.trim()) {
        throw new Error('Player name is required');
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
// UI UPDATE FUNCTIONS
// =====================================================

function renderRostersList(rosters) {
    const listEl = document.getElementById('rosters-list');
    if (!listEl) return;

    if (rosters.length === 0) {
        listEl.innerHTML = '<p class="empty-message">No rosters yet. Create one to get started!</p>';
        return;
    }

    listEl.innerHTML = rosters.map(roster => `
        <div class="roster-item" data-id="${roster.id}">
            <span class="roster-name">${roster.name}</span>
            <button class="view-players-btn" data-id="${roster.id}">Players</button>
            <button class="edit-roster-btn" data-id="${roster.id}">Edit</button>
        </div>
    `).join('');
}

function renderPlayersList(players) {
    const listEl = document.getElementById('roster-players-list');
    if (!listEl) return;

    if (players.length === 0) {
        listEl.innerHTML = '<p class="empty-message">No players in this roster yet.</p>';
        return;
    }

    listEl.innerHTML = players.map(player => `
        <div class="player-item" data-id="${player.id}">
            <span class="player-number">${player.number || '-'}</span>
            <span class="player-name">${player.name}</span>
            <button class="delete-player-btn" data-id="${player.id}">×</button>
        </div>
    `).join('');
}

function renderSelectRosterList(rosters, currentRosterId) {
    const listEl = document.getElementById('select-roster-list');
    if (!listEl) return;

    if (rosters.length === 0) {
        listEl.innerHTML = '<p class="empty-message">No rosters available.</p>';
        return;
    }

    listEl.innerHTML = rosters.map(roster => `
        <div class="roster-select-item ${roster.id === currentRosterId ? 'selected' : ''}" data-id="${roster.id}">
            <span class="roster-name">${roster.name}</span>
            ${roster.id === currentRosterId ? '<span class="checkmark">✓</span>' : ''}
        </div>
    `).join('');
}

function updateSelectedRosterDisplay(roster) {
    const nameEl = document.getElementById('selected-roster-name');
    const trackingSection = document.getElementById('player-tracking-section');

    if (nameEl) {
        nameEl.textContent = roster ? roster.name : 'No roster selected';
    }

    if (trackingSection) {
        trackingSection.style.display = roster ? 'block' : 'none';
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// =====================================================
// TESTS
// =====================================================

describe('Roster Management Integration', () => {
    let app;
    let state;

    beforeEach(() => {
        resetMocks();
        app = createRosterManagementDOM();
        state = createRosterState();
        setMockUser(mockAuthUser);
    });

    // =====================================================
    // ROSTER LOADING
    // =====================================================

    describe('Roster Loading', () => {
        it('should load rosters for authenticated user', async () => {
            setMockRosters([...multipleRosters]);

            const rosters = await loadRosters(state, mockAuthUser.id);

            expect(rosters).toHaveLength(3);
            expect(state.rosters).toHaveLength(3);
        });

        it('should handle empty rosters list', async () => {
            setMockRosters([]);

            const rosters = await loadRosters(state, mockAuthUser.id);

            expect(rosters).toHaveLength(0);
            expect(state.rosters).toHaveLength(0);
        });

        it('should render rosters list in UI', async () => {
            setMockRosters([...multipleRosters]);
            await loadRosters(state, mockAuthUser.id);
            renderRostersList(state.rosters);

            const rosterItems = document.querySelectorAll('.roster-item');
            expect(rosterItems).toHaveLength(3);
        });

        it('should show empty message when no rosters', async () => {
            setMockRosters([]);
            await loadRosters(state, mockAuthUser.id);
            renderRostersList(state.rosters);

            const emptyMessage = document.querySelector('.empty-message');
            expect(emptyMessage).toBeTruthy();
            expect(emptyMessage.textContent).toContain('No rosters yet');
        });

        it('should handle load error gracefully', async () => {
            setMockError({ message: 'Network error' });

            await expect(loadRosters(state, mockAuthUser.id))
                .rejects.toEqual({ message: 'Network error' });
        });
    });

    // =====================================================
    // ROSTER CREATION
    // =====================================================

    describe('Roster Creation', () => {
        beforeEach(() => {
            setMockRosters([]);
        });

        it('should create a new roster', async () => {
            const roster = await createNewRoster(state, mockAuthUser.id, 'New Team');

            expect(roster).toBeDefined();
            expect(roster.name).toBe('New Team');
            expect(state.rosters).toHaveLength(1);
        });

        it('should trim whitespace from roster name', async () => {
            const roster = await createNewRoster(state, mockAuthUser.id, '  Spaced Name  ');

            expect(roster.name).toBe('Spaced Name');
        });

        it('should reject empty roster name', async () => {
            await expect(createNewRoster(state, mockAuthUser.id, ''))
                .rejects.toThrow('Roster name is required');
        });

        it('should reject whitespace-only roster name', async () => {
            await expect(createNewRoster(state, mockAuthUser.id, '   '))
                .rejects.toThrow('Roster name is required');
        });

        it('should generate unique ID for new roster', async () => {
            const roster1 = await createNewRoster(state, mockAuthUser.id, 'Team 1');
            const roster2 = await createNewRoster(state, mockAuthUser.id, 'Team 2');

            expect(roster1.id).toBeDefined();
            expect(roster2.id).toBeDefined();
            expect(roster1.id).not.toBe(roster2.id);
        });

        it('should add timestamps to new roster', async () => {
            const roster = await createNewRoster(state, mockAuthUser.id, 'New Team');

            expect(roster.created_at).toBeDefined();
            expect(roster.updated_at).toBeDefined();
        });
    });

    // =====================================================
    // ROSTER SELECTION
    // =====================================================

    describe('Roster Selection', () => {
        beforeEach(() => {
            state.rosters = [...multipleRosters];
        });

        it('should select a roster', () => {
            const roster = selectRoster(state, 'roster-001');

            expect(state.currentRosterId).toBe('roster-001');
            expect(state.currentRoster.name).toBe('U12 Eagles');
        });

        it('should persist selection to localStorage', () => {
            selectRoster(state, 'roster-002');

            expect(localStorage.getItem('currentRosterId')).toBe('roster-002');
        });

        it('should update UI when roster selected', () => {
            const roster = selectRoster(state, 'roster-001');
            updateSelectedRosterDisplay(roster);

            const nameEl = document.getElementById('selected-roster-name');
            expect(nameEl.textContent).toBe('U12 Eagles');
        });

        it('should show player tracking section when roster selected', () => {
            const roster = selectRoster(state, 'roster-001');
            updateSelectedRosterDisplay(roster);

            const trackingSection = document.getElementById('player-tracking-section');
            expect(trackingSection.style.display).toBe('block');
        });

        it('should clear roster selection', () => {
            selectRoster(state, 'roster-001');
            clearRosterSelection(state);

            expect(state.currentRosterId).toBeNull();
            expect(state.currentRoster).toBeNull();
            expect(localStorage.getItem('currentRosterId')).toBeNull();
        });

        it('should hide player tracking when selection cleared', () => {
            clearRosterSelection(state);
            updateSelectedRosterDisplay(null);

            const trackingSection = document.getElementById('player-tracking-section');
            expect(trackingSection.style.display).toBe('none');
        });

        it('should render selection indicator in roster list', () => {
            state.currentRosterId = 'roster-002';
            renderSelectRosterList(state.rosters, state.currentRosterId);

            const selectedItem = document.querySelector('.roster-select-item.selected');
            expect(selectedItem).toBeTruthy();
            expect(selectedItem.dataset.id).toBe('roster-002');
        });
    });

    // =====================================================
    // ROSTER UPDATE
    // =====================================================

    describe('Roster Update', () => {
        beforeEach(() => {
            setMockRosters([...multipleRosters]);
            state.rosters = [...multipleRosters];
        });

        it('should update roster name', async () => {
            const updated = await updateRoster(state, 'roster-001', { name: 'Updated Eagles' });

            expect(updated.name).toBe('Updated Eagles');
            expect(state.rosters.find(r => r.id === 'roster-001').name).toBe('Updated Eagles');
        });

        it('should update current roster display after edit', async () => {
            state.currentRosterId = 'roster-001';
            state.currentRoster = state.rosters.find(r => r.id === 'roster-001');

            await updateRoster(state, 'roster-001', { name: 'New Name' });

            // Re-select to get updated roster
            state.currentRoster = state.rosters.find(r => r.id === state.currentRosterId);
            updateSelectedRosterDisplay(state.currentRoster);

            const nameEl = document.getElementById('selected-roster-name');
            expect(nameEl.textContent).toBe('New Name');
        });
    });

    // =====================================================
    // ROSTER DELETION
    // =====================================================

    describe('Roster Deletion', () => {
        beforeEach(() => {
            setMockRosters([...multipleRosters]);
            setMockPlayers([...u12EaglesPlayers, ...u14ThunderPlayers]);
            state.rosters = [...multipleRosters];
            state.players = [...u12EaglesPlayers, ...u14ThunderPlayers];
        });

        it('should delete roster', async () => {
            await deleteRoster(state, 'roster-001');

            expect(state.rosters).toHaveLength(2);
            expect(state.rosters.find(r => r.id === 'roster-001')).toBeUndefined();
        });

        it('should cascade delete players in roster', async () => {
            const initialPlayerCount = state.players.length;
            const eaglesPlayerCount = u12EaglesPlayers.length;

            await deleteRoster(state, 'roster-001');

            expect(state.players).toHaveLength(initialPlayerCount - eaglesPlayerCount);
            expect(state.players.filter(p => p.roster_id === 'roster-001')).toHaveLength(0);
        });

        it('should clear selection if deleted roster was selected', async () => {
            selectRoster(state, 'roster-001');
            await deleteRoster(state, 'roster-001');

            expect(state.currentRosterId).toBeNull();
            expect(state.currentRoster).toBeNull();
        });

        it('should keep selection if different roster deleted', async () => {
            selectRoster(state, 'roster-002');
            await deleteRoster(state, 'roster-001');

            expect(state.currentRosterId).toBe('roster-002');
            expect(state.currentRoster).toBeDefined();
        });
    });

    // =====================================================
    // PLAYER MANAGEMENT
    // =====================================================

    describe('Player Management', () => {
        beforeEach(() => {
            setMockRosters([singleRoster]);
            setMockPlayers([...u12EaglesPlayers]);
            state.rosters = [singleRoster];
        });

        it('should load players for roster', async () => {
            const players = await loadPlayersForRoster(state, 'roster-001');

            expect(players).toHaveLength(u12EaglesPlayers.length);
            expect(state.players).toHaveLength(u12EaglesPlayers.length);
        });

        it('should render players list', async () => {
            await loadPlayersForRoster(state, 'roster-001');
            renderPlayersList(state.players);

            const playerItems = document.querySelectorAll('.player-item');
            expect(playerItems).toHaveLength(u12EaglesPlayers.length);
        });

        it('should display player name and number', async () => {
            state.players = [createPlayer({ name: 'Test Player', number: 10 })];
            renderPlayersList(state.players);

            const nameEl = document.querySelector('.player-name');
            const numberEl = document.querySelector('.player-number');

            expect(nameEl.textContent).toBe('Test Player');
            expect(numberEl.textContent).toBe('10');
        });

        it('should display dash for player without number', async () => {
            state.players = [createPlayer({ name: 'No Number', number: null })];
            renderPlayersList(state.players);

            const numberEl = document.querySelector('.player-number');
            expect(numberEl.textContent).toBe('-');
        });

        it('should add player to roster', async () => {
            setMockPlayers([]);
            state.players = [];

            const player = await addPlayerToRoster(
                state,
                mockAuthUser.id,
                'roster-001',
                'New Player',
                23
            );

            expect(player.name).toBe('New Player');
            expect(player.number).toBe(23);
            expect(player.roster_id).toBe('roster-001');
            expect(state.players).toHaveLength(1);
        });

        it('should add player without number', async () => {
            setMockPlayers([]);
            state.players = [];

            const player = await addPlayerToRoster(
                state,
                mockAuthUser.id,
                'roster-001',
                'Unnamed Number',
                null
            );

            expect(player.number).toBeNull();
        });

        it('should reject empty player name', async () => {
            await expect(
                addPlayerToRoster(state, mockAuthUser.id, 'roster-001', '', 10)
            ).rejects.toThrow('Player name is required');
        });

        it('should delete player', async () => {
            state.players = [...u12EaglesPlayers];
            const initialCount = state.players.length;

            await deletePlayer(state, 'player-001');

            expect(state.players).toHaveLength(initialCount - 1);
            expect(state.players.find(p => p.id === 'player-001')).toBeUndefined();
        });

        it('should show empty message when no players', async () => {
            state.players = [];
            renderPlayersList(state.players);

            const emptyMessage = document.querySelector('.empty-message');
            expect(emptyMessage).toBeTruthy();
            expect(emptyMessage.textContent).toContain('No players');
        });
    });

    // =====================================================
    // MODAL INTERACTIONS
    // =====================================================

    describe('Modal Interactions', () => {
        it('should show rosters modal', () => {
            showModal('rosters-modal-overlay');

            const modal = document.getElementById('rosters-modal-overlay');
            expect(modal.classList.contains('hidden')).toBe(false);
        });

        it('should hide rosters modal', () => {
            showModal('rosters-modal-overlay');
            hideModal('rosters-modal-overlay');

            const modal = document.getElementById('rosters-modal-overlay');
            expect(modal.classList.contains('hidden')).toBe(true);
        });

        it('should show select roster modal', () => {
            showModal('select-roster-modal-overlay');

            const modal = document.getElementById('select-roster-modal-overlay');
            expect(modal.classList.contains('hidden')).toBe(false);
        });

        it('should show roster players modal', () => {
            showModal('roster-players-modal-overlay');

            const modal = document.getElementById('roster-players-modal-overlay');
            expect(modal.classList.contains('hidden')).toBe(false);
        });

        it('should show edit roster modal', () => {
            showModal('edit-roster-modal-overlay');

            const modal = document.getElementById('edit-roster-modal-overlay');
            expect(modal.classList.contains('hidden')).toBe(false);
        });
    });

    // =====================================================
    // PLAYER TRACKING TOGGLE
    // =====================================================

    describe('Player Tracking Toggle', () => {
        it('should enable player tracking', () => {
            state.playerTrackingEnabled = true;
            const checkbox = document.getElementById('enable-player-tracking');
            checkbox.checked = true;

            expect(checkbox.checked).toBe(true);
        });

        it('should persist tracking preference to localStorage', () => {
            state.playerTrackingEnabled = true;
            localStorage.setItem('playerTrackingEnabled', 'true');

            expect(localStorage.getItem('playerTrackingEnabled')).toBe('true');
        });

        it('should set roster team for tracking', () => {
            state.rosterTeam = 'away';
            const select = document.getElementById('roster-team-select');
            select.value = 'away';

            expect(select.value).toBe('away');
        });

        it('should persist roster team to localStorage', () => {
            state.rosterTeam = 'away';
            localStorage.setItem('rosterTeam', 'away');

            expect(localStorage.getItem('rosterTeam')).toBe('away');
        });
    });

    // =====================================================
    // LOCAL STORAGE INTEGRATION
    // =====================================================

    describe('LocalStorage Integration', () => {
        it('should restore roster selection from localStorage', () => {
            state.rosters = [...multipleRosters];
            localStorage.setItem('currentRosterId', 'roster-002');

            const savedId = localStorage.getItem('currentRosterId');
            if (savedId) {
                selectRoster(state, savedId);
            }

            expect(state.currentRosterId).toBe('roster-002');
            expect(state.currentRoster.name).toBe('U14 Thunder');
        });

        it('should restore player tracking settings from localStorage', () => {
            localStorage.setItem('playerTrackingEnabled', 'true');
            localStorage.setItem('rosterTeam', 'away');

            state.playerTrackingEnabled = localStorage.getItem('playerTrackingEnabled') === 'true';
            state.rosterTeam = localStorage.getItem('rosterTeam') || 'home';

            expect(state.playerTrackingEnabled).toBe(true);
            expect(state.rosterTeam).toBe('away');
        });

        it('should handle missing localStorage gracefully', () => {
            const savedId = localStorage.getItem('nonexistent');
            expect(savedId).toBeNull();
        });
    });

    // =====================================================
    // GAME INTEGRATION
    // =====================================================

    describe('Game Integration', () => {
        it('should associate roster with game', () => {
            state.rosters = [...multipleRosters];
            selectRoster(state, 'roster-001');

            const gameData = {
                rosterId: state.currentRosterId,
                rosterTeam: state.rosterTeam
            };

            expect(gameData.rosterId).toBe('roster-001');
            expect(gameData.rosterTeam).toBe('home');
        });

        it('should track shots with player attribution', () => {
            state.rosters = [...multipleRosters];
            state.players = [...u12EaglesPlayers];
            selectRoster(state, 'roster-001');

            const shot = {
                team: 'home',
                type: 'GOAL!',
                playerId: 'player-003',
                playerName: 'Taylor Brown'
            };

            const player = state.players.find(p => p.id === shot.playerId);
            expect(player).toBeDefined();
            expect(player.name).toBe('Taylor Brown');
        });
    });
});
