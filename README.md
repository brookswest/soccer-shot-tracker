# Intent Soccer Shot Tracker

A soccer shot tracking application for recording and analyzing game statistics.

## Features

- Track shots by team (home/away)
- Record shot types (Goal, On Target, Off Target)
- Visual shot map with field overlay
- Heat map visualization for shot density
- Game history with statistics
- PDF export for game reports
- Wake lock to prevent screen dimming during matches

## Testing

### Prerequisites

```bash
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI environment (with JUnit output)
npm run test:ci
```

### Test Structure

```
tests/
├── setup.js              # Jest setup and global mocks
├── fixtures/
│   └── mockShots.js      # Test data fixtures
├── __mocks__/
│   └── supabase.js       # Supabase client mock
├── unit/
│   ├── shotValidation.test.js    # Shot data validation tests
│   └── statsCalculation.test.js  # Statistics calculation tests
└── integration/
    ├── shotTracking.test.js      # Shot creation and tracking tests
    ├── heatMap.test.js           # Heat map feature tests
    └── filtering.test.js         # Filter functionality tests
```

### Test Fixtures

The test suite includes various datasets for different testing scenarios:

- `emptyShots` - Empty dataset (0 shots)
- `smallDataset` - 5 shots for basic tests
- `mediumDataset` - 15 shots, triggers heat map (10+ threshold)
- `largeDataset` - 100 shots for performance testing
- `heatMapTestData` - Clustered shots for heat map visualization tests
- `homeTeamOnly` / `awayTeamOnly` - Single team datasets
- `invalidShots` - Invalid data for error handling tests
- `boundaryShots` - Shots at field boundaries

### Coverage Targets

- Branches: 70%
- Functions: 70%
- Lines: 80%
- Statements: 80%

### Mocking

The test suite includes comprehensive mocks for:

- **Browser APIs**: localStorage, sessionStorage, matchMedia, canvas context
- **Wake Lock API**: For screen wake lock testing
- **Supabase Client**: Full mock with auth and database operations

### Custom Matchers

```javascript
// Check if shot has valid structure
expect(shot).toBeValidShot();

// Check if position is within field bounds (0-105 x 0-68)
expect(shot).toBeWithinFieldBounds();
```

## Development

### Generate Test Data

```bash
# Generate 50 shots for testing
npm run generate-shots -- --count 50 --email user@example.com --password yourpassword

# Generate specific scenario
npm run generate-shots -- --scenario heat-test --email user@example.com --password yourpassword
```

Available scenarios: `realistic`, `all-goals`, `all-misses`, `heat-test`

## CI/CD

Tests run automatically on push and pull requests via GitHub Actions. The workflow:

1. Runs tests on Node.js 18.x and 20.x
2. Generates coverage reports
3. Uploads coverage to Codecov
4. Uploads test artifacts (coverage, JUnit results)

## License

ISC
