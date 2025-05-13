// Vitest imports
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Now import the module under test
import { Resolver } from './resolver.js'
import type { Model, Provider } from './types.js'

vi.mock('@repo/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))

// Store original env
const originalEnv = process.env

describe('Resolver', () => {
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks()

    // Setup environment variables
    process.env = {
      ...originalEnv,
      DEEPSEEK_API_URL: 'https://api.deepseek.com',
      DEEPSEEK_API_KEY: 'test-deepseek-key',
    }
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('resolveClient', () => {
    it('should resolve OpenAI GPT-3.5 client', () => {
      // Test the actual implementation
      const client = Resolver.resolveClient('openai', 'gpt-3.5-turbo')

      // Verify we got a client back
      expect(client).toBeDefined()
      expect(client.useModel).toBeDefined()
    })

    it('should resolve OpenAI GPT-4o client', () => {
      // Test the actual implementation
      const client = Resolver.resolveClient('openai', 'gpt-4o')

      // Verify we got a client back
      expect(client).toBeDefined()
      expect(client.useModel).toBeDefined()
    })

    it('should resolve OpenAI GPT-4o-mini client', () => {
      // Test the actual implementation
      const client = Resolver.resolveClient('openai', 'gpt-4o-mini')

      // Verify we got a client back
      expect(client).toBeDefined()
      expect(client.useModel).toBeDefined()
    })

    it('should resolve DeepSeek chat client', () => {
      // Test the actual implementation
      const client = Resolver.resolveClient('deepseek', 'deepseek-chat')

      // Verify we got a client back
      expect(client).toBeDefined()
      expect(client.useModel).toBeDefined()
    })

    it('should resolve DeepSeek reasoner client', () => {
      // Test the actual implementation
      const client = Resolver.resolveClient('deepseek', 'deepseek-reasoner')

      // Verify we got a client back
      expect(client).toBeDefined()
      expect(client.useModel).toBeDefined()
    })

    it('should throw an error for unknown provider/model combination', () => {
      // Test the actual error handling
      expect(() =>
        Resolver.resolveClient('unknown' as Provider, 'model' as Model),
      ).toThrow('Client not found for model "unknown.model"')
    })
  })
})
