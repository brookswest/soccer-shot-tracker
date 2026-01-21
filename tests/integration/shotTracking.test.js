/**
 * Shot Tracking Integration Tests
 * Tests for shot creation, display, and undo functionality
 */

import { fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import {
    createShot,
    smallDataset,
    mediumDataset,
    mockGame
} from '../fixtures/mockShots.js';

// =====================================================
// DOM SETUP HELPERS
// =====================================================

function createShotTrackerDOM() {
    document.body.innerHTML = `
        <div id="app">
            <!-- Header with team info -->
            <div class="team-header" id="homeTeamHeader">
                <span class="team-name">Home Team</span>
                <span class="score" id="homeScore">0</span>
            </div>
            <div class="team-header" id="awayTeamHeader">
                <span class="team-name">Away Team</span>
                <span class="score" id="awayScore">0</span>
            </div>

            <!-- Shot type buttons -->
            <div class="shot-buttons">
                <button id="goalBtn" data-type="GOAL!">Goal</button>
                <button id="onTargetBtn" data-type="Shot On Target">On Target</button>
                <button id="offTargetBtn" data-type="Shot Off Target">Off Target</button>
            </div>

            <!-- Soccer field canvas -->
            <div class="field-container">
                <canvas id="soccerField" width="600" height="400"></canvas>
            </div>

            <!-- Stats display -->
            <div class="stats-panel">
                <div id="homeStats">
                    <span id="homeGoals">0</span>
                    <span id="homeOnTarget">0</span>
                    <span id="homeOffTarget">0</span>
                </div>
                <div id="awayStats">
                    <span id="awayGoals">0</span>
                    <span id="awayOnTarget">0</span>
                    <span id="awayOffTarget">0</span>
                </div>
            </div>

            <!-- Shot log -->
            <div id="shotLog"></div>

            <!-- Undo button -->
            <button id="undoBtn" disabled>Undo</button>

            <!-- Game clock -->
            <div id="gameClock">00:00</div>
            <span id="currentHalf">1st Half</span>
        </div>
    `;

    return document.getElementById('app');
}

// Simulate game state
function createGameState() {
    return {
        shots: [],
        homeScore: 0,
        awayScore: 0,
        currentTeam: 'home',
        selectedType: null,
        currentHalf: '1st Half',
        clockSeconds: 0
    };
}

// Shot tracking functions (simulating app behavior)
function addShot(gameState, shot) {
    gameState.shots.push(shot);

    if (shot.type === 'GOAL!') {
        if (shot.team === 'home') {
            gameState.homeScore++;
        } else {
            gameState.awayScore++;
        }
    }

    updateUI(gameState);
    return gameState;
}

function undoLastShot(gameState) {
    const shot = gameState.shots.pop();

    if (shot && shot.type === 'GOAL!') {
        if (shot.team === 'home') {
            gameState.homeScore--;
        } else {
            gameState.awayScore--;
        }
    }

    updateUI(gameState);
    return shot;
}

function updateUI(gameState) {
    const homeScoreEl = document.getElementById('homeScore');
    const awayScoreEl = document.getElementById('awayScore');
    const undoBtn = document.getElementById('undoBtn');

    if (homeScoreEl) homeScoreEl.textContent = gameState.homeScore;
    if (awayScoreEl) awayScoreEl.textContent = gameState.awayScore;
    if (undoBtn) undoBtn.disabled = gameState.shots.length === 0;
}

function renderShotLog(shots) {
    const logEl = document.getElementById('shotLog');
    if (!logEl) return;

    logEl.innerHTML = shots.map((shot, index) => `
        <div class="shot-entry" data-index="${index}">
            <span class="shot-team">${shot.teamName}</span>
            <span class="shot-type">${shot.type}</span>
            <span class="shot-time">${shot.gameTime}</span>
        </div>
    `).join('');
}

describe('Shot Tracking Integration', () => {
    let app;
    let gameState;

    beforeEach(() => {
        app = createShotTrackerDOM();
        gameState = createGameState();
    });

    // =====================================================
    // SHOT CREATION
    // =====================================================

    describe('Shot Creation', () => {
        it('should add a shot to the game state', () => {
            const shot = createShot({ team: 'home', type: 'GOAL!' });
            addShot(gameState, shot);

            expect(gameState.shots).toHaveLength(1);
            expect(gameState.shots[0]).toEqual(shot);
        });

        it('should update score when goal is added', () => {
            const shot = createShot({ team: 'home', type: 'GOAL!' });
            addShot(gameState, shot);

            expect(gameState.homeScore).toBe(1);
            expect(gameState.awayScore).toBe(0);
        });

        it('should not update score for non-goal shots', () => {
            const onTarget = createShot({ team: 'home', type: 'Shot On Target' });
            const offTarget = createShot({ team: 'away', type: 'Shot Off Target' });

            addShot(gameState, onTarget);
            addShot(gameState, offTarget);

            expect(gameState.homeScore).toBe(0);
            expect(gameState.awayScore).toBe(0);
        });

        it('should update away score for away team goal', () => {
            const shot = createShot({ team: 'away', type: 'GOAL!' });
            addShot(gameState, shot);

            expect(gameState.homeScore).toBe(0);
            expect(gameState.awayScore).toBe(1);
        });

        it('should accumulate multiple shots', () => {
            smallDataset.forEach(shot => addShot(gameState, shot));

            expect(gameState.shots).toHaveLength(5);
            expect(gameState.homeScore).toBe(1); // 1 home goal
            expect(gameState.awayScore).toBe(1); // 1 away goal
        });
    });

    // =====================================================
    // UI UPDATES
    // =====================================================

    describe('UI Updates', () => {
        it('should update score display in DOM', () => {
            const shot = createShot({ team: 'home', type: 'GOAL!' });
            addShot(gameState, shot);

            const homeScoreEl = document.getElementById('homeScore');
            expect(homeScoreEl.textContent).toBe('1');
        });

        it('should enable undo button after adding shot', () => {
            const undoBtn = document.getElementById('undoBtn');
            expect(undoBtn).toBeDisabled();

            const shot = createShot({ team: 'home', type: 'Shot On Target' });
            addShot(gameState, shot);

            expect(undoBtn).not.toBeDisabled();
        });

        it('should disable undo button when no shots remain', () => {
            const shot = createShot({ team: 'home', type: 'Shot On Target' });
            addShot(gameState, shot);
            undoLastShot(gameState);

            const undoBtn = document.getElementById('undoBtn');
            expect(undoBtn).toBeDisabled();
        });
    });

    // =====================================================
    // UNDO FUNCTIONALITY
    // =====================================================

    describe('Undo Functionality', () => {
        it('should remove last shot from state', () => {
            const shot1 = createShot({ team: 'home', type: 'Shot On Target' });
            const shot2 = createShot({ team: 'away', type: 'Shot Off Target' });

            addShot(gameState, shot1);
            addShot(gameState, shot2);
            undoLastShot(gameState);

            expect(gameState.shots).toHaveLength(1);
            expect(gameState.shots[0]).toEqual(shot1);
        });

        it('should return the removed shot', () => {
            const shot = createShot({ team: 'home', type: 'GOAL!' });
            addShot(gameState, shot);

            const removed = undoLastShot(gameState);
            expect(removed).toEqual(shot);
        });

        it('should decrement score when undoing a goal', () => {
            const goal = createShot({ team: 'home', type: 'GOAL!' });
            addShot(gameState, goal);
            expect(gameState.homeScore).toBe(1);

            undoLastShot(gameState);
            expect(gameState.homeScore).toBe(0);
        });

        it('should not affect score when undoing non-goal shot', () => {
            const goal = createShot({ team: 'home', type: 'GOAL!' });
            const onTarget = createShot({ team: 'home', type: 'Shot On Target' });

            addShot(gameState, goal);
            addShot(gameState, onTarget);
            expect(gameState.homeScore).toBe(1);

            undoLastShot(gameState);
            expect(gameState.homeScore).toBe(1); // Still 1 after undoing on-target
        });

        it('should handle undoing away team goal', () => {
            const goal = createShot({ team: 'away', type: 'GOAL!' });
            addShot(gameState, goal);
            expect(gameState.awayScore).toBe(1);

            undoLastShot(gameState);
            expect(gameState.awayScore).toBe(0);
        });

        it('should handle undo on empty state gracefully', () => {
            const removed = undoLastShot(gameState);
            expect(removed).toBeUndefined();
            expect(gameState.shots).toHaveLength(0);
        });
    });

    // =====================================================
    // SHOT LOG DISPLAY
    // =====================================================

    describe('Shot Log Display', () => {
        it('should render shots in the log', () => {
            renderShotLog(smallDataset);

            const logEl = document.getElementById('shotLog');
            const entries = logEl.querySelectorAll('.shot-entry');

            expect(entries).toHaveLength(5);
        });

        it('should display shot team name', () => {
            renderShotLog([createShot({ team: 'home' })]);

            const teamEl = document.querySelector('.shot-team');
            expect(teamEl.textContent).toBe('Home Team');
        });

        it('should display shot type', () => {
            renderShotLog([createShot({ type: 'GOAL!' })]);

            const typeEl = document.querySelector('.shot-type');
            expect(typeEl.textContent).toBe('GOAL!');
        });

        it('should display shot time', () => {
            renderShotLog([createShot({ gameTime: '25:30' })]);

            const timeEl = document.querySelector('.shot-time');
            expect(timeEl.textContent).toBe('25:30');
        });

        it('should handle empty shot log', () => {
            renderShotLog([]);

            const logEl = document.getElementById('shotLog');
            expect(logEl.innerHTML).toBe('');
        });
    });

    // =====================================================
    // TEAM SELECTION
    // =====================================================

    describe('Team Selection', () => {
        it('should default to home team', () => {
            expect(gameState.currentTeam).toBe('home');
        });

        it('should switch teams correctly', () => {
            gameState.currentTeam = 'away';
            expect(gameState.currentTeam).toBe('away');

            gameState.currentTeam = 'home';
            expect(gameState.currentTeam).toBe('home');
        });

        it('should create shot for current team', () => {
            gameState.currentTeam = 'away';
            const shot = createShot({ team: gameState.currentTeam });

            expect(shot.team).toBe('away');
            expect(shot.teamName).toBe('Away Team');
        });
    });

    // =====================================================
    // SHOT TYPE SELECTION
    // =====================================================

    describe('Shot Type Selection', () => {
        it('should track selected shot type', () => {
            gameState.selectedType = 'GOAL!';
            expect(gameState.selectedType).toBe('GOAL!');
        });

        it('should create shot with selected type', () => {
            gameState.selectedType = 'Shot Off Target';
            const shot = createShot({ type: gameState.selectedType });

            expect(shot.type).toBe('Shot Off Target');
        });
    });

    // =====================================================
    // HALF TRACKING
    // =====================================================

    describe('Half Tracking', () => {
        it('should default to first half', () => {
            expect(gameState.currentHalf).toBe('1st Half');
        });

        it('should switch to second half', () => {
            gameState.currentHalf = '2nd Half';
            expect(gameState.currentHalf).toBe('2nd Half');
        });

        it('should record shot with current half', () => {
            gameState.currentHalf = '2nd Half';
            const shot = createShot({ half: gameState.currentHalf });

            expect(shot.half).toBe('2nd Half');
        });

        it('should have shots from both halves in medium dataset', () => {
            const firstHalfShots = mediumDataset.filter(s => s.half === '1st Half');
            const secondHalfShots = mediumDataset.filter(s => s.half === '2nd Half');

            expect(firstHalfShots.length).toBeGreaterThan(0);
            expect(secondHalfShots.length).toBeGreaterThan(0);
        });
    });

    // =====================================================
    // CLOCK AND TIMING
    // =====================================================

    describe('Clock and Timing', () => {
        it('should record shot timestamp', () => {
            const shot = createShot({ gameTime: '15:30', clockSeconds: 930 });

            expect(shot.gameTime).toBe('15:30');
            expect(shot.clockSeconds).toBe(930);
        });

        it('should format game time correctly', () => {
            const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            };

            expect(formatTime(0)).toBe('00:00');
            expect(formatTime(930)).toBe('15:30');
            expect(formatTime(2700)).toBe('45:00');
            expect(formatTime(5400)).toBe('90:00');
        });

        it('should update clock display', () => {
            const clockEl = document.getElementById('gameClock');
            clockEl.textContent = '45:00';

            expect(clockEl.textContent).toBe('45:00');
        });
    });

    // =====================================================
    // DATA PERSISTENCE INTEGRATION
    // =====================================================

    describe('Data Persistence Integration', () => {
        it('should save game state to localStorage', () => {
            const shot = createShot({ team: 'home', type: 'GOAL!' });
            addShot(gameState, shot);

            localStorage.setItem('currentGame', JSON.stringify(gameState));

            const saved = JSON.parse(localStorage.getItem('currentGame'));
            expect(saved.shots).toHaveLength(1);
            expect(saved.homeScore).toBe(1);
        });

        it('should restore game state from localStorage', () => {
            const savedState = {
                shots: smallDataset,
                homeScore: 1,
                awayScore: 1,
                currentTeam: 'away',
                currentHalf: '2nd Half'
            };

            localStorage.setItem('currentGame', JSON.stringify(savedState));

            const restored = JSON.parse(localStorage.getItem('currentGame'));
            expect(restored.shots).toHaveLength(5);
            expect(restored.homeScore).toBe(1);
            expect(restored.currentHalf).toBe('2nd Half');
        });

        it('should handle missing localStorage data', () => {
            const saved = localStorage.getItem('nonExistentKey');
            expect(saved).toBeNull();
        });
    });
});
