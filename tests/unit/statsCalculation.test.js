/**
 * Stats Calculation Tests
 * Tests for calculating shot statistics from shot data
 */

import {
    createShot,
    smallDataset,
    mediumDataset,
    statsTestData,
    emptyShots
} from '../fixtures/mockShots.js';

// =====================================================
// STATS CALCULATION HELPER FUNCTIONS
// These simulate the app's stats calculation logic
// =====================================================

function calculateTeamStats(shots, team) {
    const teamShots = shots.filter(s => s.team === team);

    const goals = teamShots.filter(s => s.type === 'GOAL!').length;
    const onTarget = teamShots.filter(s => s.type === 'Shot On Target').length;
    const offTarget = teamShots.filter(s => s.type === 'Shot Off Target').length;

    return {
        goals,
        onTarget: goals + onTarget, // Goals count as on target
        offTarget,
        total: teamShots.length
    };
}

function calculateHalfStats(shots, team, half) {
    const filteredShots = shots.filter(s => s.team === team && s.half === half);

    const goals = filteredShots.filter(s => s.type === 'GOAL!').length;
    const onTarget = filteredShots.filter(s => s.type === 'Shot On Target').length;
    const offTarget = filteredShots.filter(s => s.type === 'Shot Off Target').length;

    return { goals, onTarget, offTarget };
}

function calculateTotalStats(shots) {
    return {
        home: calculateTeamStats(shots, 'home'),
        away: calculateTeamStats(shots, 'away'),
        total: shots.length
    };
}

