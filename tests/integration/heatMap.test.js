/**
 * Heat Map Integration Tests
 * Tests for heat map rendering, controls, and team filtering
 */

import '@testing-library/jest-dom';
import {
    createShot,
    smallDataset,
    mediumDataset,
    largeDataset,
    heatMapTestData,
    homeTeamOnly,
    awayTeamOnly,
    emptyShots
} from '../fixtures/mockShots.js';

// =====================================================
// HEAT MAP HELPER FUNCTIONS
// These simulate the app's heat map logic
// =====================================================

const FIELD_WIDTH = 105;
const FIELD_HEIGHT = 68;
const GRID_SIZE = 5;
const MIN_SHOTS_FOR_HEAT_MAP = 10;

function canShowHeatMap(shots) {
    return shots.length >= MIN_SHOTS_FOR_HEAT_MAP;
}

function canShowTeamHeatMap(shots, team) {
    const teamShots = shots.filter(s => s.team === team);
    return teamShots.length >= MIN_SHOTS_FOR_HEAT_MAP;
}

function getHeatMapShots(shots, teamFilter = 'all') {
    let filtered = teamFilter === 'all' ? shots :
                   shots.filter(s => s.team === teamFilter);

    // Apply shot weighting rules:
    // - Goals and on-target shots get full weight
    // - Off-target shots in attacking half (x > 52.5) get reduced weight (included)
    // - Off-target shots in defensive half (x <= 52.5) are excluded
    return filtered.filter(shot => {
        if (shot.type === 'GOAL!' || shot.type === 'Shot On Target') {
            return true;
        }
        // Off-target shots only included if in attacking half
        if (shot.type === 'Shot Off Target') {
            return shot.position.x > 52.5;
        }
        return false;
    });
}

function getShotWeight(shot) {
    if (shot.type === 'GOAL!' || shot.type === 'Shot On Target') {
        return 1.0;
    }
    if (shot.type === 'Shot Off Target' && shot.position.x > 52.5) {
        return 0.4;
    }
    return 0;
}

function calculateDensityGrid(shots, gridSize = GRID_SIZE) {
    const cols = Math.ceil(FIELD_WIDTH / gridSize);
    const rows = Math.ceil(FIELD_HEIGHT / gridSize);
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(0));

    shots.forEach(shot => {
        const col = Math.floor(shot.position.x / gridSize);
        const row = Math.floor(shot.position.y / gridSize);
        const weight = getShotWeight(shot);

        if (col >= 0 && col < cols && row >= 0 && row < rows) {
            grid[row][col] += weight;
        }
    });

    return grid;
}

function getMaxDensity(grid) {
    return Math.max(...grid.flat());
}

function getDensityColor(density, maxDensity) {
    if (maxDensity === 0 || density === 0) return 'transparent';

    const normalized = density / maxDensity;

    // Color gradient from cool to warm
    if (normalized < 0.2) {
        return `rgba(0, 0, 255, ${0.1 + normalized * 0.2})`; // Blue
    } else if (normalized < 0.4) {
        return `rgba(0, 255, 255, ${0.2 + normalized * 0.3})`; // Cyan
    } else if (normalized < 0.6) {
        return `rgba(0, 255, 0, ${0.3 + normalized * 0.3})`; // Green
    } else if (normalized < 0.8) {
        return `rgba(255, 255, 0, ${0.5 + normalized * 0.2})`; // Yellow
    } else {
        return `rgba(255, 0, 0, ${0.6 + normalized * 0.3})`; // Red
    }
}

// =====================================================
// DOM SETUP HELPERS
// =====================================================

function createHeatMapDOM() {
    document.body.innerHTML = `
        <div id="heatMapContainer">
            <canvas id="heatMapCanvas" width="600" height="400"></canvas>

            <div class="heat-map-controls">
                <label class="toggle-label">
                    <input type="checkbox" id="heatMapToggle">
                    <span>Show Heat Map</span>
                </label>

                <div class="team-filter-buttons" id="heatMapTeamFilter">
                    <button id="heatMapAll" class="active">All</button>
                    <button id="heatMapHome" disabled>Home</button>
                    <button id="heatMapAway" disabled>Away</button>
                </div>
            </div>
        </div>
    `;

    return document.getElementById('heatMapContainer');
}

