/**
 * Supabase Client Mock
 * Provides a complete mock of the Supabase client for testing
 */

import { jest } from '@jest/globals';
import { mockGame, mockEmptyGame } from '../fixtures/mockShots.js';
import { multipleRosters, u12EaglesPlayers, u14ThunderPlayers } from '../fixtures/mockRosters.js';

// Track mock state
let mockGames = [mockGame];
let mockRosters = [...multipleRosters];
let mockPlayers = [...u12EaglesPlayers, ...u14ThunderPlayers];
let mockUser = null;
let mockError = null;
let mockDelay = 0;

// =====================================================
// MOCK CONFIGURATION HELPERS
// =====================================================

/**
 * Set the mock to return specific games
 */
export function setMockGames(games) {
    mockGames = games;
}

/**
 * Set the mock to simulate a logged-in user
 */
export function setMockUser(user) {
    mockUser = user;
}

/**
 * Set the mock to simulate an error
 */
export function setMockError(error) {
    mockError = error;
}

/**
 * Set artificial delay for async operations (testing loading states)
 */
export function setMockDelay(delay) {
    mockDelay = delay;
}

/**
 * Set the mock to return specific rosters
 */
export function setMockRosters(rosters) {
    mockRosters = rosters;
}

/**
 * Set the mock to return specific players
 */
export function setMockPlayers(players) {
    mockPlayers = players;
}

/**
 * Get current mock rosters (for assertions)
 */
export function getMockRosters() {
    return mockRosters;
}

/**
 * Get current mock players (for assertions)
 */
export function getMockPlayers() {
    return mockPlayers;
}

/**
 * Reset all mocks to default state
 */
export function resetMocks() {
    mockGames = [mockGame];
    mockRosters = [...multipleRosters];
    mockPlayers = [...u12EaglesPlayers, ...u14ThunderPlayers];
    mockUser = null;
    mockError = null;
    mockDelay = 0;
}

// =====================================================
// MOCK USER
// =====================================================

export const mockAuthUser = {
    id: 'test-user-uuid-12345',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00.000Z',
    user_metadata: {
        name: 'Test User'
    }
};

// =====================================================
// SUPABASE CLIENT MOCK
// =====================================================

// Helper to simulate async delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Auth mock
const authMock = {
    signInWithPassword: jest.fn().mockImplementation(async ({ email, password }) => {
        if (mockDelay) await delay(mockDelay);

        if (mockError) {
            return { data: null, error: mockError };
        }

        if (email === 'invalid@example.com') {
            return {
                data: null,
                error: { message: 'Invalid login credentials' }
            };
        }

        mockUser = mockAuthUser;
        return {
            data: { user: mockAuthUser, session: { access_token: 'mock-token' } },
            error: null
        };
    }),

    signUp: jest.fn().mockImplementation(async ({ email, password }) => {
        if (mockDelay) await delay(mockDelay);

        if (mockError) {
            return { data: null, error: mockError };
        }

        if (email === 'existing@example.com') {
            return {
                data: null,
                error: { message: 'User already registered' }
            };
        }

        return {
            data: { user: mockAuthUser, session: null },
            error: null
        };
    }),

    signOut: jest.fn().mockImplementation(async () => {
        if (mockDelay) await delay(mockDelay);
        mockUser = null;
        return { error: null };
    }),

    getSession: jest.fn().mockImplementation(async () => {
        if (mockDelay) await delay(mockDelay);

        if (mockUser) {
            return {
                data: {
                    session: {
                        user: mockUser,
                        access_token: 'mock-token'
                    }
                },
                error: null
            };
        }

        return { data: { session: null }, error: null };
    }),

    onAuthStateChange: jest.fn().mockImplementation((callback) => {
        // Immediately call with current state
        if (mockUser) {
            callback('SIGNED_IN', { user: mockUser });
        } else {
            callback('SIGNED_OUT', null);
        }

        // Return unsubscribe function
        return {
            data: {
                subscription: {
                    unsubscribe: jest.fn()
                }
            }
        };
    })
};

// Helper to get mock data by table name
function getMockDataForTable(tableName) {
    switch (tableName) {
        case 'games': return mockGames;
        case 'rosters': return mockRosters;
        case 'players': return mockPlayers;
        default: return [];
    }
}

// Helper to set mock data by table name
function setMockDataForTable(tableName, data) {
    switch (tableName) {
        case 'games': mockGames = data; break;
        case 'rosters': mockRosters = data; break;
        case 'players': mockPlayers = data; break;
    }
}

