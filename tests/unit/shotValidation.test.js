/**
 * Shot Validation Tests
 * Tests for validating shot data structure and coordinates
 */

import {
    createShot,
    smallDataset,
    invalidShots,
    boundaryShots
} from '../fixtures/mockShots.js';

describe('Shot Validation', () => {
    // =====================================================
    // VALID SHOT STRUCTURE
    // =====================================================

    describe('Valid Shot Structure', () => {
        it('should have all required properties', () => {
            const shot = createShot();

            expect(shot).toHaveProperty('team');
            expect(shot).toHaveProperty('teamName');
            expect(shot).toHaveProperty('type');
            expect(shot).toHaveProperty('half');
            expect(shot).toHaveProperty('gameTime');
            expect(shot).toHaveProperty('clockSeconds');
            expect(shot).toHaveProperty('position');
            expect(shot.position).toHaveProperty('x');
            expect(shot.position).toHaveProperty('y');
        });

        it('should create valid shot using custom matcher', () => {
            const shot = createShot();
            expect(shot).toBeValidShot();
        });

        it('should accept home team', () => {
            const shot = createShot({ team: 'home' });
            expect(shot.team).toBe('home');
            expect(shot.teamName).toBe('Home Team');
        });

        it('should accept away team', () => {
            const shot = createShot({ team: 'away' });
            expect(shot.team).toBe('away');
            expect(shot.teamName).toBe('Away Team');
        });

        it('should accept all valid shot types', () => {
            const goalShot = createShot({ type: 'GOAL!' });
            const onTargetShot = createShot({ type: 'Shot On Target' });
            const offTargetShot = createShot({ type: 'Shot Off Target' });

            expect(goalShot.type).toBe('GOAL!');
            expect(onTargetShot.type).toBe('Shot On Target');
            expect(offTargetShot.type).toBe('Shot Off Target');
        });

        it('should accept both halves', () => {
            const firstHalf = createShot({ half: '1st Half' });
            const secondHalf = createShot({ half: '2nd Half' });

            expect(firstHalf.half).toBe('1st Half');
            expect(secondHalf.half).toBe('2nd Half');
        });
    });

    // =====================================================
    // COORDINATE VALIDATION
    // =====================================================

    describe('Coordinate Validation', () => {
        it('should accept coordinates within field bounds', () => {
            const shot = createShot({ x: 50, y: 34 });
            expect(shot).toBeWithinFieldBounds();
        });

        it('should accept coordinates at field boundaries', () => {
            boundaryShots.forEach(shot => {
                expect(shot).toBeWithinFieldBounds();
            });
        });

        it('should accept coordinates at corners', () => {
            const topLeft = createShot({ x: 0, y: 0 });
            const topRight = createShot({ x: 105, y: 0 });
            const bottomLeft = createShot({ x: 0, y: 68 });
            const bottomRight = createShot({ x: 105, y: 68 });

            expect(topLeft).toBeWithinFieldBounds();
            expect(topRight).toBeWithinFieldBounds();
            expect(bottomLeft).toBeWithinFieldBounds();
            expect(bottomRight).toBeWithinFieldBounds();
        });

        it('should accept coordinates at center of field', () => {
            const centerShot = createShot({ x: 52.5, y: 34 });
            expect(centerShot.position.x).toBe(52.5);
            expect(centerShot.position.y).toBe(34);
        });

        it('should accept decimal coordinates', () => {
            const shot = createShot({ x: 92.75, y: 33.5 });
            expect(shot.position.x).toBe(92.75);
            expect(shot.position.y).toBe(33.5);
        });
    });

    // =====================================================
    // POSITION VALIDATION HELPER FUNCTION
    // =====================================================

    describe('Position Validation Helper', () => {
        // This simulates what the app should do to validate positions
        const isValidPosition = (position) => {
            if (!position) return false;
            if (typeof position.x !== 'number' || typeof position.y !== 'number') return false;
            if (isNaN(position.x) || isNaN(position.y)) return false;
            if (position.x < 0 || position.x > 105) return false;
            if (position.y < 0 || position.y > 68) return false;
            return true;
        };

        it('should validate correct positions', () => {
            expect(isValidPosition({ x: 50, y: 34 })).toBe(true);
            expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
            expect(isValidPosition({ x: 105, y: 68 })).toBe(true);
        });

        it('should reject null position', () => {
            expect(isValidPosition(null)).toBe(false);
        });

        it('should reject undefined position', () => {
            expect(isValidPosition(undefined)).toBe(false);
        });

        it('should reject non-numeric x coordinate', () => {
            expect(isValidPosition({ x: 'invalid', y: 34 })).toBe(false);
        });

        it('should reject NaN coordinates', () => {
            expect(isValidPosition({ x: NaN, y: 34 })).toBe(false);
            expect(isValidPosition({ x: 50, y: NaN })).toBe(false);
        });

        it('should reject out of bounds x coordinate (negative)', () => {
            expect(isValidPosition({ x: -10, y: 34 })).toBe(false);
        });

        it('should reject out of bounds x coordinate (too large)', () => {
            expect(isValidPosition({ x: 110, y: 34 })).toBe(false);
        });

        it('should reject out of bounds y coordinate (negative)', () => {
            expect(isValidPosition({ x: 50, y: -5 })).toBe(false);
        });

        it('should reject out of bounds y coordinate (too large)', () => {
            expect(isValidPosition({ x: 50, y: 100 })).toBe(false);
        });
    });

    // =====================================================
    // SHOT TYPE CLASSIFICATION
    // =====================================================

    describe('Shot Type Classification', () => {
        const isGoal = (shot) => shot.type === 'GOAL!';
        const isOnTarget = (shot) => shot.type === 'Shot On Target' || shot.type === 'GOAL!';
        const isOffTarget = (shot) => shot.type === 'Shot Off Target';

        it('should correctly identify goals', () => {
            const goal = createShot({ type: 'GOAL!' });
            expect(isGoal(goal)).toBe(true);
            expect(isOnTarget(goal)).toBe(true);
            expect(isOffTarget(goal)).toBe(false);
        });

        it('should correctly identify shots on target', () => {
            const onTarget = createShot({ type: 'Shot On Target' });
            expect(isGoal(onTarget)).toBe(false);
            expect(isOnTarget(onTarget)).toBe(true);
            expect(isOffTarget(onTarget)).toBe(false);
        });

        it('should correctly identify shots off target', () => {
            const offTarget = createShot({ type: 'Shot Off Target' });
            expect(isGoal(offTarget)).toBe(false);
            expect(isOnTarget(offTarget)).toBe(false);
            expect(isOffTarget(offTarget)).toBe(true);
        });
    });

    // =====================================================
    // GAME TIME VALIDATION
    // =====================================================

    describe('Game Time Validation', () => {
        const isValidGameTime = (gameTime) => {
            if (typeof gameTime !== 'string') return false;
            const match = gameTime.match(/^(\d{1,2}):(\d{2})$/);
            if (!match) return false;
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            return minutes >= 0 && minutes <= 90 && seconds >= 0 && seconds < 60;
        };

        it('should accept valid game times', () => {
            expect(isValidGameTime('00:00')).toBe(true);
            expect(isValidGameTime('15:30')).toBe(true);
            expect(isValidGameTime('45:00')).toBe(true);
            expect(isValidGameTime('90:00')).toBe(true);
        });

        it('should accept single-digit minutes', () => {
            expect(isValidGameTime('5:30')).toBe(true);
        });

        it('should reject invalid formats', () => {
            expect(isValidGameTime('invalid')).toBe(false);
            expect(isValidGameTime('15')).toBe(false);
            expect(isValidGameTime('15:3')).toBe(false);
            expect(isValidGameTime('15:300')).toBe(false);
        });

        it('should reject times beyond 90 minutes', () => {
            expect(isValidGameTime('91:00')).toBe(false);
            expect(isValidGameTime('120:00')).toBe(false);
        });

        it('should reject invalid seconds', () => {
            expect(isValidGameTime('15:60')).toBe(false);
            expect(isValidGameTime('15:99')).toBe(false);
        });
    });

    // =====================================================
    // CLOCK SECONDS VALIDATION
    // =====================================================

    describe('Clock Seconds Validation', () => {
        const isValidClockSeconds = (seconds) => {
            return typeof seconds === 'number' &&
                   !isNaN(seconds) &&
                   seconds >= 0 &&
                   seconds <= 5400;  // 90 minutes max
        };

        it('should accept valid clock seconds', () => {
            expect(isValidClockSeconds(0)).toBe(true);
            expect(isValidClockSeconds(930)).toBe(true);  // 15:30
            expect(isValidClockSeconds(2700)).toBe(true); // 45:00
            expect(isValidClockSeconds(5400)).toBe(true); // 90:00
        });

        it('should reject negative seconds', () => {
            expect(isValidClockSeconds(-1)).toBe(false);
        });

        it('should reject seconds beyond 90 minutes', () => {
            expect(isValidClockSeconds(5401)).toBe(false);
            expect(isValidClockSeconds(7200)).toBe(false);
        });

        it('should reject non-numeric values', () => {
            expect(isValidClockSeconds('invalid')).toBe(false);
            expect(isValidClockSeconds(NaN)).toBe(false);
            expect(isValidClockSeconds(null)).toBe(false);
        });
    });
});