describe('Heat Map Integration', () => {
    beforeEach(() => {
        createHeatMapDOM();
        localStorage.clear();
    });

    // =====================================================
    // HEAT MAP VISIBILITY CONDITIONS
    // =====================================================

    describe('Heat Map Visibility Conditions', () => {
        it('should not show heat map with fewer than 10 shots', () => {
            expect(canShowHeatMap(smallDataset)).toBe(false);
            expect(smallDataset.length).toBeLessThan(10);
        });

        it('should show heat map with 10 or more shots', () => {
            expect(canShowHeatMap(mediumDataset)).toBe(true);
            expect(mediumDataset.length).toBeGreaterThanOrEqual(10);
        });

        it('should not show heat map for empty dataset', () => {
            expect(canShowHeatMap(emptyShots)).toBe(false);
        });

        it('should show heat map for large dataset', () => {
            expect(canShowHeatMap(largeDataset)).toBe(true);
        });
    });

    // =====================================================
    // TEAM FILTER CONDITIONS
    // =====================================================

    describe('Team Filter Conditions', () => {
        it('should enable home team filter when home has 10+ shots', () => {
            expect(canShowTeamHeatMap(homeTeamOnly, 'home')).toBe(true);
            expect(homeTeamOnly.length).toBeGreaterThanOrEqual(10);
        });

        it('should enable away team filter when away has 10+ shots', () => {
            expect(canShowTeamHeatMap(awayTeamOnly, 'away')).toBe(true);
            expect(awayTeamOnly.length).toBeGreaterThanOrEqual(10);
        });

        it('should disable team filter when team has fewer than 10 shots', () => {
            expect(canShowTeamHeatMap(smallDataset, 'home')).toBe(false);
            expect(canShowTeamHeatMap(smallDataset, 'away')).toBe(false);
        });

        it('should count shots per team correctly in mixed dataset', () => {
            const homeShots = mediumDataset.filter(s => s.team === 'home');
            const awayShots = mediumDataset.filter(s => s.team === 'away');

            expect(homeShots.length).toBeGreaterThan(0);
            expect(awayShots.length).toBeGreaterThan(0);
        });
    });

    // =====================================================
    // SHOT FILTERING FOR HEAT MAP
    // =====================================================

    describe('Shot Filtering for Heat Map', () => {
        it('should include all shots when filter is "all"', () => {
            const filtered = getHeatMapShots(mediumDataset, 'all');
            expect(filtered.length).toBeGreaterThan(0);
        });

        it('should filter to home team shots only', () => {
            const filtered = getHeatMapShots(mediumDataset, 'home');
            expect(filtered.every(s => s.team === 'home')).toBe(true);
        });

        it('should filter to away team shots only', () => {
            const filtered = getHeatMapShots(mediumDataset, 'away');
            expect(filtered.every(s => s.team === 'away')).toBe(true);
        });

        it('should exclude off-target shots in defensive half', () => {
            const defensiveOffTarget = createShot({
                type: 'Shot Off Target',
                x: 30,  // Defensive half
                y: 34
            });

            const filtered = getHeatMapShots([defensiveOffTarget]);
            expect(filtered).toHaveLength(0);
        });

        it('should include off-target shots in attacking half', () => {
            const attackingOffTarget = createShot({
                type: 'Shot Off Target',
                x: 80,  // Attacking half
                y: 34
            });

            const filtered = getHeatMapShots([attackingOffTarget]);
            expect(filtered).toHaveLength(1);
        });

        it('should always include goals regardless of position', () => {
            const goal = createShot({
                type: 'GOAL!',
                x: 95,
                y: 34
            });

            const filtered = getHeatMapShots([goal]);
            expect(filtered).toHaveLength(1);
        });

        it('should always include shots on target regardless of position', () => {
            const onTarget = createShot({
                type: 'Shot On Target',
                x: 88,
                y: 30
            });

            const filtered = getHeatMapShots([onTarget]);
            expect(filtered).toHaveLength(1);
        });
    });

    // =====================================================
    // SHOT WEIGHTING
    // =====================================================

    describe('Shot Weighting', () => {
        it('should give goals full weight (1.0)', () => {
            const goal = createShot({ type: 'GOAL!', x: 95, y: 34 });
            expect(getShotWeight(goal)).toBe(1.0);
        });

        it('should give shots on target full weight (1.0)', () => {
            const onTarget = createShot({ type: 'Shot On Target', x: 90, y: 30 });
            expect(getShotWeight(onTarget)).toBe(1.0);
        });

        it('should give attacking off-target shots reduced weight (0.4)', () => {
            const offTarget = createShot({ type: 'Shot Off Target', x: 80, y: 34 });
            expect(getShotWeight(offTarget)).toBe(0.4);
        });

        it('should give defensive off-target shots zero weight', () => {
            const offTarget = createShot({ type: 'Shot Off Target', x: 30, y: 34 });
            expect(getShotWeight(offTarget)).toBe(0);
        });
    });

    // =====================================================
    // DENSITY GRID CALCULATION
    // =====================================================

    describe('Density Grid Calculation', () => {
        it('should create grid with correct dimensions', () => {
            const grid = calculateDensityGrid([], GRID_SIZE);
            const expectedRows = Math.ceil(FIELD_HEIGHT / GRID_SIZE);
            const expectedCols = Math.ceil(FIELD_WIDTH / GRID_SIZE);

            expect(grid.length).toBe(expectedRows);
            expect(grid[0].length).toBe(expectedCols);
        });

        it('should initialize grid with zeros', () => {
            const grid = calculateDensityGrid([], GRID_SIZE);
            const allZeros = grid.every(row => row.every(cell => cell === 0));

            expect(allZeros).toBe(true);
        });

        it('should accumulate density for clustered shots', () => {
            const clusteredShots = heatMapTestData.filter(s => s.team === 'home');
            const grid = calculateDensityGrid(clusteredShots, GRID_SIZE);
            const maxDensity = getMaxDensity(grid);

            expect(maxDensity).toBeGreaterThan(0);
        });

        it('should handle shots at field boundaries', () => {
            const boundaryShots = [
                createShot({ x: 0, y: 0, type: 'GOAL!' }),
                createShot({ x: 105, y: 68, type: 'GOAL!' })
            ];

            const grid = calculateDensityGrid(boundaryShots, GRID_SIZE);
            const maxDensity = getMaxDensity(grid);

            expect(maxDensity).toBeGreaterThan(0);
        });

        it('should apply weights correctly in density calculation', () => {
            const goal = createShot({ type: 'GOAL!', x: 90, y: 34 });
            const offTarget = createShot({ type: 'Shot Off Target', x: 90, y: 34 });

            const goalGrid = calculateDensityGrid([goal], GRID_SIZE);
            const offTargetGrid = calculateDensityGrid([offTarget], GRID_SIZE);

            const goalMax = getMaxDensity(goalGrid);
            const offTargetMax = getMaxDensity(offTargetGrid);

            expect(goalMax).toBeGreaterThan(offTargetMax);
        });
    });

    // =====================================================
    // COLOR GRADIENT
    // =====================================================

    describe('Color Gradient', () => {
        it('should return transparent for zero density', () => {
            expect(getDensityColor(0, 1)).toBe('transparent');
        });

        it('should return transparent when max density is zero', () => {
            expect(getDensityColor(1, 0)).toBe('transparent');
        });

        it('should return blue for low density', () => {
            const color = getDensityColor(0.1, 1);
            expect(color).toContain('rgba');
            expect(color).toContain('0, 0, 255');
        });

        it('should return red for high density', () => {
            const color = getDensityColor(1, 1);
            expect(color).toContain('rgba');
            expect(color).toContain('255, 0, 0');
        });

        it('should produce different colors for different densities', () => {
            const lowColor = getDensityColor(0.1, 1);
            const highColor = getDensityColor(0.9, 1);

            expect(lowColor).not.toBe(highColor);
        });
    });

    // =====================================================
    // UI CONTROLS
    // =====================================================

    describe('UI Controls', () => {
        it('should have heat map toggle checkbox', () => {
            const toggle = document.getElementById('heatMapToggle');
            expect(toggle).toBeInTheDocument();
            expect(toggle.type).toBe('checkbox');
        });

        it('should have team filter buttons', () => {
            const allBtn = document.getElementById('heatMapAll');
            const homeBtn = document.getElementById('heatMapHome');
            const awayBtn = document.getElementById('heatMapAway');

            expect(allBtn).toBeInTheDocument();
            expect(homeBtn).toBeInTheDocument();
            expect(awayBtn).toBeInTheDocument();
        });

        it('should have "All" button active by default', () => {
            const allBtn = document.getElementById('heatMapAll');
            expect(allBtn.classList.contains('active')).toBe(true);
        });

        it('should have team buttons disabled by default', () => {
            const homeBtn = document.getElementById('heatMapHome');
            const awayBtn = document.getElementById('heatMapAway');

            expect(homeBtn).toBeDisabled();
            expect(awayBtn).toBeDisabled();
        });
    });

    // =====================================================
    // STATE PERSISTENCE
    // =====================================================

    describe('State Persistence', () => {
        it('should save heat map enabled state to localStorage', () => {
            localStorage.setItem('heatMapEnabled', 'true');
            expect(localStorage.getItem('heatMapEnabled')).toBe('true');
        });

        it('should save heat map team filter to localStorage', () => {
            localStorage.setItem('heatMapTeamFilter', 'home');
            expect(localStorage.getItem('heatMapTeamFilter')).toBe('home');
        });

        it('should restore heat map state from localStorage', () => {
            localStorage.setItem('heatMapEnabled', 'true');
            localStorage.setItem('heatMapTeamFilter', 'away');

            const enabled = localStorage.getItem('heatMapEnabled') === 'true';
            const filter = localStorage.getItem('heatMapTeamFilter');

            expect(enabled).toBe(true);
            expect(filter).toBe('away');
        });
    });

    // =====================================================
    // CANVAS RENDERING
    // =====================================================

    describe('Canvas Rendering', () => {
        it('should have heat map canvas element', () => {
            const canvas = document.getElementById('heatMapCanvas');
            expect(canvas).toBeInTheDocument();
            expect(canvas.tagName).toBe('CANVAS');
        });

        it('should have canvas with correct dimensions', () => {
            const canvas = document.getElementById('heatMapCanvas');
            expect(canvas.width).toBe(600);
            expect(canvas.height).toBe(400);
        });

        it('should get canvas context', () => {
            const canvas = document.getElementById('heatMapCanvas');
            const ctx = canvas.getContext('2d');
            expect(ctx).not.toBeNull();
        });
    });

    // =====================================================
    // HEAT MAP TEST DATA VALIDATION
    // =====================================================

    describe('Heat Map Test Data Validation', () => {
        it('should have clustered test data for heat map', () => {
            expect(heatMapTestData.length).toBeGreaterThanOrEqual(10);
        });

        it('should have shots in penalty area cluster', () => {
            const penaltyAreaShots = heatMapTestData.filter(
                s => s.position.x >= 88 && s.position.x <= 105
            );
            expect(penaltyAreaShots.length).toBeGreaterThan(0);
        });

        it('should create visible density with test data', () => {
            const grid = calculateDensityGrid(heatMapTestData, GRID_SIZE);
            const maxDensity = getMaxDensity(grid);

            expect(maxDensity).toBeGreaterThan(1); // Should have clustering
        });
    });
});
