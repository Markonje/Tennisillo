import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  // No tests yet in Sprint 1 — NestJS e2e/unit tests added from Sprint 2 onward.
  passWithNoTests: true,
};

export default config;
