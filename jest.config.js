/** @type {import('jest').Config} */
module.exports = {
  roots: ['<rootDir>/tests', '<rootDir>/__tests__'],

  // Coverage configuration
  // Note: docs/app.js is tested via JSDOM eval() (not require()), so Jest's
  // V8 coverage provider cannot instrument it directly. Coverage here tracks
  // the shared modules that ARE loaded through require/import paths.
  // As tests migrate to direct require() loading, coverage will expand.
  collectCoverageFrom: [
    'docs/shared/**/*.js',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'json-summary',
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  verbose: true,
};
