import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',

  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],

  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },

  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  testMatch: ['**/*.spec.ts']
};

export default config;
