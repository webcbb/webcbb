module.exports = {
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/spec/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'target/coverage',
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        'suiteName': '@wesib/wesib',
        'outputDirectory': './target/test-results',
        'classNameTemplate': '{classname}: {title}',
        'titleTemplate': '{classname}: {title}',
        'ancestorSeparator': ' › ',
        'usePathForSuiteName': 'true',
      },
    ],
  ],
  restoreMocks: true,
  testEnvironment: "jest-environment-jsdom-fifteen",
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.spec.json',
    },
  },
};