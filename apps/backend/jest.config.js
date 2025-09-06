// apps/backend/jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/*(*.)@(spec|test).ts',     // 单元测试
    '<rootDir>/src/**/*(*.)@(e2e-spec|e2e-test).ts' // E2E 测试
  ],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node'
};