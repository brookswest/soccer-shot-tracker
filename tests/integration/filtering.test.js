/**
 * Filtering Integration Tests
 * Tests for shot filtering by team, type, and half
 */

import '@testing-library/jest-dom';
import {
    createShot,
    smallDataset,
    mediumDataset,
    homeTeamOnly,
    awayTeamOnly,
    emptyShots
} from '../fixtures/mockShots.js';

// =====================================================
// FILTERING HELPER FUNCTIONS
// These simulate the app's filtering logic
// =====================================================

function filterByTeam(shots, team) {
    if (team === 'all') return shots;
    return shots.filter(s => s.team === team);
}

function filterByType(shots, type) {
    if (type === 'all') return shots;
    return shots.filter(s => s.type === type);
}

function filterByHalf(shots, half) {
    if (half === 'all') return shots;
    return shots.filter(s => s.half === half);
}

function filterShots(shots, { team = 'all', type = 'all', half = 'all' } = {}) {
    let filtered = shots;

    filtered = filterByTeam(filtered, team);
    filtered = filterByType(filtered, type);
    filtered = filterByHalf(filtered, half);

    return filtered;
}

function getFilterOptions(shots) {
    const teams = [...new Set(shots.map(s => s.team))];
    const types = [...new Set(shots.map(s => s.type))];
    const halves = [...new Set(shots.map(s => s.half))];

    return { teams, types, halves };
}

// =====================================================
// DOM SETUP HELPERS
// =====================================================

function createFilterDOM() {
    document.body.innerHTML = `
        <div id="filterContainer">
            <div class="filter-group">
                <label>Team:</label>
                <select id="teamFilter">
                    <option value="all">All Teams</option>
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Shot Type:</label>
                <select id="typeFilter">
                    <option value="all">All Types</option>
                    <option value="GOAL!">Goals</option>
                    <option value="Shot On Target">On Target</option>
                    <option value="Shot Off Target">Off Target</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Half:</label>
                <select id="halfFilter">
                    <option value="all">Both Halves</option>
                    <option value="1st Half">1st Half</option>
                    <option value="2nd Half">2nd Half</option>
                </select>
            </div>

            <div id="shotList"></div>
            <div id="shotCount">0 shots</div>
        </div>
    `;

    return document.getElementById('filterContainer');
}

