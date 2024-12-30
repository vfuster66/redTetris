export default {
    transform: {
      '^.+\\.m?[tj]sx?$': 'babel-jest', // Transforme les fichiers JS/TS avec Babel
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'mjs'],
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    coverageThreshold: {
      global: {
        statements: 70,
        branches: 50,
        functions: 70,
        lines: 70,
      },
    },
    coveragePathIgnorePatterns: ['/node_modules/', '/tests/', '/dist/'],
  };
  