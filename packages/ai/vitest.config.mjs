/* eslint-disable import/no-default-export */
import vitestConfig from '@repo/test/vitest.config.mjs'
import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'

const dirname = import.meta.dirname
const envPath = `${dirname}/.env.test.local`

const { parsed: env } = dotenv.config({ path: envPath })

export default defineConfig({
  ...vitestConfig,
  test: {
    ...vitestConfig.test,
    env: {
      ...vitestConfig.test.env,
      ...env,
    },
    testTimeout: 30000,
  },
})
