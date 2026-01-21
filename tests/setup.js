/**
 * Jest Setup File
 * Runs before each test file to configure the testing environment
 */

import { jest, beforeEach, afterEach, expect } from '@jest/globals';
import '@testing-library/jest-dom';

// =====================================================
// MOCK BROWSER APIs
// =====================================================

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: jest.fn((index) => Object.keys(store)[index] || null)
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
});

// Mock Wake Lock API
const wakeLockMock = {
    request: jest.fn().mockResolvedValue({
        released: false,
        release: jest.fn().mockResolvedValue(undefined),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })
};

Object.defineProperty(navigator, 'wakeLock', {
    value: wakeLockMock,
    writable: true
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock window.print
window.print = jest.fn();

// Mock window.open
window.open = jest.fn().mockReturnValue({
    document: {
        write: jest.fn(),
        close: jest.fn()
    },
    focus: jest.fn(),
    print: jest.fn(),
    close: jest.fn()
});

// Mock getBoundingClientRect for canvas operations
Element.prototype.getBoundingClientRect = jest.fn().mockReturnValue({
    width: 600,
    height: 400,
    top: 0,
    left: 0,
    bottom: 400,
    right: 600,
    x: 0,
    y: 0,
    toJSON: jest.fn()
});

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn().mockReturnValue({ data: [] }),
    putImageData: jest.fn(),
    createImageData: jest.fn().mockReturnValue([]),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 0 }),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    filter: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1
});

// Mock devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
    value: 2,
    writable: true
});

// =====================================================
// GLOBAL TEST UTILITIES
// =====================================================

// Reset localStorage before each test
beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
    // Clean up any DOM elements added during tests
    document.body.innerHTML = '';
});

// =====================================================
// CUSTOM MATCHERS
// =====================================================

expect.extend({
    toBeValidShot(received) {
        const hasPosition = received.position &&
            typeof received.position.x === 'number' &&
            typeof received.position.y === 'number';
        const hasTeam = received.team === 'home' || received.team === 'away';
        const hasType = ['GOAL!', 'Shot On Target', 'Shot Off Target'].includes(received.type);
        const hasHalf = received.half === '1st Half' || received.half === '2nd Half';

        const pass = hasPosition && hasTeam && hasType && hasHalf;

        return {
            pass,
            message: () => pass
                ? `Expected shot not to be valid`
                : `Expected shot to be valid but got: ${JSON.stringify(received, null, 2)}`
        };
    },

    toBeWithinFieldBounds(received) {
        const x = received.x || received.position?.x;
        const y = received.y || received.position?.y;
        const pass = x >= 0 && x <= 105 && y >= 0 && y <= 68;

        return {
            pass,
            message: () => pass
                ? `Expected position not to be within field bounds`
                : `Expected position (${x}, ${y}) to be within field bounds (0-105, 0-68)`
        };
    }
});

// =====================================================
// CONSOLE SUPPRESSION (optional - uncomment if needed)
// =====================================================

// Suppress console.log during tests (uncomment to enable)
// const originalLog = console.log;
// beforeAll(() => {
//     console.log = jest.fn();
// });
// afterAll(() => {
//     console.log = originalLog;
// });
