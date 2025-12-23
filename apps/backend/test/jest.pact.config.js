module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/../src'],
  testMatch: [
    '**/*.pact.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^@lib/(.*)$': '<rootDir>/../src/lib/$1',
    '^@modules/(.*)$': '<rootDir>/../src/modules/$1',
  },
};