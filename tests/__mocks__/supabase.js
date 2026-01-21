/**
 * Supabase Client Mock
 * Provides a complete mock of the Supabase client for testing
 */

import { jest } from '@jest/globals';
import { mockGame, mockEmptyGame } from '../fixtures/mockShots.js';

// Track mock state
let mockGames = [mockGame];
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
 * Reset all mocks to default state
 */
export function resetMocks() {
    mockGames = [mockGame];
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

// Database query builder mock
const createQueryBuilder = (tableName) => {
    let filters = {};
    let orderByColumn = null;
    let orderAscending = true;

    const queryBuilder = {
        select: jest.fn().mockImplementation((columns = '*') => {
            return queryBuilder;
        }),

        insert: jest.fn().mockImplementation(async (data) => {
            if (mockDelay) await delay(mockDelay);

            if (mockError) {
                return { data: null, error: mockError };
            }

            const newRecord = Array.isArray(data) ? data[0] : data;
            const recordWithId = {
                ...newRecord,
                id: `new-${Date.now()}`,
                created_at: new Date().toISOString()
            };

            mockGames.unshift(recordWithId);

            return {
                data: [recordWithId],
                error: null,
                select: () => Promise.resolve({ data: [recordWithId], error: null })
            };
        }),

        update: jest.fn().mockImplementation(async (data) => {
            if (mockDelay) await delay(mockDelay);

            if (mockError) {
                return { data: null, error: mockError };
            }

            return { data: [data], error: null };
        }),

        delete: jest.fn().mockImplementation(async () => {
            if (mockDelay) await delay(mockDelay);

            if (mockError) {
                return { data: null, error: mockError };
            }

            // Remove filtered games
            if (filters.user_id) {
                mockGames = mockGames.filter(g => g.user_id !== filters.user_id);
            }

            return { data: [], error: null };
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

        order: jest.fn().mockImplementation((column, { ascending = true } = {}) => {
            orderByColumn = column;
            orderAscending = ascending;
            return queryBuilder;
        }),

        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),

        // Execute query and return results
        then: jest.fn().mockImplementation(async (resolve) => {
            if (mockDelay) await delay(mockDelay);

            if (mockError) {
                return resolve({ data: null, error: mockError });
            }

            let results = [...mockGames];

            // Apply filters
            if (filters.user_id) {
                results = results.filter(g => g.user_id === filters.user_id);
            }

            // Apply ordering
            if (orderByColumn) {
                results.sort((a, b) => {
                    const aVal = a[orderByColumn];
                    const bVal = b[orderByColumn];
                    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    return orderAscending ? comparison : -comparison;
                });
            }

            // Reset filters for next query
            filters = {};

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
