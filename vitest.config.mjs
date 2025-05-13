/* eslint-disable import/no-default-export */
import vitestConfig from '@repo/test/vitest.config.mjs'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  ...vitestConfig,
  test: {
    ...vitestConfig.test,
    include: [
      'apps/**/*.test.ts',
      'apps/**/*.spec.ts',
      'packages/**/*.test.ts',
      'packages/**/*.spec.ts',
    ],
  },
})
