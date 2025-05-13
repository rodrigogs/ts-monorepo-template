import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AIAgent } from './agent.js'
import { AI } from './ai.js'
import { Resolver } from './resolver.js'
import type { AIAgentOptions, ClientOptions } from './types.js'

// Setup mocks
vi.mock('./resolver.js', () => ({
  Resolver: {
    resolveClient: vi.fn().mockReturnValue({
      useModel: vi.fn().mockReturnValue({
        invoke: vi.fn(),
      }),
    }),
  },
}))

vi.mock('./agent.js', () => ({
  AIAgent: vi.fn().mockImplementation(() => ({
    run: vi.fn(),
    updateContext: vi.fn(),
  })),
}))

describe('AI', () => {
  const originalEnv = process.env
  let ai: AI

  beforeEach(() => {
    // Reset the mocks
    vi.clearAllMocks()

    // Reset process.env for each test
    process.env = { ...originalEnv }

    // Create a new AI instance
    ai = new AI()
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
  })

  describe('getClient', () => {
    it('should resolve client with explicit provider and model', () => {
      const options: ClientOptions = {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
      }

      const client = ai.getClient(options)

      expect(client).toBeDefined()
      expect(Resolver.resolveClient).toHaveBeenCalledWith(
        'openai',
        'gpt-3.5-turbo',
      )
    })

    it('should fallback to env vars when options are not provided', () => {
      process.env.DEFAULT_PROVIDER = 'anthropic'
      process.env.DEFAULT_MODEL = 'claude-2'

      const client = ai.getClient()

      expect(client).toBeDefined()
      expect(Resolver.resolveClient).toHaveBeenCalledWith(
        'anthropic',
        'claude-2',
      )
    })

    it('should throw error when provider and model are not specified', () => {
      // Clear relevant env vars
      delete process.env.DEFAULT_PROVIDER
      delete process.env.DEFAULT_MODEL

      expect(() => ai.getClient()).toThrow('No provider or model specified')
      expect(Resolver.resolveClient).not.toHaveBeenCalled()
    })

    it('should throw error when only provider is specified', () => {
      // Set only provider
      process.env.DEFAULT_PROVIDER = 'openai'
      delete process.env.DEFAULT_MODEL

      expect(() => ai.getClient()).toThrow('No provider or model specified')
      expect(Resolver.resolveClient).not.toHaveBeenCalled()
    })

    it('should throw error when only model is specified', () => {
      // Set only model
      delete process.env.DEFAULT_PROVIDER
      process.env.DEFAULT_MODEL = 'gpt-3.5-turbo'

      expect(() => ai.getClient()).toThrow('No provider or model specified')
      expect(Resolver.resolveClient).not.toHaveBeenCalled()
    })
  })

  describe('createAgent', () => {
    it('should create an AIAgent with the correct options', () => {
      // Setup options
      const options = {
        name: 'test-agent',
        provider: 'openai',
        model: 'gpt-4',
        responseFormat: {},
      } as AIAgentOptions<any>

      const mockClient = { useModel: vi.fn() }
      vi.spyOn(ai, 'getClient').mockReturnValue(mockClient)

      const agent = ai.createAgent(options)

      expect(agent).toBeDefined()
      expect(AIAgent).toHaveBeenCalledWith({
        ...options,
        client: mockClient,
      })

      // Update this expectation to match how it's actually called
      expect(ai.getClient).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4',
        }),
      )
    })
  })
})