describe('Stats Calculation', () => {
    // =====================================================
    // BASIC STATS CALCULATION
    // =====================================================

    describe('Basic Stats Calculation', () => {
        it('should calculate correct stats for empty dataset', () => {
            const stats = calculateTotalStats(emptyShots);

            expect(stats.home.goals).toBe(0);
            expect(stats.home.onTarget).toBe(0);
            expect(stats.home.offTarget).toBe(0);
            expect(stats.home.total).toBe(0);
            expect(stats.away.goals).toBe(0);
            expect(stats.away.onTarget).toBe(0);
            expect(stats.away.offTarget).toBe(0);
            expect(stats.away.total).toBe(0);
            expect(stats.total).toBe(0);
        });

        it('should calculate correct stats for small dataset', () => {
            const stats = calculateTotalStats(smallDataset);

            // Small dataset has:
            // Home: 1 goal, 1 on target, 1 off target = 3 shots
            // Away: 1 goal, 1 on target = 2 shots
            expect(stats.home.goals).toBe(1);
            expect(stats.home.onTarget).toBe(2); // 1 goal + 1 on target
            expect(stats.home.offTarget).toBe(1);
            expect(stats.home.total).toBe(3);

            expect(stats.away.goals).toBe(1);
            expect(stats.away.onTarget).toBe(2); // 1 goal + 1 on target
            expect(stats.away.offTarget).toBe(0);
            expect(stats.away.total).toBe(2);
        });

        it('should calculate correct stats using test fixture data', () => {
            const stats = calculateTotalStats(statsTestData.shots);

            expect(stats.home.goals).toBe(statsTestData.expected.home.goals);
            expect(stats.home.onTarget).toBe(statsTestData.expected.home.onTarget);
            expect(stats.home.offTarget).toBe(statsTestData.expected.home.offTarget);
            expect(stats.home.total).toBe(statsTestData.expected.home.total);

            expect(stats.away.goals).toBe(statsTestData.expected.away.goals);
            expect(stats.away.onTarget).toBe(statsTestData.expected.away.onTarget);
            expect(stats.away.offTarget).toBe(statsTestData.expected.away.offTarget);
            expect(stats.away.total).toBe(statsTestData.expected.away.total);
        });
    });

    // =====================================================
    // TEAM-SPECIFIC STATS
    // =====================================================

    describe('Team-Specific Stats', () => {
        it('should calculate home team stats correctly', () => {
            const homeStats = calculateTeamStats(mediumDataset, 'home');

            // Medium dataset home team: 3 goals, 3 on target, 2 off target
            expect(homeStats.goals).toBe(3);
            expect(homeStats.onTarget).toBe(6); // 3 goals + 3 on target
            expect(homeStats.offTarget).toBe(2);
            expect(homeStats.total).toBe(8);
        });

        it('should calculate away team stats correctly', () => {
            const awayStats = calculateTeamStats(mediumDataset, 'away');

            // Medium dataset away team: 2 goals, 3 on target, 2 off target
            expect(awayStats.goals).toBe(2);
            expect(awayStats.onTarget).toBe(5); // 2 goals + 3 on target
            expect(awayStats.offTarget).toBe(2);
            expect(awayStats.total).toBe(7);
        });

        it('should return zero stats for non-existent team', () => {
            const stats = calculateTeamStats(smallDataset, 'invalid');

            expect(stats.goals).toBe(0);
            expect(stats.onTarget).toBe(0);
            expect(stats.offTarget).toBe(0);
            expect(stats.total).toBe(0);
        });
    });

    // =====================================================
    // HALF-SPECIFIC STATS
    // =====================================================

    describe('Half-Specific Stats', () => {
        it('should calculate first half stats correctly', () => {
            const firstHalfHome = calculateHalfStats(mediumDataset, 'home', '1st Half');

            // Medium dataset home 1st half: 2 goals, 2 on target, 1 off target
            expect(firstHalfHome.goals).toBe(2);
            expect(firstHalfHome.onTarget).toBe(2);
            expect(firstHalfHome.offTarget).toBe(1);
        });

        it('should calculate second half stats correctly', () => {
            const secondHalfHome = calculateHalfStats(mediumDataset, 'home', '2nd Half');

            // Medium dataset home 2nd half: 1 goal, 1 on target, 1 off target
            expect(secondHalfHome.goals).toBe(1);
            expect(secondHalfHome.onTarget).toBe(1);
            expect(secondHalfHome.offTarget).toBe(1);
        });

        it('should calculate away team half stats correctly', () => {
            const firstHalfAway = calculateHalfStats(mediumDataset, 'away', '1st Half');
            const secondHalfAway = calculateHalfStats(mediumDataset, 'away', '2nd Half');

            // First half: 1 goal, 1 on target, 1 off target
            expect(firstHalfAway.goals).toBe(1);
            expect(firstHalfAway.onTarget).toBe(1);
            expect(firstHalfAway.offTarget).toBe(1);

            // Second half: 1 goal, 2 on target, 1 off target
            expect(secondHalfAway.goals).toBe(1);
            expect(secondHalfAway.onTarget).toBe(2);
            expect(secondHalfAway.offTarget).toBe(1);
        });
    });

    // =====================================================
    // SHOT TYPE COUNTING
    // =====================================================

    describe('Shot Type Counting', () => {
        it('should count goals correctly', () => {
            const shots = [
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot Off Target' })
            ];

            const goalCount = shots.filter(s => s.type === 'GOAL!').length;
            expect(goalCount).toBe(2);
        });

        it('should count shots on target correctly (excluding goals)', () => {
            const shots = [
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot Off Target' })
            ];

            const onTargetCount = shots.filter(s => s.type === 'Shot On Target').length;
            expect(onTargetCount).toBe(2);
        });

        it('should count all on-target shots (including goals)', () => {
            const shots = [
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot Off Target' })
            ];

            const allOnTarget = shots.filter(s =>
                s.type === 'GOAL!' || s.type === 'Shot On Target'
            ).length;
            expect(allOnTarget).toBe(3);
        });

        it('should count shots off target correctly', () => {
            const shots = [
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot Off Target' }),
                createShot({ type: 'Shot Off Target' }),
                createShot({ type: 'Shot Off Target' })
            ];

            const offTargetCount = shots.filter(s => s.type === 'Shot Off Target').length;
            expect(offTargetCount).toBe(3);
        });
    });

    // =====================================================
    // SHOT ACCURACY CALCULATIONS
    // =====================================================

    describe('Shot Accuracy Calculations', () => {
        const calculateAccuracy = (shots) => {
            if (shots.length === 0) return 0;
            const onTarget = shots.filter(s =>
                s.type === 'GOAL!' || s.type === 'Shot On Target'
            ).length;
            return (onTarget / shots.length) * 100;
        };

        it('should calculate 100% accuracy when all shots on target', () => {
            const shots = [
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'GOAL!' })
            ];

            expect(calculateAccuracy(shots)).toBe(100);
        });

        it('should calculate 0% accuracy when all shots off target', () => {
            const shots = [
                createShot({ type: 'Shot Off Target' }),
                createShot({ type: 'Shot Off Target' }),
                createShot({ type: 'Shot Off Target' })
            ];

            expect(calculateAccuracy(shots)).toBe(0);
        });

        it('should calculate mixed accuracy correctly', () => {
            const shots = [
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot Off Target' }),
                createShot({ type: 'Shot Off Target' })
            ];

            expect(calculateAccuracy(shots)).toBe(50);
        });

        it('should return 0 for empty shot array', () => {
            expect(calculateAccuracy([])).toBe(0);
        });
    });

    // =====================================================
    // CONVERSION RATE CALCULATIONS
    // =====================================================

    describe('Conversion Rate Calculations', () => {
        const calculateConversionRate = (shots) => {
            if (shots.length === 0) return 0;
            const goals = shots.filter(s => s.type === 'GOAL!').length;
            return (goals / shots.length) * 100;
        };

        it('should calculate 100% conversion when all shots are goals', () => {
            const shots = [
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'GOAL!' })
            ];

            expect(calculateConversionRate(shots)).toBe(100);
        });

        it('should calculate 0% conversion when no goals', () => {
            const shots = [
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot Off Target' })
            ];

            expect(calculateConversionRate(shots)).toBe(0);
        });

        it('should calculate partial conversion rate correctly', () => {
            const shots = [
                createShot({ type: 'GOAL!' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot On Target' }),
                createShot({ type: 'Shot Off Target' })
            ];

            expect(calculateConversionRate(shots)).toBe(25);
        });

        it('should handle single goal shot', () => {
            const shots = [createShot({ type: 'GOAL!' })];
            expect(calculateConversionRate(shots)).toBe(100);
        });
    });

    // =====================================================
    // SCORE CALCULATION
    // =====================================================

    describe('Score Calculation', () => {
        it('should calculate final score from shots', () => {
            const homeGoals = mediumDataset.filter(
                s => s.team === 'home' && s.type === 'GOAL!'
            ).length;
            const awayGoals = mediumDataset.filter(
                s => s.team === 'away' && s.type === 'GOAL!'
            ).length;

            expect(homeGoals).toBe(3);
            expect(awayGoals).toBe(2);
        });

        it('should identify winner correctly', () => {
            const homeGoals = mediumDataset.filter(
                s => s.team === 'home' && s.type === 'GOAL!'
            ).length;
            const awayGoals = mediumDataset.filter(
                s => s.team === 'away' && s.type === 'GOAL!'
            ).length;

            const winner = homeGoals > awayGoals ? 'home' :
                          awayGoals > homeGoals ? 'away' : 'draw';

            expect(winner).toBe('home');
        });

        it('should identify draw when scores are equal', () => {
            const shots = [
                createShot({ team: 'home', type: 'GOAL!' }),
                createShot({ team: 'away', type: 'GOAL!' })
            ];

            const homeGoals = shots.filter(s => s.team === 'home' && s.type === 'GOAL!').length;
            const awayGoals = shots.filter(s => s.team === 'away' && s.type === 'GOAL!').length;

            const winner = homeGoals > awayGoals ? 'home' :
                          awayGoals > homeGoals ? 'away' : 'draw';

            expect(winner).toBe('draw');
        });
    });
});