// Database query builder mock
const createQueryBuilder = (tableName) => {
    let filters = {};
    let orderByColumn = null;
    let orderAscending = true;
    let isSingle = false;

    const queryBuilder = {
        select: jest.fn().mockImplementation((columns = '*') => {
            return queryBuilder;
        }),

        insert: jest.fn().mockImplementation((data) => {
            const insertResult = {
                data: null,
                error: null,
                select: jest.fn().mockImplementation(() => ({
                    single: jest.fn().mockImplementation(async () => {
                        if (mockDelay) await delay(mockDelay);
                        if (mockError) return { data: null, error: mockError };

                        const newRecord = Array.isArray(data) ? data[0] : data;
                        const recordWithId = {
                            ...newRecord,
                            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };

                        const currentData = getMockDataForTable(tableName);
                        setMockDataForTable(tableName, [...currentData, recordWithId]);

                        return { data: recordWithId, error: null };
                    }),
                    then: async (resolve) => {
                        if (mockDelay) await delay(mockDelay);
                        if (mockError) return resolve({ data: null, error: mockError });

                        const newRecord = Array.isArray(data) ? data[0] : data;
                        const recordWithId = {
                            ...newRecord,
                            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };

                        const currentData = getMockDataForTable(tableName);
                        setMockDataForTable(tableName, [...currentData, recordWithId]);

                        return resolve({ data: [recordWithId], error: null });
                    }
                }))
            };
            return insertResult;
        }),

        update: jest.fn().mockImplementation((data) => {
            const updateBuilder = {
                eq: jest.fn().mockImplementation((column, value) => {
                    filters[column] = value;
                    return {
                        then: async (resolve) => {
                            if (mockDelay) await delay(mockDelay);
                            if (mockError) return resolve({ data: null, error: mockError });

                            const currentData = getMockDataForTable(tableName);
                            const updatedData = currentData.map(item => {
                                if (item[column] === value) {
                                    return { ...item, ...data, updated_at: new Date().toISOString() };
                                }
                                return item;
                            });
                            setMockDataForTable(tableName, updatedData);

                            return resolve({ data: [data], error: null });
                        }
                    };
                })
            };
            return updateBuilder;
        }),

        delete: jest.fn().mockImplementation(() => {
            const deleteBuilder = {
                eq: jest.fn().mockImplementation((column, value) => {
                    filters[column] = value;
                    return {
                        then: async (resolve) => {
                            if (mockDelay) await delay(mockDelay);
                            if (mockError) return resolve({ data: null, error: mockError });

                            const currentData = getMockDataForTable(tableName);
                            const filteredData = currentData.filter(item => item[column] !== value);
                            setMockDataForTable(tableName, filteredData);

                            // Also delete related data (e.g., players when roster is deleted)
                            if (tableName === 'rosters') {
                                mockPlayers = mockPlayers.filter(p => p.roster_id !== value);
                            }

                            return resolve({ data: [], error: null });
                        }
                    };
                })
            };
            return deleteBuilder;
        }),

        eq: jest.fn().mockImplementation((column, value) => {
            filters[column] = value;
            return queryBuilder;
        }),

        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),

        order: jest.fn().mockImplementation((column, { ascending = true, nullsFirst = false } = {}) => {
            orderByColumn = column;
            orderAscending = ascending;
            return queryBuilder;
        }),

        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
            isSingle = true;
            return queryBuilder;
        }),

        // Execute query and return results
        then: jest.fn().mockImplementation(async (resolve) => {
            if (mockDelay) await delay(mockDelay);

            if (mockError) {
                return resolve({ data: null, error: mockError });
            }

            let results = [...getMockDataForTable(tableName)];

            // Apply filters
            Object.keys(filters).forEach(key => {
                results = results.filter(item => item[key] === filters[key]);
            });

            // Apply ordering
            if (orderByColumn) {
                results.sort((a, b) => {
                    const aVal = a[orderByColumn];
                    const bVal = b[orderByColumn];
                    // Handle null values
                    if (aVal === null && bVal === null) return 0;
                    if (aVal === null) return 1;
                    if (bVal === null) return -1;
                    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    return orderAscending ? comparison : -comparison;
                });
            }

            // Reset state for next query
            filters = {};
            orderByColumn = null;
            orderAscending = true;

            if (isSingle) {
                isSingle = false;
                return resolve({ data: results[0] || null, error: null });
            }

            return resolve({ data: results, error: null });
        })
    };

    return queryBuilder;
};

// Main Supabase client mock
export const supabaseClient = {
    auth: authMock,
    from: jest.fn().mockImplementation((tableName) => createQueryBuilder(tableName))
};

// Mock the createClient function
export const createClient = jest.fn().mockReturnValue(supabaseClient);

// Default export for module mocking
export default {
    createClient,
    supabaseClient,
    setMockGames,
    setMockUser,
    setMockError,
    setMockDelay,
    resetMocks,
    mockAuthUser
};
