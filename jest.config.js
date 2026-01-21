/** @type {import('jest').Config} */
export default {
  // Use jsdom for DOM testing
  testEnvironment: 'jsdom',

  // Inject globals (jest, expect, etc.) - needed for ES modules
  injectGlobals: true,

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],

  // Module name mapping for mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**'
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    }
  },

  coverageReporters: ['text', 'lcov', 'html'],

  // Transform ES modules
  transform: {},

  // Handle ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase)/)'
  ],

  // Timeout for tests (in milliseconds)
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Verbose output
  verbose: true
};