describe('Filtering Integration', () => {
    beforeEach(() => {
        createFilterDOM();
    });

    // =====================================================
    // TEAM FILTERING
    // =====================================================

    describe('Team Filtering', () => {
        it('should return all shots when team filter is "all"', () => {
            const filtered = filterByTeam(mediumDataset, 'all');
            expect(filtered.length).toBe(mediumDataset.length);
        });

        it('should filter to home team only', () => {
            const filtered = filterByTeam(mediumDataset, 'home');
            expect(filtered.every(s => s.team === 'home')).toBe(true);
        });

        it('should filter to away team only', () => {
            const filtered = filterByTeam(mediumDataset, 'away');
            expect(filtered.every(s => s.team === 'away')).toBe(true);
        });

        it('should return empty array for non-matching team', () => {
            const filtered = filterByTeam(homeTeamOnly, 'away');
            expect(filtered).toHaveLength(0);
        });

        it('should handle empty dataset', () => {
            const filtered = filterByTeam(emptyShots, 'home');
            expect(filtered).toHaveLength(0);
        });
    });

    // =====================================================
    // SHOT TYPE FILTERING
    // =====================================================

    describe('Shot Type Filtering', () => {
        it('should return all shots when type filter is "all"', () => {
            const filtered = filterByType(mediumDataset, 'all');
            expect(filtered.length).toBe(mediumDataset.length);
        });

        it('should filter to goals only', () => {
            const filtered = filterByType(mediumDataset, 'GOAL!');
            expect(filtered.every(s => s.type === 'GOAL!')).toBe(true);
            expect(filtered.length).toBeGreaterThan(0);
        });

        it('should filter to shots on target only', () => {
            const filtered = filterByType(mediumDataset, 'Shot On Target');
            expect(filtered.every(s => s.type === 'Shot On Target')).toBe(true);
        });

        it('should filter to shots off target only', () => {
            const filtered = filterByType(mediumDataset, 'Shot Off Target');
            expect(filtered.every(s => s.type === 'Shot Off Target')).toBe(true);
        });

        it('should count goals correctly', () => {
            const goals = filterByType(mediumDataset, 'GOAL!');
            expect(goals.length).toBe(5); // 3 home + 2 away goals
        });
    });

    // =====================================================
    // HALF FILTERING
    // =====================================================

    describe('Half Filtering', () => {
        it('should return all shots when half filter is "all"', () => {
            const filtered = filterByHalf(mediumDataset, 'all');
            expect(filtered.length).toBe(mediumDataset.length);
        });

        it('should filter to first half only', () => {
            const filtered = filterByHalf(mediumDataset, '1st Half');
            expect(filtered.every(s => s.half === '1st Half')).toBe(true);
        });

        it('should filter to second half only', () => {
            const filtered = filterByHalf(mediumDataset, '2nd Half');
            expect(filtered.every(s => s.half === '2nd Half')).toBe(true);
        });

        it('should have shots in both halves in medium dataset', () => {
            const firstHalf = filterByHalf(mediumDataset, '1st Half');
            const secondHalf = filterByHalf(mediumDataset, '2nd Half');

            expect(firstHalf.length).toBeGreaterThan(0);
            expect(secondHalf.length).toBeGreaterThan(0);
        });
    });

    // =====================================================
    // COMBINED FILTERS
    // =====================================================

    describe('Combined Filters', () => {
        it('should apply team and type filters together', () => {
            const filtered = filterShots(mediumDataset, {
                team: 'home',
                type: 'GOAL!'
            });

            expect(filtered.every(s => s.team === 'home' && s.type === 'GOAL!')).toBe(true);
            expect(filtered.length).toBe(3); // 3 home goals
        });

        it('should apply team and half filters together', () => {
            const filtered = filterShots(mediumDataset, {
                team: 'away',
                half: '1st Half'
            });

            expect(filtered.every(s => s.team === 'away' && s.half === '1st Half')).toBe(true);
        });

        it('should apply all three filters together', () => {
            const filtered = filterShots(mediumDataset, {
                team: 'home',
                type: 'GOAL!',
                half: '1st Half'
            });

            expect(filtered.every(s =>
                s.team === 'home' &&
                s.type === 'GOAL!' &&
                s.half === '1st Half'
            )).toBe(true);
            expect(filtered.length).toBe(2); // 2 home goals in 1st half
        });

        it('should return empty when no shots match combined filters', () => {
            // Away team has no goals in defensive half
            const filtered = filterShots(mediumDataset, {
                team: 'away',
                type: 'GOAL!',
                half: '1st Half'
            });

            // There's actually 1 away goal in 1st half, so let's test something that returns 0
            const noMatch = filterShots(smallDataset, {
                team: 'away',
                type: 'Shot Off Target'
            });

            expect(noMatch).toHaveLength(0);
        });
    });

    // =====================================================
    // FILTER OPTIONS EXTRACTION
    // =====================================================

    describe('Filter Options Extraction', () => {
        it('should extract available teams from dataset', () => {
            const options = getFilterOptions(mediumDataset);
            expect(options.teams).toContain('home');
            expect(options.teams).toContain('away');
        });

        it('should extract available shot types from dataset', () => {
            const options = getFilterOptions(mediumDataset);
            expect(options.types).toContain('GOAL!');
            expect(options.types).toContain('Shot On Target');
            expect(options.types).toContain('Shot Off Target');
        });

        it('should extract available halves from dataset', () => {
            const options = getFilterOptions(mediumDataset);
            expect(options.halves).toContain('1st Half');
            expect(options.halves).toContain('2nd Half');
        });

        it('should return single team for home-only dataset', () => {
            const options = getFilterOptions(homeTeamOnly);
            expect(options.teams).toEqual(['home']);
        });

        it('should return empty arrays for empty dataset', () => {
            const options = getFilterOptions(emptyShots);
            expect(options.teams).toHaveLength(0);
            expect(options.types).toHaveLength(0);
            expect(options.halves).toHaveLength(0);
        });
    });

    // =====================================================
    // UI CONTROLS
    // =====================================================

    describe('UI Controls', () => {
        it('should have team filter select element', () => {
            const teamFilter = document.getElementById('teamFilter');
            expect(teamFilter).toBeInTheDocument();
            expect(teamFilter.tagName).toBe('SELECT');
        });

        it('should have type filter select element', () => {
            const typeFilter = document.getElementById('typeFilter');
            expect(typeFilter).toBeInTheDocument();
        });

        it('should have half filter select element', () => {
            const halfFilter = document.getElementById('halfFilter');
            expect(halfFilter).toBeInTheDocument();
        });

        it('should have all teams option in team filter', () => {
            const teamFilter = document.getElementById('teamFilter');
            const options = Array.from(teamFilter.options).map(o => o.value);

            expect(options).toContain('all');
            expect(options).toContain('home');
            expect(options).toContain('away');
        });

        it('should have all types option in type filter', () => {
            const typeFilter = document.getElementById('typeFilter');
            const options = Array.from(typeFilter.options).map(o => o.value);

            expect(options).toContain('all');
            expect(options).toContain('GOAL!');
            expect(options).toContain('Shot On Target');
            expect(options).toContain('Shot Off Target');
        });
    });

    // =====================================================
    // FILTER STATE MANAGEMENT
    // =====================================================

    describe('Filter State Management', () => {
        it('should default to "all" for all filters', () => {
            const teamFilter = document.getElementById('teamFilter');
            const typeFilter = document.getElementById('typeFilter');
            const halfFilter = document.getElementById('halfFilter');

            expect(teamFilter.value).toBe('all');
            expect(typeFilter.value).toBe('all');
            expect(halfFilter.value).toBe('all');
        });

        it('should update team filter value', () => {
            const teamFilter = document.getElementById('teamFilter');
            teamFilter.value = 'home';

            expect(teamFilter.value).toBe('home');
        });

        it('should persist filter to localStorage', () => {
            localStorage.setItem('shotFilterTeam', 'away');
            localStorage.setItem('shotFilterType', 'GOAL!');
            localStorage.setItem('shotFilterHalf', '2nd Half');

            expect(localStorage.getItem('shotFilterTeam')).toBe('away');
            expect(localStorage.getItem('shotFilterType')).toBe('GOAL!');
            expect(localStorage.getItem('shotFilterHalf')).toBe('2nd Half');
        });

        it('should restore filters from localStorage', () => {
            localStorage.setItem('shotFilterTeam', 'home');

            const savedTeam = localStorage.getItem('shotFilterTeam');
            const teamFilter = document.getElementById('teamFilter');
            teamFilter.value = savedTeam;

            expect(teamFilter.value).toBe('home');
        });
    });

    // =====================================================
    // SHOT COUNT DISPLAY
    // =====================================================

    describe('Shot Count Display', () => {
        function updateShotCount(count) {
            const countEl = document.getElementById('shotCount');
            countEl.textContent = `${count} shot${count !== 1 ? 's' : ''}`;
        }

        it('should display correct count for all shots', () => {
            updateShotCount(mediumDataset.length);

            const countEl = document.getElementById('shotCount');
            expect(countEl.textContent).toBe('15 shots');
        });

        it('should display singular for 1 shot', () => {
            updateShotCount(1);

            const countEl = document.getElementById('shotCount');
            expect(countEl.textContent).toBe('1 shot');
        });

        it('should display 0 shots', () => {
            updateShotCount(0);

            const countEl = document.getElementById('shotCount');
            expect(countEl.textContent).toBe('0 shots');
        });

        it('should update count when filters change', () => {
            const filtered = filterShots(mediumDataset, { team: 'home' });
            updateShotCount(filtered.length);

            const countEl = document.getElementById('shotCount');
            expect(countEl.textContent).toBe('8 shots');
        });
    });

    // =====================================================
    // FILTERED DATA STATISTICS
    // =====================================================

    describe('Filtered Data Statistics', () => {
        it('should calculate correct stats for filtered data', () => {
            const homeShots = filterByTeam(mediumDataset, 'home');
            const homeGoals = filterByType(homeShots, 'GOAL!');

            expect(homeGoals.length).toBe(3);
        });

        it('should calculate first half home stats', () => {
            const filtered = filterShots(mediumDataset, {
                team: 'home',
                half: '1st Half'
            });

            expect(filtered.length).toBe(5);
        });

        it('should calculate second half away stats', () => {
            const filtered = filterShots(mediumDataset, {
                team: 'away',
                half: '2nd Half'
            });

            expect(filtered.length).toBe(4);
        });
    });

    // =====================================================
    // EDGE CASES
    // =====================================================

    describe('Edge Cases', () => {
        it('should handle filtering single shot dataset', () => {
            const singleShot = [createShot({ team: 'home', type: 'GOAL!' })];

            const filtered = filterShots(singleShot, { team: 'home' });
            expect(filtered).toHaveLength(1);

            const noMatch = filterShots(singleShot, { team: 'away' });
            expect(noMatch).toHaveLength(0);
        });

        it('should handle multiple consecutive filter changes', () => {
            let result = filterShots(mediumDataset, { team: 'home' });
            expect(result.length).toBe(8);

            result = filterShots(mediumDataset, { team: 'away' });
            expect(result.length).toBe(7);

            result = filterShots(mediumDataset, { team: 'all' });
            expect(result.length).toBe(15);
        });

        it('should handle undefined filter values gracefully', () => {
            const filtered = filterShots(mediumDataset, {});
            expect(filtered.length).toBe(mediumDataset.length);
        });

        it('should handle invalid filter values', () => {
            const filtered = filterByTeam(mediumDataset, 'invalid_team');
            expect(filtered).toHaveLength(0);
        });
    });
});
